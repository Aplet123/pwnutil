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
import { logInternal } from "../util/logger";
import { createInterface, ReadLine } from "readline";

/**
 * The interface for TubeContext.
 */
export interface TubeContextInterface {
    /**
     * The default max bytes read in by functions like `recv`.
     */
    bytes: number;
    /**
     * The default timeout used by functions like `recvuntil`.
     */
    longTimeout: number;
    /**
     * The default timeout used by functions like `clean`.
     */
    shortTimeout: number;
    /**
     * The default timeout used by functions like `canRecv`.
     */
    noTimeout: number;
    /**
     * The encoding to decode buffers with for functions like `recvS`.
     */
    encoding: string;
    /**
     * If an error should be thrown if a deliminator can't be found in a function like `recvuntil`.
     */
    throwIncomplete: boolean;
    /**
     * How no deliminator should be handled in a function like `recvline`.
     */
    handleIncomplete: "return" | "buffer" | "throw";
    /**
     * The line endings for functions like `recvline`.
     */
    lineEnding: Stringable;
    /**
     * If line endings should be kept for functions like `recvline`.
     */
    keepEnds: boolean;
}

/**
 * The context for the tube functions which contains all the default arguments.
 *
 * Refer to TubeContextInterface.
 */
const TubeContext: TubeContextInterface = {
    bytes: 4096,
    longTimeout: 15,
    shortTimeout: 0.05,
    noTimeout: 0,
    encoding: "utf8",
    throwIncomplete: true,
    handleIncomplete: "return",
    lineEnding: "\n",
    keepEnds: false
};

