module.exports = function() {
    return function(files, metalsmith, done) {
        files['index.md'] = {
            title: 'Lasers and Feelings',
            layout: 'home.hbs',
            contents: '',
            isHome: true,
        };

        done();
    }
}
