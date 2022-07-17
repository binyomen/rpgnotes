'use strict';

const cheerio = require('cheerio');

const util = require('./util.js');

module.exports.pages = function(gmMode) {
    return function(files, metalsmith, done) {
        if (gmMode) {
            done();
            return;
        }

        const secretPages = [];

        for (const [path, file] of util.fileEntries(files)) {
            if (file.secret) {
                secretPages.push(path);
            }
        }

        for (const path of secretPages) {
            delete files[path];
        }

        done();
    };
};

module.exports.sections = function(gmMode) {
    return function(files, metalsmith, done) {
        for (const [path, file] of util.fileEntries(files, '.html')) {
            const select = cheerio.load(file.contents);
            for (const e of select('.secret')) {
                const element = select(e);
                if (gmMode) {
                    element.replaceWith(element.contents());
                } else {
                    element.remove();
                }
            }

            file.contents = Buffer.from(select.root().html());
        }

        done();
    };
};
