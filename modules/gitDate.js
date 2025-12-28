'use strict';

const childProcess = require('node:child_process');

const util = require('./util.js');

function isInGitRepo() {
    const result = childProcess.spawnSync('git', ['status']);
    return result.status === 0;
}

function isFileChanged(path) {
    const result = childProcess.spawnSync('git', ['diff', '--quiet', '--exit-code', path]);
    if (result.status !== 0 && result.status !== 1) {
        throw new Error(`Failed to determine if file "${path}" is changed: ${result.stderr.toString()}`);
    }

    return result.status === 1;
}

function getFileDate(path) {
    const result = childProcess.spawnSync('git', ['log', '-1', '--pretty=format:%cI', path]);
    if (result.status !== 0) {
        throw new Error(`Failed to get the date for file "${path}": ${result.stderr.toString()}`);
    }

    const stdout = result.stdout.toString();
    if (stdout === '') {
        return null;
    } else {
        return new Date(result.stdout.toString());
    }
}

module.exports = function () {
    return function (files, _metalsmith) {
        if (!isInGitRepo()) {
            return;
        }

        for (const file of util.fileObjects(files, '.md')) {
            if (isFileChanged(file.sourcePath)) {
                util.warn(`File "${file.sourcePath}" has been modified. Using last committed date.`);
            }

            let gitDate = getFileDate(file.sourcePath);
            if (gitDate === null) {
                util.warn(`File "${file.sourcePath}" is untracked by Git. Using current date.`);
                gitDate = new Date();
            }

            file.gitDateDisplay = gitDate.toUTCString();
            file.gitDateIso = gitDate.toISOString();
        }
    }
};
