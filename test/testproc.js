require("../dist/src/index.js").pwn();
const path = require("path");
const readline = require("readline");
// const rl = readline.createInterface({
//     input: process.stdin,
//     output: process.stdout
// });
// rl.pause();
//const p = new pwnutil.ProcessTube(path.join(__dirname, "delayed_print"), []);
const p = proc(path.join(__dirname, "delayed_print"));
async function main() {
    log("waiting here");
    logStar(await p.recvlinePredS((b, s) => /S/.test(s)));
    logStar(await p.recv());
    // logStar(await p.recvline(false, 5, "throw"));
    // logStar(await p.recvline(false, 5, "throw"));
    log("done waiting here");
}
main();
