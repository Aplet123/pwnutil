/**
 * Sets up the workspace for fast pwn scripts by writing functions into the global context and enabling internal logging.
 */
export function pwn() {
    Object.assign(global, require("../../index.js"));
    LogContext.internal = true;
    logInternal("Pwnutil loaded into global context.");
}
