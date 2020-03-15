import { Tube } from "./Tube";
import child_process from "child_process";
import { Process, IOFromProcess } from "../../models/Process";

/**
 * A class that generates a tube by running a process.
 */
export class ProcessTube extends Tube {
    /**
     * Generates a process tube.
     * @constructor
     * @param command The command to run.
     * @param args An array of command line arguments.
     * @param options Any options to pass to `child_process.spawn()`.
     */
    constructor(command: string, args: Array<string> = [], options: child_process.SpawnOptions) {
        const proc: Process = child_process.spawn(command, args, options) as Process;
        super(IOFromProcess(proc));
    }
}