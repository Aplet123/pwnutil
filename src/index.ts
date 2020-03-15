import fs from "fs";
import path from "path";

function traverse(dir: fs.Dir, parentPath: string = __dirname): Object {
    let dirent: fs.Dirent;
    let ret: Object = {};
    while (dirent = dir.readSync()) {
        if (dirent.isDirectory()) {
            const newPath: string = path.join(parentPath, dirent.name);
            Object.assign(ret, traverse(fs.opendirSync(newPath), newPath));
        } else {
            if (path.parse(dirent.name).ext != ".js") {
                continue;
            }
            const exp: any = require(path.join(parentPath, dirent.name));
            Object.assign(ret, exp);
        }
    }
    dir.closeSync();
    return ret;
}

/**
 * Only require a certain part of the modules.
 * @param part The name of the part to get (e.g. "lib/tubes").
 */
function getPart(part: string = ""): Object {
    const dir: string = path.join(__dirname,  part);
    return traverse(fs.opendirSync(dir), dir);
}

const exps: Object = getPart("");
module.exports = exps;

/**
 * Load exports into an object.
 * @param obj Object to load into.
 */
function load(obj: Object): Object {
    return Object.assign(obj, exps);
}

module.exports.getPart = getPart;
module.exports.load = load;
