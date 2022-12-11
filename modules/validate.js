'use strict';

const cheerio = require('cheerio');

const util = require('./util.js');

module.exports = function() {
    return function(files, metalsmith) {
        for (const file of util.fileObjects(files, '.html')) {
            const select = cheerio.load(file.contents);

            if (select('h1').length > 0) {
                throw new Error('There should not be any h1s within a page.');
            }

            if (select('h2').length > 0) {
                throw new Error('There should not be any h2s within a page.');
            }
        }
    };
};
