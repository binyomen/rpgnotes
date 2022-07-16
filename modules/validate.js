'use strict';

const cheerio = require('cheerio');

module.exports = function() {
    return function(files, metalsmith, done) {
        for (const [path, file] of Object.entries(files)) {
            const select = cheerio.load(file.contents);

            if (select('h1').length > 0) {
                throw new Error('There should not be any h1s within a page.');
            }

            if (select('h2').length > 0) {
                throw new Error('There should not be any h2s within a page.');
            }
        }

        done();
    }
}
