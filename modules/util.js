'use strict';

const fs = require('node:fs');
const pathMod = require('node:path');

module.exports.fileEntries = function*(files, extension) {
    for (const [path, file] of Object.entries(files)) {
        if (extension === undefined || pathMod.extname(path) === extension) {
            yield [path, file];
        }
    }
};

module.exports.filePaths = function*(files, extension) {
    for (const path of Object.keys(files)) {
        if (extension === undefined || pathMod.extname(path) === extension) {
            yield path;
        }
    }
};

module.exports.fileObjects = function*(files, extension) {
    for (const [path, file] of Object.entries(files)) {
        if (extension === undefined || pathMod.extname(path) === extension) {
            yield file;
        }
    }
};

module.exports.addFile = function(files, fromPath, toPath) {
    files[toPath] = {contents: fs.readFileSync(fromPath)};
};

module.exports.normalizePath = function(path) {
    path = path.replaceAll('\\', '/');
    if (path[0] !== '/') {
        path = `/${path}`;
    }

    const indexString = 'index.html';
    if (path.endsWith(indexString)) {
        path = path.substring(0, path.length - indexString.length);
    }

    return path;
};

module.exports.warn = function(msg) {
    console.warn(`WARNING: ${msg}`);
};
