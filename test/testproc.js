Object.assign(global, require("../dist/src/index.js"));
const path = require("path");
//const p = new pwnutil.ProcessTube(path.join(__dirname, "delayed_print"), []);
const p = proc("ls", ["-l", "-a", "/sys"]);
async function main() {
    log("Log 1");
    log("Log 2");
    logDebug("Log 3");
    logWarn("Log 4");
    LogContext.debug = false;
    logDebug("Log 5");
    let test = await p.clean();
    logAsString(test);
    log(test.toString());
    logWarn("Log 6");
}
main();
