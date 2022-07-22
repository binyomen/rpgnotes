'use strict';

const fs = require('node:fs');
const pathMod = require('node:path');

module.exports.fileEntries = function(files, extension) {
    const entries = [];

    for (const [path, file] of Object.entries(files)) {
        if (extension === undefined || pathMod.extname(path) === extension) {
            entries.push([path, file]);
        }
    }

    return entries;
};

module.exports.filePaths = function(files, extension) {
    const paths = [];

    for (const path of Object.keys(files)) {
        if (extension === undefined || pathMod.extname(path) === extension) {
            paths.push(path);
        }
    }

    return paths;
};

module.exports.fileObjects = function(files, extension) {
    const objects = [];

    for (const [path, file] of Object.entries(files)) {
        if (extension === undefined || pathMod.extname(path) === extension) {
            objects.push(file);
        }
    }

    return objects;
};

module.exports.addFile = function(files, fromPath, toPath) {
    files[toPath] = {contents: fs.readFileSync(fromPath)};
};

module.exports.normalizePath = function(path) {
    path = path.replaceAll('\\', '/');
    if (path[0] != '/') {
        path = `/${path}`;
    }

    const indexString = 'index.html';
    if (path.endsWith(indexString)) {
        path = path.substring(0, path.length - indexString.length);
    }

    return path;
};
