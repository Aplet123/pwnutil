/**
 * Acts as an alias for a class without having to use `new`.
 * @param cls Class to alias.
 * @param args Any arguments to pass to the constructor.
 * @return An instance of the class with the arguments provided.
 */
export function aliasClass(cls: any, args: IArguments | any[]): any {
    let cons: any = Function.prototype.bind.apply(cls, [cls, ...args]);
    let ret: any = new cons();
    return ret;
}
