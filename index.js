#!/usr/bin/env node

'use strict';

const process = require('node:process');

const metalsmith = require('metalsmith');

const brokenLinkChecker = require('metalsmith-broken-link-checker');
const collections = require('@metalsmith/collections');
const layouts = require('@metalsmith/layouts');
const markdown = require('@metalsmith/markdown');
const permalinks = require('@metalsmith/permalinks');

const alignment = require('./modules/alignment.js');
const css = require('./modules/css.js');
const collect = require('./modules/collect.js');
const gitDate = require('./modules/gitDate.js');
const home = require('./modules/home.js');
const links = require('./modules/links.js');
const macros = require('./modules/macros.js');
const search = require('./modules/search.js');
const secrets = require('./modules/secrets.js');
const validate = require('./modules/validate.js');

const options = require('./modules/options.js')();

require('./modules/partials.js')(__dirname);

function compareTitles(file1, file2) {
    function splitIntoTextAndNumbers(s) {
        const groups = [];
        let currentGroup = '';
        let currentGroupIsNumeric;

        const tryAddNewGroup = () => {
            if (currentGroup !== '') {
                const newGroup = currentGroupIsNumeric ?
                    parseInt(currentGroup, 10) :
                    currentGroup;

                groups.push(newGroup);
                currentGroup = '';
            }
        };

        for (const c of s) {
            const isNumeric = /\d/.test(c);
            if (currentGroupIsNumeric !== isNumeric) {
                tryAddNewGroup();
            }

            currentGroup += c;
            currentGroupIsNumeric = isNumeric;
        }

        tryAddNewGroup();

        return groups;
    }

    function basicCompare(a, b) {
        if (a < b) {
            return -1;
        } else if (a > b) {
            return 1;
        } else {
            return 0;
        }
    }

    const title1 = file1.title;
    const title2 = file2.title;

    const split1 = splitIntoTextAndNumbers(title1);
    const split2 = splitIntoTextAndNumbers(title2);

    const maxLength = Math.max(split1.length, split2.length);

    for (let i = 0; i < maxLength; ++i) {
        if (i === split1.length) {
            return -1;
        } else if (i === split2.length) {
            return 1;
        }

        const item1 = split1[i];
        const item2 = split2[i];

        if (item1 === item2) {
            continue;
        } else if (typeof item1 !== typeof item2) {
            return basicCompare(item1.toString(), item2.toString());
        } else {
            return basicCompare(item1, item2);
        }
    }

    return 0;
}

const collections_opts = {};
for (const collection of options.collections) {
    collections_opts[collection.name] = {
        reverse: collection.reverse,
        sortBy: compareTitles,
        metadata: {
            title: collection.title,
        },
    };
}

const gmMode = process.argv.includes('--gm-mode');

const buildDate = new Date();
const buildDateDisplay = buildDate.toUTCString();
const buildDateIso = buildDate.toISOString();

metalsmith(__dirname)
    .metadata({
        siteTitle: options.about.title,
        noTime: process.env.RPGNOTES_NO_TIME,
        buildDateDisplay,
        buildDateIso,
        cssFiles: options.build.cssFiles,
    })
    .source(options.build.source)
    .destination(options.build.destination)
    .clean(true)
    .use(secrets.pages(gmMode))
    .use(gitDate(options.build.source))
    .use(home())
    .use(css(__dirname))
    .use(search.page(__dirname))
    .use(collections(collections_opts))
    .use(collect())
    .use(markdown())
    .use(macros(options.build.macroDirectory))
    .use(alignment())
    .use(secrets.sections(gmMode))
    .use(validate())
    .use(links.analyze())
    .use(layouts({
        default: 'page.hbs',
        pattern: '**/*.html',
    }))
    .use(links.transform(gmMode))
    .use(permalinks({relative: false}))
    .use(brokenLinkChecker({checkAnchors: true}))
    .use(search.index())
    .build(function(err, files) {
        if (err) { throw err; }
    });
