import { EventEmitter } from "events";
/**
 * Returns a promise that resolves with an array of arguments when an event transpires.
 * @param emitter The EventEmitter to wait for.
 * @param event The event to wait for.
 */
export function waitForEvent(emitter: EventEmitter, event: string): Promise<IArguments> {
    return new Promise((res, rej) => emitter.once(event, function() {
        res(arguments);
    }));
}
