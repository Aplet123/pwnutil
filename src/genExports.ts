import fs from "fs";
import path from "path";


function traverse(dir: fs.Dir, parentPath: string = __dirname): Array<any> {
    let file: string = "";
    let dirent: fs.Dirent;
    let ret: Object = {};
    while (dirent = dir.readSync()) {
        const newPath: string = path.join(parentPath, dirent.name);
        if (dirent.isDirectory()) {
            const pair: Array<any> = traverse(fs.opendirSync(newPath), newPath);
            file += pair[0];
            Object.assign(ret, pair[1]);
        } else {
            if (path.parse(dirent.name).ext != ".js") {
                continue;
            }
            const exp: any = require(newPath);
            file += `export * from "${"./" + path.relative(__dirname, newPath)}";\n`;
            Object.assign(ret, exp);
        }
    }
    dir.closeSync();
    return [file, ret];
}

const pair: Array<any> = traverse(fs.opendirSync(__dirname), __dirname);
console.log(pair[0]);
