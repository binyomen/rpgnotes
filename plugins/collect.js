module.exports = function() {
    return function(files, metalsmith, done) {
        metalsmith.metadata().uncategorised = [];
        metalsmith.metadata().uncategorised.metadata = {title: 'Uncategorised'};

        for (const [path, file] of Object.entries(files)) {
            if (file.collection) {
                delete files[path];

                const newPath = file.collection + '/' + path;
                files[newPath] = file;
            } else if (!file.isHome && file.title) {
                metalsmith.metadata().uncategorised.push(file);
            }
        }

        for (const [name, collection] of Object.entries(metalsmith.metadata().collections)) {
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
