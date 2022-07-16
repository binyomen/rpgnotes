'use strict';

const cheerio = require('cheerio');

const util = require('./util.js');

module.exports.pages = function() {
    return function(files, metalsmith, done) {
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

module.exports.sections = function() {
    return function(files, metalsmith, done) {
        for (const [path, file] of util.fileEntries(files, '.html')) {
            const select = cheerio.load(file.contents);
            for (const element of select('.secret')) {
                select(element).remove();
            }

            const old = file.contents;
            file.contents = Buffer.from(select.root().html());
        }

        done();
    };
};
