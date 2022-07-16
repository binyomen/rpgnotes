'use strict';

const fs = require('node:fs');
const pathMod = require('node:path');
const process = require('node:process');
const toml = require('@ltd/j-toml');

function defaultOption(value, def) {
    if (value === undefined) {
        return def;
    } else {
        return value;
    }
}

module.exports = function() {
    const cwd = process.cwd();

    const optionsFile = pathMod.join(cwd, 'rpgnotes.toml');
    const contents = fs.readFileSync(optionsFile, 'utf8');

    const options = toml.parse(contents);

    options.build = defaultOption(options.build, {});
    options.build.source = pathMod.join(cwd, defaultOption(options.build.source, 'src'));
    options.build.destination = pathMod.join(cwd, defaultOption(options.build.destination, 'build'));

    options.collections = defaultOption(options.collections, []);

    return options;
};
