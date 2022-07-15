const fs = require('node:fs');
const handlebars = require('handlebars');
const pathMod = require('node:path');

const partialsRoot = './layouts/partials/';

module.exports = function() {
    const files = fs.readdirSync(partialsRoot);
    for (const file of files) {
        const partialName = pathMod.basename(file, '.hbs');
        const partialContents = fs.readFileSync(partialsRoot + file, 'utf8');
        handlebars.registerPartial(partialName, partialContents);
    }
};
