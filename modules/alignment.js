'use strict';

const cheerio = require('cheerio');

const util = require('./util.js');

module.exports = function() {
    return function(files, metalsmith) {
        for (const [path, file] of util.fileEntries(files, '.html')) {
            const select = cheerio.load(file.contents);

            for (const c of select('th, td')) {
                const cell = select(c);

                const alignment = cell.attr('align');
                if (alignment) {
                    cell.attr('style', `text-align: ${alignment};`);
                    cell.removeAttr('align');
                }
            }

            file.contents = Buffer.from(select.root().html());
        }
    }
};
