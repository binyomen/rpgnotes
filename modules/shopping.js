'use strict';

const cheerio = require('cheerio');

const util = require('./util.js');

function slugify(string) {
    return string.toLowerCase().replace(/[^A-Za-z0-9\s]/g, '').replace(/\s+/g, '-');
}

module.exports = function (currencies) {
    return function (files, _metalsmith, done) {
        for (const file of util.fileObjects(files, '.html')) {
            const hasValidCurrency = !!(file.shopping && file.shopping.currency);
            const hasShoppingItems = file.contents.includes('<shopping-item');

            if (!hasValidCurrency && !hasShoppingItems) {
                file.shopping = null;
                continue;
            } else if (hasValidCurrency && !hasShoppingItems) {
                util.warn(`Shopping is enabled in "${file.sourcePath}" but no items are present, skipping.`);
                file.shopping = null;
                continue;
            } else if (!hasValidCurrency && hasShoppingItems) {
                util.warn(`Shopping items detected in "${file.sourcePath}" but no currency is declared, skipping.`);
                file.shopping = null;
                continue;
            }

            if (!(file.shopping.currency in currencies)) {
                util.warn(`Shopping currency "${file.shopping.currency}" in page "${file.sourcePath}" is not valid, skipping.`);
                file.shopping = null;
                continue;
            }

            const items = {};

            const select = cheerio.load(file.contents);
            for (const e of select('shopping-item')) {
                const item = select(e);
                const text = item.text();
                let cost = item.attr('cost');
                if (!cost) {
                    cost = 1;
                    util.warn(`Item "${id}" in page "${file.sourcePath}" has no cost, defaulting to 1.`)
                }

                let id = item.attr('id');
                if (!id) {
                    id = slugify(text);
                    item.attr('id', id);
                }

                if (id in items) {
                    util.warn(`Item "${id}" was defined more than once in page "${file.sourcePath}", using latest cost.`)
                }

                items[id] = {
                    name: text,
                    cost: parseFloat(cost, 10),
                };
            }

            file.shopping.config = JSON.stringify({
                currency: currencies[file.shopping.currency],
                items,
            });
            file.contents = Buffer.from(select.root().html());
        }
        done();
    }
};
