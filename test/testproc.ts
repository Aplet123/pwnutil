import pwnutil from "../src/index";
const path = require("path");
const p = new pwnutil.ProcessTube(path.join(__dirname, "delayed_print"), []);
async function main() {
    console.log(1, (await p.recv()).toString("utf8"));
    console.log(2, (await p.recv()).toString("utf8"));
    console.log(3, (await p.recv()).toString("utf8"));
    console.log(4, (await p.recv()).toString("utf8"));
}
main();
