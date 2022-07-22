'use strict';

const cheerio = require('cheerio');

const util = require('./util.js');

module.exports.pages = function(gmMode) {
    return function(files, metalsmith) {
        const secretPages = [];

        for (const [path, file] of util.fileEntries(files)) {
            if (file.secret) {
                if (file.title && gmMode) {
                    file.title = `<mark>[SECRET]</mark> ${file.title}`;
                }

                secretPages.push(path);
            }
        }

        if (!gmMode) {
            for (const path of secretPages) {
                delete files[path];
            }
        }
    };
};

module.exports.sections = function(gmMode) {
    return function(files, metalsmith) {
        for (const [path, file] of util.fileEntries(files, '.html')) {
            const select = cheerio.load(file.contents);
            for (const e of select('.secret')) {
                const element = select(e);
                if (gmMode) {
                    element.contents().wrapAll('<mark></mark>');
                    element.replaceWith(element.contents());
                } else {
                    element.remove();
                }
            }

            file.contents = Buffer.from(select.root().html());
        }
    };
};
