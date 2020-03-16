/**
 * Leftpads a string.
 * @param str String to pad.
 * @param len Length to pad to.
 * @param chr Character to pad with.
 * @param trunc If set to true, the string will be truncated to length `len` is longer.
 */
export function padLeft(
    str: string,
    len: number = 8,
    chr: string = " ",
    trunc: boolean = false
) {
    let ret: string;
    if (str.length >= len) {
        ret = str;
    } else {
        ret = chr.repeat(len - str.length) + str;
    }
    if (trunc) {
        ret = ret.substr(-len);
    }
    return ret;
}

/**
 * Rightpads a string.
 * @param str String to pad.
 * @param len Length to pad to.
 * @param chr Character to pad with.
 * @param trunc If set to true, the string will be truncated to length `len` is longer.
 */
export function padRight(
    str: string,
    len: number = 8,
    chr: string = " ",
    trunc: boolean = false
) {
    let ret: string;
    if (str.length >= len) {
        ret = str;
    } else {
        ret = str + chr.repeat(len - str.length);
    }
    if (trunc) {
        ret = ret.substr(0, len);
    }
    return ret;
}
