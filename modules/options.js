'use strict';

const fs = require('node:fs');
const pathMod = require('node:path');
const process = require('node:process');
const toml = require('@ltd/j-toml');

function requiredOption(name, value) {
    if (value === undefined) {
        console.error(`Options: Configuration "${name}" is required.`);
        process.exit(1);
    }
}

function defaultOption(value, def) {
    if (value === undefined) {
        return def;
    } else {
        return value;
    }
}

module.exports = function () {
    const cwd = process.cwd();

    const optionsFile = pathMod.join(cwd, 'rpgnotes.toml');
    const contents = fs.readFileSync(optionsFile, 'utf8');

    const options = toml.parse(contents, {
        bigint: false,
    });

    options.about = defaultOption(options.about, {});
    options.about.title = defaultOption(options.about.title, '[NO TITLE]');

    options.build = defaultOption(options.build, {});
    options.build.source = pathMod.join(cwd, defaultOption(options.build.source, 'src'));
    options.build.destination = pathMod.join(cwd, defaultOption(options.build.destination, 'build'));
    options.build.macroDirectory = pathMod.join(cwd, defaultOption(options.build['macro-directory'], 'macros'));
    options.build.cssFiles = defaultOption(options.build['css-files'], []);

    options.collections = defaultOption(options.collections, []);

    options.currencies = defaultOption(options.currencies, {})
    Object.entries(options.currencies).forEach(([currencyId, currency]) => {
        requiredOption(`currency.${currencyId}.base-unit`, currency['base-unit']);
        currency.precision = defaultOption(currency.precision, 2);
        currency.units = defaultOption(currency.units, []);
        currency.units.forEach((unit) => {
            requiredOption(`currency.${currencyId}.units[].name`, unit.name);
            requiredOption(`currency.${currencyId}.units[].value`, unit.value);
            unit.threshold = defaultOption(unit.threshold, unit.value);
        });
        currency.units.push({
            name: currency['base-unit'],
            value: 1,
            threshold: 1,
        });
        currency.units.sort((u1, u2) => u2.value - u1.value);
    });

    return options;
};
