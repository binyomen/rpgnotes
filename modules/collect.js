module.exports = function() {
    return function(files, metalsmith, done) {
        const metadata = metalsmith.metadata();

        metadata.collections.uncategorised = [];
        metadata.collections.uncategorised.metadata = {
            title: 'Uncategorised',
        };

        for (const [path, file] of Object.entries(files)) {
            if (file.collection) {
                delete files[path];

                const newPath = file.collection + '/' + path;
                files[newPath] = file;
            } else if (!file.isHome && file.title) {
                metadata.collections.uncategorised.push(file);
            }
        }

        for (const [name, collection] of Object.entries(metadata.collections)) {
            collection.metadata.path = '/' + name + '/';
            files[name + '.md'] = {
                title: collection.metadata.title,
                layout: 'collection_page.hbs',
                pages: collection,
                contents: '',
            };
        }

        done();
    }
}
