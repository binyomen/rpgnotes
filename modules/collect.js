'use strict';

const util = require('./util.js');

module.exports = function() {
    return function(files, metalsmith) {
        const metadata = metalsmith.metadata();

        metadata.collections.uncategorised = [];
        metadata.collections.uncategorised.metadata = {
            title: 'Uncategorised',
        };

        for (const [name, collection] of Object.entries(metadata.collections)) {
            if (!collection.metadata) {
                throw new Error(`Collection "${name}" is not specified in rpgnotes.toml.`);
            }
        }

        for (const [path, file] of util.fileEntries(files)) {
            if (file.collection) {
                delete files[path];

                const newPath = `${file.collection}/${path}`;
                files[newPath] = file;
            } else if (!file.isHome && !file.isSearch && file.title) {
                metadata.collections.uncategorised.push(file);
            }
        }

        const emptyCollections = [];
        for (const [name, collection] of Object.entries(metadata.collections)) {
            if (collection.length > 0) {
                collection.metadata.path = `/${name}/`;
                files[`${name}.md`] = {
                    title: collection.metadata.title,
                    layout: 'collection_page.hbs',
                    pages: collection,
                    contents: '',
                };
            } else {
                emptyCollections.push(name);
            }
        }

        for (const name of emptyCollections) {
            delete metadata.collections[name];
        }
    }
}
