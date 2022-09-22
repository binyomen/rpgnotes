'use strict';

const cheerio = require('cheerio');
const fs = require('node:fs');
const pathMod = require('node:path');

const util = require('./util.js');

function hasAccess(path) {
    try {
        fs.accessSync(path);
        return true;
    } catch {
        return false;
    }
}

function splitOnFirst(s, sep) {
    const sepIndex = s.indexOf(sep);
    if (sepIndex === -1) {
        return [s];
    } else {
        const s1 = s.substring(0, sepIndex);
        const s2 = sepIndex === s.length - 1 ? '' : s.substring(sepIndex + 1);
        return [s1, s2];
    }
}

function parseMacroCall(moduleMap, macroString) {
    const [callString, argString] = splitOnFirst(macroString, ' ');
    let args;
    if (argString === undefined) {
        args = undefined;
    } else {
        // Use indirect eval so it doesn't have access to the local scope.
        args = eval?.(`(${argString})`);
    }

    const [moduleName, macroName] = splitOnFirst(callString, '.');
    let func;
    if (macroName === undefined) {
        func = moduleMap[moduleName];
    } else {
        func = moduleMap[moduleName][macroName];
    }

    return {func, args};
}

module.exports = function(macroDir) {
    if (!hasAccess(macroDir)) {
        return function(files, metalsmith) { };
    }

    return function(files, metalsmith) {
        const macroFiles = fs.readdirSync(macroDir);
        const moduleMap = {};
        for (const macroFile of macroFiles) {
            if (pathMod.extname(macroFile) !== '.js') {
                continue;
            }

            const moduleName = pathMod.basename(macroFile, '.js');
            moduleMap[moduleName] = require(pathMod.join(macroDir, macroFile));
        }

        for (const [path, file] of util.fileEntries(files, '.html')) {
            const select = cheerio.load(file.contents);

            for (const e of select('[data-macro]')) {
                const element = select(e);
                const macroCall = parseMacroCall(moduleMap, element.data('macro'));

                const result = macroCall.func(select, macroCall.args, element);
                element.replaceWith(select.parseHTML(result));
            }

            file.contents = Buffer.from(select.root().html());
        }
    }
};
