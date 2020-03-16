import { Readable, Writable } from "stream";

/**
 * A readable IO object.
 */
export interface IOReadable {
    /**
     * The output.
     */
    output: Readable;
}

/**
 * A writable IO object.
 */
export interface IOWritable {
    /**
     * The input.
     */
    input: Writable;
}

/**
 * A destroyable IO object.
 */
export interface IODestroyable {
    /**
     * Destroys the IO object.
     */
    destroy: () => Promise<any>;
}

/**
 * Checks if an IOAble object is readable.
 * @param io The IO object to check.
 */
export function isReadable(io: IOAble): io is IOReadable {
    return (io as IOReadable).output != undefined;
}

/**
 * Checks if an IOAble object is writable.
 * @param io The IO object to check.
 */
export function isWritable(io: IOAble): io is IOWritable {
    return (io as IOWritable).input != undefined;
}

/**
 * Checks if an IOAble object is destroyable.
 * @param io The IO object to check.
 */
export function isDestroyable(io: IOAble): io is IODestroyable {
    return (io as IODestroyable).destroy != undefined;
}

/**
 * An IO object that is readable, writable, or destroyable.
 */
export type IOAble = IOReadable | IOWritable | IODestroyable;
/**
 * An IO object that is readable, writable, and destroyable.
 */
export type IOFull = IOReadable & IOWritable & IODestroyable;

/**
 * An IO object that has been destroyed.
 */
export const IODestroyed: IODestroyable = {
    destroy: async () => { throw new Error("Cannot re-destroy IO object."); }
};
