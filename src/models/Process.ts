import { IOFull } from "./IO";
import { Readable, Writable, PassThrough, Duplex } from "stream";

/**
 * A process.
 */
export interface Process {
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

export function IOFromProcess(p: Process): IOFull {
    let outStream: Duplex = new PassThrough();
    let streams: Array<Readable> = [p.stdout];
    if (p.stderr) {
        streams.push(p.stderr);
    }
    let unfinished: number = streams.length;
    for (const stream of streams) {
        stream.pipe(outStream, {
            end: false
        });
        stream.once("end", function() {
            unfinished --;
            if (unfinished === 0) {
                outStream.end();
            }
        });
    }
    return {
        output: outStream,
        input: p.stdin,
        destroy: p.kill
    };
}
