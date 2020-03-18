import * as chalk from "chalk";
import { inspect, InspectOptions } from "util";
import { Writable } from "stream";
import { padLeft } from "./pad";

/**
 * Options for the logging functions.
 */
export interface LogOptions {
    /**
     * If true, logging uses `.toString()` to convert to a string, otherwise, `util.inspect()` is used.
     * Defaults to `false`.
     */
    useToString?: boolean;

    /**
     * Options to pass to `util.inspect`.
     * Defaults to `{}`.
     */
    utilOptions?: InspectOptions;

    /**
     * The tag used to prefix the log.
     * Defaults to `""`.
     */
    tag?: string;

    /**
     * The color to use for the tag. If a string is provided, it will use chalk's color strings.
     * Otherwise, it will treat it as a hex color.
     * Defaults to `"white"`.
     */
    color?: string | number;

    /**
     * The writable stream to print to.
     * Defaults to `process.stdout`.
     */
    location?: Writable;

    /**
     * If true, appends a newline to the end.
     * Defaults to `true`.
     */
    newline?: boolean;

    /**
     * If true, strings will also have `util.inspect` called on them.
     * Defaults to `false`.
     */
    inspectStrings?: boolean;
}

/**
 * Logs something.
 * @param content Content to log.
 * @param options Logging options, see `LogOptions`.
 */
export function log(content: any, options: LogOptions): void {
    options = Object.assign({
        useToString: false,
        utilOptions: {},
        tag: "",
        color: "white",
        location: process.stdout,
        newline: true,
        inspectStrings: false
    }, options);
    let logged: string = "";
    let color: chalk.Chalk;
    if (typeof options.color == "number") {
        color = chalk.default.hex(padLeft(options.color.toString(16), 6, "0"));
    } else {
        color = chalk.default.keyword(options.color as string);
    }
    if (options.tag) {
        logged += color.bold(`[${options.tag}] `);
    }
    if (options.inspectStrings || typeof content != "string") {
        if (options.useToString) {
            logged += content.toString();
        } else {
            logged += inspect(content, options.utilOptions as InspectOptions);
        }
    } else {
        logged += content;
    }
    if (options.newline) {
        logged += "\n";
    }
    (options.location as Writable).write(logged);
}

/**
 * Logs something with no newline at the end.
 * @param content Content to log.
 * @param options Logging options, see `LogOptions`.
 */
export function logNoLine(content: any, options: LogOptions): void {
    options = Object.assign({
        newline: false
    }, options);
    if (!LogContext.debug) {
        return;
    }
    log(content, options);
}

/**
 * Logs something using `.toString()`.
 * @param content Content to log.
 * @param options Logging options, see `LogOptions`.
 */
export function logAsString(content: any, options: LogOptions): void {
    options = Object.assign({
        useToString: true
    }, options);
    log(content, options);
}

/**
 * Logs something to stderr.
 * @param content Content to log.
 * @param options Logging options, see `LogOptions`.
 */
export function logStderr(content: any, options: LogOptions): void {
    options = Object.assign({
        location: process.stderr
    }, options);
    if (!LogContext.debug) {
        return;
    }
    log(content, options);
}

/**
 * The context for the logging functions.
 */
const LogContext: any = {
    debug: true,
    info: true,
    error: true,
    warn: true,
    success: true,
    star: true
};

export { LogContext };

/**
 * Logs something with cyan tag "DEBUG" if `LogContext.debug` is set.
 * @param content Content to log.
 * @param options Logging options, see `LogOptions`.
 */
export function logDebug(content: any, options: LogOptions): void {
    options = Object.assign({
        tag: "DEBUG",
        color: "cyan"
    }, options);
    if (!LogContext.debug) {
        return;
    }
    log(content, options);
}

/**
 * Logs something with blue tag "INFO" if `LogContext.info` is set.
 * @param content Content to log.
 * @param options Logging options, see `LogOptions`.
 */
export function logInfo(content: any, options: LogOptions): void {
    options = Object.assign({
        tag: "INFO",
        color: "blue"
    }, options);
    if (!LogContext.info) {
        return;
    }
    log(content, options);
}

/**
 * Logs something with red tag "ERROR" if `LogContext.error` is set.
 * @param content Content to log.
 * @param options Logging options, see `LogOptions`.
 */
export function logError(content: any, options: LogOptions): void {
    options = Object.assign({
        tag: "ERROR",
        color: "red",
        location: process.stderr
    }, options);
    if (!LogContext.error) {
        return;
    }
    log(content, options);
}

/**
 * Logs something with yellow tag "WARN" if `LogContext.warn` is set.
 * @param content Content to log.
 * @param options Logging options, see `LogOptions`.
 */
export function logWarn(content: any, options: LogOptions): void {
    options = Object.assign({
        tag: "WARN",
        color: "yellow",
        location: process.stderr
    }, options);
    if (!LogContext.warn) {
        return;
    }
    log(content, options);
}

/**
 * Logs something with bright green tag "SUCCESS" if `LogContext.success` is set.
 * @param content Content to log.
 * @param options Logging options, see `LogOptions`.
 */
export function logSuccess(content: any, options: LogOptions): void {
    options = Object.assign({
        tag: "SUCCESS",
        color: "greenBright"
    }, options);
    if (!LogContext.success) {
        return;
    }
    log(content, options);
}

/**
 * Logs something as a string with magenta tag "*" if `LogContext.star` is set.
 * @param content Content to log.
 * @param options Logging options, see `LogOptions`.
 */
export function logStar(content: any, options: LogOptions): void {
    options = Object.assign({
        tag: "*",
        color: "magenta",
        useToString: true
    }, options);
    if (!LogContext.star) {
        return;
    }
    log(content, options);
}