export { TubeContext };

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
     * Connects the output of this tube to the input of another tube.
     * @param other Tube to connect to.
     */
    connectOutput(other: Tube): void {
        if (isReadable(this.io) && isWritable(other.io)) {
            this.io.output.pipe(other.io.input);
        } else {
            throw new Error("Must connect a readable tube to a writable tube.");
        }
    }

    /**
     * Connects the output of another tube to the input of this tube.
     * @param other Tube to connect to.
     */
    connectInput(other: Tube): void {
        other.connectOutput(this);
    }

    /**
     * Connects both ends of the tube to another tube.
     * @param other Tube to connect to.
     */
    connectBoth(other: Tube): void {
        this.connectInput(other);
        this.connectOutput(other);
    }

    /**
     * Alias for `connectOutput`.
     * @param other Tube to connect to.
     */
    pipe(other: Tube): void {
        this.connectOutput(other);
    }

    /**
     * Alias for `connectInput`.
     * @param other Tube to connect to.
     */
    pipeFrom(other: Tube): void {
        this.connectInput(other);
    }

    /**
     * Alias for `connectBoth`.
     * @param other Tube to connect to.
     */
    pipeBoth(other: Tube): void {
        this.connectBoth(other);
    }

    /**
     * Receive up to a certain number of bytes. Returns when any amount of data is received.
     * @param bytes The number of bytes to receive.
     * @param timeout The time, in seconds, to stop waiting for data and to timeout.
     * @return The data received.
     */
    async recv(
        bytes: number = TubeContext.bytes,
        timeout: number = TubeContext.longTimeout
    ): Promise<Buffer> {
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
        bytes: number = TubeContext.bytes,
        timeout: number = TubeContext.longTimeout,
        encoding: string = TubeContext.encoding
    ): Promise<string> {
        return (await this.recv(bytes, timeout)).toString(encoding);
    }

    /**
     * Inserts data back into the start of the data buffer.
     * @param data Data to insert.
     */
    unrecv(data: Stringable): void {
        if (typeof data == "string") {
            data = Buffer.from(data);
        }
        this.outBuffer = Buffer.concat(
            [data, this.outBuffer],
            data.length + this.outBuffer.length
        );
    }

    /**
     * Keep receiving data until the output closes.
     * @return The data received.
     */
    async recvall(): Promise<Buffer> {
        if (!this.connected("in")) {
            throw new Error("Cannot read from io object.");
        }
        logInternal("Receiving all data...");
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
    async recvallS(encoding: string = TubeContext.encoding): Promise<string> {
        return (await this.recvall()).toString(encoding);
    }

    /**
     * Receive data until a deliminator is encountered.
     * @param delims Array of deliminators or one deliminator.
     * @param timeout The time, in seconds, to stop waiting for data and to timeout.
     * @param throwIncomplete If true, an error will be thrown on timeout and data will be buffered. Otherwise, all data received will be returned.
     * @return The data received.
     */
    recvuntil(
        delims: Stringable | Stringable[],
        timeout: number = TubeContext.longTimeout,
        handleIncomplete:
            | "return"
            | "buffer"
            | "throw" = TubeContext.handleIncomplete
    ): Promise<Buffer> {
        let that: Tube = this;
        let prom: Promise<Buffer> = new Promise(async function(res, rej) {
            if (!that.connected("in")) {
                throw new Error("Cannot read from io object.");
            }
            let ret: Buffer = Buffer.alloc(0);
            let graceful: boolean = false;
            let shouldContinue: boolean = true;
            let resolve: () => void = () => undefined;
            waitForTime(
                timeout * 1000,
                new Promise((resf, rejf) => (resolve = resf))
            ).then(v => {
                if (graceful) {
                    return;
                }
                if (handleIncomplete == "buffer") {
                    that.unrecv(ret);
                } else if (handleIncomplete == "throw") {
                    that.unrecv(ret);
                    rej("Timeout before reaching deliminator.");
                } else {
                    res(ret);
                }
                shouldContinue = false;
            });
            if (!(delims instanceof Array)) {
                delims = [delims];
            }
            while (shouldContinue) {
                if (!that.connected("in")) {
                    resolve();
                    break;
                }
                let dat: Buffer = await that.recv();
                ret = Buffer.concat([ret, dat], ret.length + dat.length);
                let indices: [Stringable, number][] = delims.map(v => [
                    v,
                    ret.indexOf(v)
                ]);
                indices = indices
                    .filter(v => v[1] != -1)
                    .sort((a, b) => a[1] - b[1]);
                if (indices.length != 0) {
                    const first: Buffer = ret.slice(
                        0,
                        indices[0][1] + indices[0][0].length
                    );
                    const second: Buffer = ret.slice(
                        indices[0][1] + indices[0][0].length
                    );
                    that.outBuffer = second;
                    ret = first;
                    graceful = true;
                    break;
                }
            }
            resolve();
            if (graceful) {
                res(ret);
            }
        });
        return prom;
    }

    /**
     * Equivalent to `recvuntil` but decodes the buffer to a string.
     * @param delims Array of deliminators or one deliminator.
     * @param timeout The time, in seconds, to stop waiting for data and to timeout.
     * @param throwIncomplete If true, an error will be thrown on timeout. Otherwise, all data received will be returned.
     * @param encoding The encoding to use.
     * @return The data received.
     */
    async recvuntilS(
        delims: Stringable | Stringable[],
        timeout: number = TubeContext.longTimeout,
        handleIncomplete:
            | "return"
            | "buffer"
            | "throw" = TubeContext.handleIncomplete,
        encoding: string = TubeContext.encoding
    ): Promise<string> {
        return (
            await this.recvuntil(delims, timeout, handleIncomplete)
        ).toString(encoding);
    }

    /**
     * Receives a line of data.
     * @param keepends If true, the line ending at the end of the line will be kept.
     * @param timeout The time, in seconds, to stop waiting for the data and to timeout.
     * @param handleIncomplete If "return", the data received will be returned, if "buffer", the data received will be buffered and an empty buffer returned, if "throw", an error will be thrown and data will be buffered.
     * @param lineEnding The line ending to use.
     * @return The data received.
     */
    async recvline(
        keepends: boolean = TubeContext.keepEnds,
        timeout: number = TubeContext.longTimeout,
        handleIncomplete:
            | "return"
            | "buffer"
            | "throw" = TubeContext.handleIncomplete,
        lineEnding: Stringable = TubeContext.lineEnding
    ): Promise<Buffer> {
        let data: Buffer;
        try {
            let data: Buffer = await this.recvuntil(
                lineEnding,
                timeout,
                "throw"
            );
            if (
                !keepends &&
                data.slice(-lineEnding.length).equals(Buffer.from(lineEnding))
            ) {
                data = data.slice(0, data.length - 1);
            }
            return data;
        } catch (err) {
            if (handleIncomplete == "return") {
                const ret: Buffer = this.outBuffer;
                this.outBuffer = Buffer.alloc(0);
                return ret;
            } else if (handleIncomplete == "throw") {
                throw new Error("Could not find a newline.");
            } else {
                return Buffer.alloc(0);
            }
        }
    }

    /**
     * Equivalent to `recvline` but decodes the buffer into a string.
     * @param keepends If true, the line ending at the end of the line will be kept.
     * @param timeout The time, in seconds, to stop waiting for the data and to timeout.
     * @param handleIncomplete If "return", the data received will be returned, if "buffer", the data received will be buffered and an empty buffer returned, if "throw", an error will be thrown and data will be buffered.
     * @param lineEnding The line ending to use.
     * @param encoding The encoding to use.
     * @return The data received.
     */
    async recvlineS(
        keepends: boolean = TubeContext.keepEnds,
        timeout: number = TubeContext.longTimeout,
        handleIncomplete:
            | "return"
            | "buffer"
            | "throw" = TubeContext.handleIncomplete,
        lineEnding: Stringable = TubeContext.lineEnding,
        encoding: string = TubeContext.encoding
    ): Promise<string> {
        return (
            await this.recvline(keepends, timeout, handleIncomplete, lineEnding)
        ).toString(encoding);
    }

    /**
     * Reads lines until a line matches the predicate given.
     * @param pred Function to test lines with.
     * @param keepends If true, the line ending at the end of the line will be kept.
     * @param timeout The time, in seconds, to stop waiting for the data and to timeout.
     * @param handleIncomplete If "return", all data received, including non-matching lines, will be returned, if "buffer", the data received will be buffered and an empty buffer returned, if "throw", an error will be thrown and data will be buffered.
     * @param lineEnding The line ending to use.
     * @param predEncoding The encoding to use to decode the buffer to pass to the predicate function.
     * @return The line that matches the predicate.
     */
    recvlinePred(
        pred: (buf: Buffer, str: string) => boolean,
        keepends: boolean = TubeContext.keepEnds,
        timeout: number = TubeContext.longTimeout,
        handleIncomplete:
            | "return"
            | "buffer"
            | "throw" = TubeContext.handleIncomplete,
        lineEnding: Stringable = TubeContext.lineEnding,
        predEncoding: string = TubeContext.encoding
    ): Promise<Buffer> {
        let that: Tube = this;
        return new Promise(async function (res, rej) {
            let graceful: boolean = false;
            let resolve: () => void = () => undefined;
            let shouldContinue: boolean = true;
            let scrapped: Buffer = Buffer.alloc(0);
            let data: Buffer;
            waitForTime(
                timeout * 1000,
                new Promise((resf, rejf) => (resolve = resf))
            ).then(v => {
                if (graceful) {
                    return;
                }
                if (handleIncomplete == "throw") {
                    rej("Timeout before reaching deliminator.");
                    that.unrecv(scrapped);
                } else if (handleIncomplete == "buffer") {
                    res(Buffer.alloc(0));
                    that.unrecv(scrapped);
                } else {
                    res(Buffer.concat([scrapped, data], scrapped.length + data.length));
                }
                shouldContinue = false;
            });
            while (shouldContinue && that.connected("in") && (data = await that.recvline(keepends, timeout, "buffer", lineEnding)).length) {
                if (pred(data, data.toString(predEncoding))) {
                    res(data);
                    graceful = true;
                    break;
                }
                scrapped = Buffer.concat([scrapped, data], scrapped.length + data.length);
            }
            resolve();
        });
    }

    /**
     * Equivalent to `recvlinePred` but decodes the buffer into a string.
     * @param pred Function to test lines with.
     * @param keepends If true, the line ending at the end of the line will be kept.
     * @param timeout The time, in seconds, to stop waiting for the data and to timeout.
     * @param handleIncomplete If "return", all data received, including non-matching lines, will be returned, if "buffer", the data received will be buffered and an empty buffer returned, if "throw", an error will be thrown and data will be buffered.
     * @param lineEnding The line ending to use.
     * @param predEncoding The encoding to use to decode the buffer to pass to the predicate function.
     * @param encoding The encoding to use.
     * @return The line that matches the predicate.
     */
    async recvlinePredS(
        pred: (buf: Buffer, str: string) => boolean,
        keepends: boolean = TubeContext.keepEnds,
        timeout: number = TubeContext.longTimeout,
        handleIncomplete:
            | "return"
            | "buffer"
            | "throw" = TubeContext.handleIncomplete,
        lineEnding: Stringable = TubeContext.lineEnding,
        predEncoding: string = TubeContext.encoding,
        encoding: string = TubeContext.encoding
    ): Promise<string> {
        return (await this.recvlinePred(pred, keepends, timeout, handleIncomplete, lineEnding, predEncoding)).toString("utf8");
    }

    /**
     * Creates an interactive shell to read from and write to the tube.
     *
     * Currently does nothing.
     */
    async interactive(): Promise<void> {
        // stub
    }

    /**
     * Returns true if there is data that can be received within a timeout.
     * @param timeout The time, in seconds, to wait for.
     * @return If there is data that can be received.
     */
    async canRecv(timeout: number = TubeContext.noTimeout): Promise<boolean> {
        if (this.outBuffer.length > 0) {
            return true;
        }
        await waitForEvent(this, "data", Math.max(timeout * 1000, 0));
        return this.outBuffer.length > 0;
    }

    /**
     * Gets rid of all remaining output of the tube by receiving data until there is none left.
     * @param timeout The timeout to pass to recv. If set to 0, the internal buffer will be cleared.
     * @return The data that was cleaned.
     */
    async clean(timeout: number = TubeContext.shortTimeout): Promise<Buffer> {
        if (timeout <= 0) {
            const ret: Buffer = this.outBuffer;
            this.outBuffer = Buffer.alloc(0);
            return ret;
        }
        let ret: Buffer = Buffer.alloc(0);
        let data: Buffer;
        while (
            this.connected("in") &&
            (data = await this.recv(4096, timeout)).length
        ) {
            ret = Buffer.concat([ret, data], ret.length + data.length);
        }
        return ret;
    }

    /**
     * Equivalent to `clean` but decodes the buffer into a string.
     * @param timeout The timeout to pass to recv. If set to 0, the internal buffer will be cleared.
     * @param encoding The data that was cleaned.
     */
    async cleanS(
        timeout: number = TubeContext.shortTimeout,
        encoding: string = TubeContext.encoding
    ): Promise<string> {
        return (await this.clean(timeout)).toString(encoding);
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
