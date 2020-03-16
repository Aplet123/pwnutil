const pwnutil = require("../dist/src/index.js");
const path = require("path");
//const p = new pwnutil.ProcessTube(path.join(__dirname, "delayed_print"), []);
const p = new pwnutil.ProcessTube("ls", ["-l", "-a", "/tmp"]);
async function main() {
    console.log(1, (await p.recv(10000)).toString("utf8"));
    console.log(2, (await p.recv(10000)).toString("utf8"));
    console.log(3, (await p.recv(10000)).toString("utf8"));
    console.log(4, (await p.recv(10000)).toString("utf8"));
}
main();
