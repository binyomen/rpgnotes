'use strict';

const pathMod = require('node:path');

const util = require('./util.js');

module.exports = function(projectDir) {
    return function(files, metalsmith) {
        util.addFile(
            files,
            pathMod.join(projectDir, 'rpgnotes.css'),
            pathMod.join('css', 'rpgnotes.css'));
    }
};
