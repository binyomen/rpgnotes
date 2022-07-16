'use strict';

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

    for (const [path, file] of Object.objects(files)) {
        if (extension === undefined || pathMod.extname(path) === extension) {
            objects.push(file);
        }
    }

    return objects;
};
