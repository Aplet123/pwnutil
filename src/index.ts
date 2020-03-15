import fs from "fs";
import path from "path";

function traverse(dir: fs.Dir, parentPath: string = __dirname): Object {
    let dirent: fs.Dirent;
    let ret: Object = {};
    while (dirent = dir.readSync()) {
        const newPath: string = path.join(parentPath, dirent.name);
        if (dirent.isDirectory()) {
            Object.assign(ret, traverse(fs.opendirSync(newPath), newPath));
        } else {
            if (path.parse(dirent.name).ext != ".js") {
                continue;
            }
            const exp: any = require(newPath);
            export * from "fs";
            Object.assign(ret, exp);
        }
    }
    dir.closeSync();
    return ret;
}

traverse(fs.opendirSync(__dirname));
