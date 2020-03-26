/**
 * Sets up the workspace for fast pwn scripts by writing functions into the global context and enabling internal logging.
 * @param f A function that will be called after loading everything into the global context.
 */
export function pwn(f) {
    Object.assign(global, require("../../index.js"));
    LogContext.internal = true;
    logInternal("Pwnutil loaded into global context.");
    if(typeof f == "function") {
        f();
    }
}
