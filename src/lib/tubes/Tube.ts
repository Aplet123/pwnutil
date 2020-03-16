import {
    IOAble,
    IOReadable,
    IOWritable,
    isReadable,
    isWritable,
    isDestroyable,
    IODestroyed
} from "../../models/IO";
import { EventEmitter } from "events";
import { waitForEvent, waitForTime } from "../helpers/wait";
import { Stringable } from "../../models/Stringable";

/**
 * A class for interfacing with something that has i/o.
 *
 * Be aware that this class may heavily suffer from race conditions so do not attempt to use it concurrently.
 */
export class Tube extends EventEmitter {
    /**
     * The IO object the tube is wrapping around.
     */
    private io: IOAble;
    /**
     * The buffered data.
     */
    private outBuffer: Buffer;

    /**
     * Constructs a tube from an i/o object.
     * @constructor
     * @param io The IOAble object.
     */
    constructor(io: IOAble) {
        super();
        this.io = io;
        this.outBuffer = Buffer.alloc(0);
        if (isReadable(this.io)) {
            let that: Tube = this;
            this.io.output.on("data", function(data: Buffer | string) {
                if (typeof data == "string") {
                    data = Buffer.from(data);
                }
                that.outBuffer = Buffer.concat(
                    [that.outBuffer, data],
                    that.outBuffer.length + data.length
                );
                that.emit("data", data);
            });
            this.io.output.on("close", function() {
                that.emit("data", Buffer.alloc(0));
                that.io.output = undefined;
            });
        }
    }

    /**
     * Checks if the io object is connected in a direction.
     * @param direction Direction to check. Can be "in", "read", "recv", "out", "send", "write", "any", "either", "both".
     * @return If the io object is connected in the specified direction.
     */
    connected(direction: string): boolean {
        if (["in", "read", "recv"].includes(direction)) {
            if (isReadable(this.io) || this.outBuffer.length > 0) {
                return true;
            }
            return false;
        }
        if (["out", "send", "write"].includes(direction)) {
            if (isWritable(this.io)) {
                return true;
            }
            return false;
        }
        if (["any", "either"].includes(direction)) {
            return this.connected("in") || this.connected("out");
        }
        if (["both"].includes(direction)) {
            return this.connected("in") && this.connected("out");
        }
        throw new Error("Invalid direction");
    }

    /**
     * Receive up to a certain number of bytes. Returns when any amount of data is received.
     * @param bytes The number of bytes to receive.
     * @param timeout The time, in seconds, to stop waiting for data and to timeout.
     * @return The data received.
     */
    async recv(bytes: number = 4096, timeout: number = 15): Promise<Buffer> {
        if (!this.connected("in")) {
            throw new Error("Cannot read from io object.");
        }
        if (this.outBuffer.length == 0) {
            await waitForEvent(this, "data", timeout * 1000);
        }
        let first: Buffer = this.outBuffer.slice(0, bytes);
        let second: Buffer = this.outBuffer.slice(bytes);
        this.outBuffer = second;
        return first;
    }

    /**
     * Equivalent to `recv` but decodes the buffer to a string.
     * @param bytes The number of bytes to receive.
     * @param timeout The time, in seconds, to stop waiting for data and to timeout.
     * @param encoding The encoding to use.
     * @return The data received.
     */
    async recvS(
        bytes: number = 4096,
        timeout: number = 15,
        encoding: string = "utf8"
    ): Promise<string> {
        return (await this.recv(bytes, timeout)).toString(encoding);
    }

    /**
     * Keep receiving data until the output closes.
     * @return The data received.
     */
    async recvall(): Promise<Buffer> {
        if (!this.connected("in")) {
            throw new Error("Cannot read from io object.");
        }
        await waitForEvent((this.io as IOReadable).output, "close", -1);
        const ret: Buffer = this.outBuffer;
        this.outBuffer = Buffer.alloc(0);
        return ret;
    }

    /**
     * Equivalent to `recvall` but decodes the buffer to a string.
     * @param encoding The encoding to use.
     * @return The data received.
     */
    async recvallS(encoding: string = "utf8"): Promise<string> {
        return (await this.recvall()).toString(encoding);
    }

    /**
     * Receive data until a deliminator is encountered.
     * @param delims Array of deliminators or one deliminator.
     * @param timeout The time, in seconds, to stop waiting for data and to timeout.
     * @param throwIncomplete If true, an error will be thrown on timeout. Otherwise, all data received will be returned.
     */
    async recvuntil(
        delims: Stringable | Array<Stringable>,
        timeout: number = 15,
        throwIncomplete: boolean = true
    ) {
        if (!this.connected("in")) {
            throw new Error("Cannot read from io object.");
        }
        if (!(delims instanceof Array)) {
            delims = [delims];
        }
        let resolve: (v: any) => void = _ => undefined;
        const prom: Promise<any> = new Promise(res => resolve = res);
        waitForTime(timeout * 1000, prom, true).then(resolve);
        const that: Tube = this;
        function dataHandler(): void {
            let indices: Array<[Stringable, number]> = (delims as Array<Stringable>).map(v => [v, that.outBuffer.indexOf(v)]);
            indices = indices.filter(v => v[1] != -1).sort((a, b) => a[1] - b[1]);
            if (indices.length != 0) {
                console.log("resolving");
                resolve(0);
            }
            waitForEvent(that, "data", prom, true).then(dataHandler);
        };
        waitForEvent(that, "data", prom, true).then(dataHandler);
        await waitForEvent(this, "close", prom, true);
        let indices: Array<[Stringable, number]> = (delims as Array<Stringable>).map(v => [v, this.outBuffer.indexOf(v)]);
        indices = indices.filter(v => v[1] != -1).sort((a, b) => a[1] - b[1]);
        if (indices.length == 0) {
            if (throwIncomplete) {
                throw new Error("Did not read deliminator before io stream closed.");
            } else {
                const ret: Buffer = this.outBuffer;
                this.outBuffer = Buffer.alloc(0);
                return ret;
            }
        } else {
            const index: number = indices[0][1] + indices[0][0].length;
            return await this.recv(index);
        }
    }

    /**
     * Returns true if there is data that can be received.
     * @param timeout The time, in seconds, to wait for.
     * @return If there is data that can be received.
     */
    async canRecv(timeout: number = 0): Promise<boolean> {
        await waitForEvent(this, "data", Math.max(timeout * 1000, 0));
        return this.outBuffer.length > 0;
    }

    /**
     * Gets rid of all remaining output of the tube by receiving data until there is none left.
     * @param timeout The timeout to pass to recv. If set to 0, the internal buffer will be cleared.
     * @return The data that was cleaned.
     */
    async clean(timeout: number = 0.05): Promise<Buffer> {
        if (timeout <= 0) {
            const ret: Buffer = this.outBuffer;
            this.outBuffer = Buffer.alloc(0);
            return ret;
        }
        let ret: Buffer = Buffer.alloc(0);
        let data: Buffer;
        while ((data = await this.recv(4096, timeout)).length) {
            ret = Buffer.concat([ret, data], ret.length + data.length);
        }
        return ret;
    }

    /**
     * Closes the io if possible.
     */
    async close(): Promise<void> {
        if (isDestroyable(this.io)) {
            await this.io.destroy();
        }
        this.io = IODestroyed;
    }
}
