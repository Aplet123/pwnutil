import { EventEmitter } from "events";

/**
 * Returns a promise that resolves with an array of arguments when an event transpires.
 * @param emitter The EventEmitter to wait for.
 * @param event The event to wait for.
 * @param expire The timeout, in milliseconds, to stop waiting for the event. Provide a negative number for no timeout. Alternatively, provide a promise.
 * @param reject If set to true, the promise will reject when the timeout hits instead of resolving to null.
 * @returns A promise that resolves with an array of values used to call the event.
 */
export function waitForEvent(
    emitter: EventEmitter,
    event: string,
    timeout: number | Promise<any> = -1,
    reject: boolean = false
): Promise<IArguments | null> {
    return new Promise((res, rej) => {
        let to: NodeJS.Timeout;
        function handler(x: any) {
            if (to) {
                clearTimeout(to);
            }
            if (reject) {
                rej("Hit timeout before event.");
            } else {
                res(arguments);
            }
        }
        if (typeof timeout == "number") {
            if (timeout >= 0) {
                to = setTimeout(function() {
                    if (reject) {
                        rej("Hit timeout before event.");
                    } else {
                        res(null);
                    }
                }, timeout);
            }
        } else {
            timeout.then(v => {
                emitter.off(event, handler);
                handler(v);
            });
        }
        emitter.once(event, handler);
    });
}

/**
 * Waits for a period of time.
 * @param time Time in milliseconds.
 * @param expire A promise that will end the timer when it resolves.
 * @param reject If the promise should be rejected when the `expire` promise resolves.
 * @return A promise that resolves with true if the time was over, or false if the promise resolved first.
 */
export function waitForTime(time: number, expire?: Promise<any>, reject: boolean = false): Promise<boolean> {
    return new Promise((res, rej) => {
        let to: NodeJS.Timeout;
        to = setTimeout(function() {
            res(true);
        }, time);
        if (expire) {
            expire.then(v => {
                clearTimeout(to);
                if (reject) {
                    rej("Promise resolved before timer.");
                } else {
                    res(false);
                }
            });
        }
    });
}
