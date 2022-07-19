'use strict';

const cheerio = require('cheerio');
const Fuse = require('fuse.js');
const pathMod = require('node:path');

const util = require('./util.js');

module.exports.page = function(projectDir) {
    return function(files, metalsmith) {
        files['search.md'] = {
            title: 'Search results for "".',
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
        for (const [path, file] of util.fileEntries(files, '.html')) {
            if (file.isSearch) {
                continue;
            }

            const select = cheerio.load(file.contents.toString());
            const mainSection = select('main');
            const contents = mainSection.text().replaceAll(/\s+/g, ' ').trim();

            objects.push({
                title: file.title,
                path: util.normalizePath(path),
                contents: contents,
            });
        }

        files['search_objects.json'] = {contents: JSON.stringify(objects)};

        const index = Fuse.createIndex(['contents'], objects);
        files['search_index.json'] = {contents: JSON.stringify(index.toJSON())};
    };
};
