Object.assign(global, require("../dist/src/index.js"));
const path = require("path");
//const p = new pwnutil.ProcessTube(path.join(__dirname, "delayed_print"), []);
const p = proc(path.join(__dirname, "delayed_print"));
async function main() {
    logAsString(await p.recvall(), {
        tag: "*"
    });
}
main();
