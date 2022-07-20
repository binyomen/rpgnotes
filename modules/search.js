'use strict';

const cheerio = require('cheerio');
const MiniSearch = require('minisearch');
const pathMod = require('node:path');

const util = require('./util.js');

module.exports.page = function(projectDir) {
    return function(files, metalsmith) {
        files['search.md'] = {
            title: 'Search results for ""',
            contents: Buffer.from('<ol id="search-results"></ol>'),
            isSearch: true,
        };

        util.addFile(
            files,
            pathMod.join(projectDir, 'search.js'),
            pathMod.join('js', 'search.js'));
    };
};

module.exports.index = function() {
    return function(files, metalsmith) {
        const objects = [];
        let currId = 0;
        for (const [path, file] of util.fileEntries(files, '.html')) {
            if (file.isSearch) {
                continue;
            }

            const select = cheerio.load(file.contents.toString());
            const mainSection = select('main');

            objects.push({
                id: currId,
                title: file.title,
                contents: mainSection.text(),
                path: util.normalizePath(path),
            });

            currId += 1;
        }

        const searchOptions = {
            fields: ['title', 'contents'],
            storeFields: ['title', 'contents', 'path'],
            searchOptions: {
                boost: {title: 2},
                fuzzy: true,
                prefix: true,
            },
        };

        const minisearch = new MiniSearch(searchOptions);
        minisearch.addAll(objects);

        files['search_index.json'] = {contents: JSON.stringify(minisearch)};
        files['search_options.json'] = {contents: JSON.stringify(searchOptions)};
    };
};
