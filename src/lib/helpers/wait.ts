import { EventEmitter } from "events";

/**
 * Returns a promise that resolves with an array of arguments when an event transpires.
 * @param emitter The EventEmitter to wait for.
 * @param event The event to wait for.
 * @param timeout The timeout, in milliseconds, to stop waiting for the event. Provide a negative number for no timeout.
 * @param reject If set to true, the promise will reject when the timeout hits instead of resolving to null.
 * @returns A promise that resolves with an array of values used to call the event.
 */
export function waitForEvent(
    emitter: EventEmitter,
    event: string,
    timeout: number = -1,
    reject: boolean = false
): Promise<IArguments | null> {
    return new Promise((res, rej) => {
        if (timeout >= 0) {
            setTimeout(function() {
                if (reject) {
                    rej("Hit timeout before event.");
                } else {
                    res(null);
                }
            }, timeout);
        }
        emitter.once(event, function() {
            res(arguments);
        });
    });
}

/**
 * Waits for a period of time.
 * @param time Time in milliseconds.
 * @return A promise that resolves after the time is over.
 */
export function waitForTime(time: number): Promise<void> {
    return new Promise((res, rej) => {
        setTimeout(function() {
            res();
        }, time);
    });
}
