import { IOAble, IOReadable, IOWritable, isReadable, isWritable } from "../../models/IO";
import { EventEmitter } from "events";
import { waitForEvent } from "../helpers/wait";

/**
 * A class for interfacing with something that has i/o.
 */
export class Tube extends EventEmitter {

    private io: IOAble;
    private outBuffer: Buffer;

    /**
     * Constructs a tube from an i/o object.
     * @constructor
     * @param  {IOAble} io
     */
    constructor(io: IOAble) {
        super();
        this.io = io;
        this.outBuffer = Buffer.alloc(0);
        if (isReadable(this.io)) {
            let that: Tube = this;
            this.io.output.on("data", function(data: Buffer | string) {
                console.log("got data");
                if (typeof data == "string") {
                    data = Buffer.from(data);
                }
                that.outBuffer = Buffer.concat([that.outBuffer, data], that.outBuffer.length + data.length);
                that.emit("data", data);
            });
            this.io.output.on("close", function() {
                that.emit("data", Buffer.alloc(0));
            });
        }
    }

    /**
     * Receive up to a certain number of bytes. Returns when any amount of data is received.
     * @param bytes The number of bytes to receive.
     */
    async recv(bytes: number = 4096): Promise<Buffer> {
        if (this.outBuffer.length == 0) {
            await waitForEvent(this, "data");
        }
        console.log("receiving");
        let first: Buffer = this.outBuffer.slice(0, bytes);
        let second: Buffer = this.outBuffer.slice(bytes);
        this.outBuffer = second;
        return first;
    }
}
