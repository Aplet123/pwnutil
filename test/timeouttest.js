const logg = require("why-is-node-running");
let to = setTimeout(function(){console.log("hey")}, 10);
clearTimeout(to);
logg();
