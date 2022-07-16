module.exports = function() {
    return function(files, metalsmith, done) {
        files['index.md'] = {
            title: 'Home',
            layout: 'home.hbs',
            contents: '',
            isHome: true,
        };

        done();
    }
};
