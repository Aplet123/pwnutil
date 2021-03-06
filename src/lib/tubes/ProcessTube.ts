import { Tube } from "./Tube";
import child_process from "child_process";
import { Process, IOFromProcess } from "../../models/Process";
import { aliasClass } from "../helpers/alias";

/**
 * A set of options for the ProcessTube class.
 */
export interface ProcessTubeOptions {
    /**
     * If set to false, the executable will be run with `stdbuf -i0 -o0 -e0`.
     * Defaults to false.
     */
    buffered?: boolean;
}

/**
 * A class that generates a tube by running a file or command.
 */
export class ProcessTube extends Tube {
    private proc: Process;

    /**
     * Generates a process tube.
     * @constructor
     * @param command The command to run.
     * @param args An array of command line arguments.
     * @param options Options to pass to the tube. See `ProcessTubeOptions`.
     * @param childOptions Any options to pass to `child_process.spawn()`.
     */
    constructor(
        command: string,
        args: string[] = [],
        options: ProcessTubeOptions = {},
        childOptions: child_process.SpawnOptions = {}
    ) {
        options = Object.assign(
            {
                buffered: false
            },
            options
        );
        if (!options.buffered) {
            args = ["-i0", "-o0", "-e0", command, ...args];
            command = "stdbuf";
        }
        const proc: Process = child_process.spawn(
            command,
            args,
            childOptions
        ) as Process;
        super(IOFromProcess(proc));
        this.proc = proc;
        proc.on("exit", function() {
            // proc.stdin.destroy();
            // proc.stdout.destroy();
            // proc.stderr?.destroy();
        });
    }
}

/**
 * An alias for ProcessTube that doesn't require `new`.
 * @param args Any arguments to pass on to ProcessTube.
 * @return A ProcessTube instance.
 */
export function proc(...args: any[]) {
    return aliasClass(ProcessTube, args);
}
