const fs = require('node:fs');
const handlebars = require('handlebars');
const pathMod = require('node:path');


module.exports = function(projectDir) {
    const partialsRoot = pathMod.join(projectDir, 'layouts', 'partials');

    const files = fs.readdirSync(partialsRoot);
    for (const file of files) {
        const partialName = pathMod.basename(file, '.hbs');
        const partialContents = fs.readFileSync(pathMod.join(partialsRoot, file), 'utf8');
        handlebars.registerPartial(partialName, partialContents);
    }
};
