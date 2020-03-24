Object.assign(global, require("../dist/src/index.js"));
const path = require("path");
//const p = new pwnutil.ProcessTube(path.join(__dirname, "delayed_print"), []);
const p = proc(path.join(__dirname, "oneline"));
async function main() {
    log("waiting here");
    logStar(await p.recvlineS());
    logStar(await p.recvline(false, 15, "return"));
    // logStar(await p.recvline(false, 5, "throw"));
    // logStar(await p.recvline(false, 5, "throw"));
    log("done waiting here");
}
main();
