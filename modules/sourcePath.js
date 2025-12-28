'use strict';

const pathMod = require('node:path');

const util = require('./util.js');

module.exports = function () {
    return function (files, metalsmith, done) {
        const basePath = pathMod.relative(process.cwd(), metalsmith.source());
        for (const [path, file] of util.fileEntries(files, '.md')) {
            file.sourcePath = pathMod.join(basePath, path);
        }

        done();
    };
};
