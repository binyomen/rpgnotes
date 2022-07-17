'use strict';

const fs = require('node:fs');
const pathMod = require('node:path');

module.exports = function(projectDir) {
    return function(files, metalsmith) {
        const contents = fs.readFileSync(pathMod.join(projectDir, 'rpgnotes.css'));

        files[pathMod.join('css', 'rpgnotes.css')] = {contents};
    }
};
