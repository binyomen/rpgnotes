'use strict';

const cheerio = require('cheerio');
const pathMod = require('node:path');

const util = require('./util.js');

function findPagePath(files, filename, hash) {
    const hashString = hash ? `#${hash}` : '';

    for (const path of util.filePaths(files, '.html')) {
        const basename = pathMod.basename(path, '.html');
        if (basename === filename) {
            const dirname = pathMod.dirname(path);
            const dir = dirname === '.' ? '' : `${dirname}/`;
            return `/${dir}${basename}/${hashString}`;
        }
    }

    return null;
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

function removeHash(href) {
    const regex = /#([^#]+)$/;
    const match = href.match(regex);
    const hash = match ? match[1] : null;

    return [href.replace(regex, ''), hash];
}

function forEachLink(select, f) {
    for (const l of select('a')) {
        const link = select(l);

        const [href, hash] = removeHash(unescapeHref(link.attr('href')));
        if (pathMod.extname(href) !== '.md') {
            continue;
        }

        const basename = pathMod.basename(href, '.md');

        f({link, hash, basename});
    }
}

module.exports.analyze = function() {
    return function(files, metalsmith) {
        for (const file of util.fileObjects(files, '.html')) {
            const select = cheerio.load(file.contents);

            forEachLink(select, function(l) {
                for (const [linkedPath, linkedFile] of util.fileEntries(files, '.html')) {
                    if (pathMod.basename(linkedPath, '.html') === l.basename) {
                        if (!linkedFile.linkedFrom) {
                            linkedFile.linkedFrom = new Set();
                        }
                        linkedFile.linkedFrom.add(file);
                    }
                }
            });
        }
    };
};

module.exports.transform = function(gmMode) {
    return function(files, metalsmith) {
        for (const [path, file] of util.fileEntries(files, '.html')) {
            const select = cheerio.load(file.contents);

            forEachLink(select, function(l) {
                const newHref = findPagePath(files, l.basename, l.hash);
                if (newHref) {
                    l.link.attr('href', newHref);
                } else {
                    const msg = `Page "${l.basename}" not found, linked from "${path}".`;
                    if (gmMode) {
                        throw new Error(msg);
                    } else {
                        util.warn(msg);
                    }

                    l.link.replaceWith(l.link.contents());
                }
            });

            file.contents = Buffer.from(select.root().html());
        }
    };
};
