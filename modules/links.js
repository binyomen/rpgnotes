'use strict';

const cheerio = require('cheerio');
const pathMod = require('node:path');

function findPagePath(files, filename) {
    for (const path of Object.keys(files)) {
        if (pathMod.extname(path) != '.html') {
            continue;
        }

        const basename = pathMod.basename(path, '.html')
        if (basename === filename) {
            const dirname = pathMod.dirname(path)
            const dir = dirname === '.' ? '' : dirname + '/';
            return '/' + dir + basename + '/'
        }
    }

    throw new Error('Page "' + filename + '" not found.');
}

function parseHrefEncodedToString(encoded) {
    const bytes = [];

    for (let i = 0; i < encoded.length; i += 3) {
        const byte = parseInt(encoded.substring(i + 1, i + 3), 16);
        bytes.push(byte);
    }

    return Buffer.from(bytes).toString();
}

function unescapeHref(href) {
    let newHref = href;

    const regex = /(%[0-9A-Fa-f]{2})+/;
    let match = newHref.match(regex);
    while (match) {
        const replacement = parseHrefEncodedToString(match[0]);

        const length = match[0].length;
        newHref =
            newHref.substring(0, match.index) +
            replacement +
            newHref.substring(match.index + match[0].length, newHref.length);

        match = newHref.match(regex);
    }

    return newHref;
}

module.exports = function() {
    return function(files, metalsmith, done) {
        for (const [path, file] of Object.entries(files)) {
            const select = cheerio.load(file.contents);
            for (const link of select('a')) {
                const href = unescapeHref(link.attribs.href);
                if (pathMod.extname(href) != '.md') {
                    continue;
                }

                const basename = pathMod.basename(href, '.md')
                link.attribs.href = findPagePath(files, basename);

                file.contents = select.root().html();
            }
        }

        done();
    }
};
