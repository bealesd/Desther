let core;
import { copyFile, constants } from 'node:fs/promises';

try {
    //use github action core for error messaging
    core = require("@actions/core");
}
catch {
    //if core fails to import
    core = { setFailed: (msg) => { console.log(msg); } };
}

class Build {
    constructor() {}

    static async main() {
        try { 
            await copyFile('index.html', '404.html');
            console.log('Copied file.')
        } catch (e) {
            core.setFailed(`Error copying index.html to 404.html in build.js.\nError: ${e.message}.`);
        } finally { }
    }
}

Build.main();