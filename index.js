#!/usr/bin/env node

const metalsmith = require('metalsmith');

const collections = require('@metalsmith/collections');
const layouts = require('@metalsmith/layouts');
const markdown = require('@metalsmith/markdown');
const permalinks = require('@metalsmith/permalinks');

const collect = require('./plugins/collect.js');
const home = require('./plugins/home.js');
const links = require('./plugins/links.js');

require('./plugins/partials.js')()

const collections_opts = {
    characters: {
        metadata: {
            title: 'Characters',
        },
    },
    factions: {
        metadata: {
            title: 'Factions',
        },
    },
    items: {
        metadata: {
            title: 'Items',
        },
    },
    journals: {
        metadata: {
            title: 'Journals',
        },
    },
    locations: {
        metadata: {
            title: 'Locations',
        },
    },
    npcs: {
        metadata: {
            title: 'NPCs',
        },
    },
    species: {
        metadata: {
            title: 'Species',
        },
    },
};

metalsmith(__dirname)
    .source('./src')
    .destination('./build')
    .clean(true)
    .use(home())
    .use(collections(collections_opts))
    .use(collect())
    .use(markdown())
    .use(layouts({default: 'page.hbs'}))
    .use(links())
    .use(permalinks({relative: false}))
    .build(function(err, files) {
        if (err) { throw err; }
    });
