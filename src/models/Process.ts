import { IOFull } from "./IO";
import { Readable, Writable, PassThrough, Duplex } from "stream";
import { EventEmitter } from "events";

/**
 * A process.
 */
export interface Process extends EventEmitter {
    /**
     * The stdout of the process.
     */
    stdout: Readable;
    /**
     * The stdin of the process.
     */
    stdin: Writable;
    /**
     * The stderr of the process. Optional.
     */
    stderr: Readable | null;
    /**
     * Kill the process.
     * @param signal The signal to send to the process.
     */
    kill: (signal?: string) => void;
}

/**
 * Creates an IOAble object from a process.
 * @param p The process.
 * @return The IOAble object.
 */
export function IOFromProcess(p: Process): IOFull {
    let outStream: Duplex = new PassThrough();
    let streams: Readable[] = [p.stdout];
    if (p.stderr) {
        streams.push(p.stderr);
    }
    let unfinished: Readable[] = streams;
    function decrement(this: Readable) {
        let index: number = unfinished.indexOf(this);
        if (index != -1) {
            unfinished.splice(index, 1);
        }
        if (unfinished.length == 0) {
            outStream.destroy();
        }
    }
    for (const stream of streams) {
        stream.pipe(outStream, {
            end: false
        });
        stream.once("close", decrement);
        stream.once("end", decrement);
    }
    return {
        output: outStream,
        input: p.stdin,
        destroy: async () => p.kill(),
        orig: p
    };
}
