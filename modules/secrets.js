'use strict';

const cheerio = require('cheerio');

const util = require('./util.js');

module.exports.pages = function(gmMode) {
    return function(files, metalsmith) {
        const secretPages = [];

        for (const [path, file] of util.fileEntries(files)) {
            if (file.secret) {
                if (file.title && gmMode) {
                    const newTitle = file.title;
                    file.title = `<mark>[SECRET]</mark> ${newTitle}`;
                    file.strippedTitle = `[SECRET] ${newTitle}`;
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

                let secretPrefix;
                let secretSuffix;
                const tagName = element.prop('tagName').toLowerCase();
                if (tagName === 'span') {
                    secretPrefix = '<mark>[SECRET BEGIN]</mark>';
                    secretSuffix = '<mark>[SECRET END]</mark>';
                } else if (tagName === 'div') {
                    secretPrefix = '<p><mark>[SECRET BEGIN]</mark></p>';
                    secretSuffix = '<p><mark>[SECRET END]</mark></p>';
                } else {
                    throw new Error('Secret class only supported on spans and divs.');
                }

                if (gmMode) {
                    element.prepend(secretPrefix);
                    element.append(secretSuffix);
                    element.replaceWith(element.contents());
                } else {
                    element.remove();
                }
            }

            file.contents = Buffer.from(select.root().html());
        }
    };
};
