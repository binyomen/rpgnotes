'use strict';

const childProcess = require('node:child_process');
const pathMod = require('node:path');

const util = require('./util.js');

function isInGitRepo() {
    const result = childProcess.spawnSync('git', ['status']);
    return result.status == 0;
}

function isFileChanged(path) {
    const result = childProcess.spawnSync('git', ['diff', '--quiet', '--exit-code', path]);
    if (result.status != 0 && result.status != 1) {
        throw new Error(`Failed to determine if file "${path}" is changed: ${result.stderr.toString()}`);
    }

    return result.status == 1;
}

function getFileDate(path) {
    const result = childProcess.spawnSync('git', ['log', '-1', '--pretty=format:%cI', path]);
    if (result.status != 0) {
        throw new Error(`Failed to get the date for file "${path}": ${result.stderr.toString()}`);
    }

    return new Date(result.stdout.toString());
}

module.exports = function(source) {
    return function(files, metalsmith) {
        if (!isInGitRepo()) {
            return;
        }

        for (const [path, file] of util.fileEntries(files, '.md')) {
            const fullPath = pathMod.relative('.', pathMod.join(source, path));

            if (isFileChanged(fullPath)) {
                console.log(`Warning: File "${fullPath}" has been modified. Using last committed date.`);
            }

            const gitDate = getFileDate(fullPath);
            file.gitDateDisplay = gitDate.toUTCString();
            file.gitDateIso = gitDate.toISOString();
        }
    }
};
