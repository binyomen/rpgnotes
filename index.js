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
const performance = require('./modules/performance.js');
const search = require('./modules/search.js');
const secrets = require('./modules/secrets.js');
const validate = require('./modules/validate.js');
const server = require('./modules/server.js');

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

if (process.argv.includes('--help') || process.argv.includes('-h')) {
    console.log(`Usage: rpgnotes [--gm-mode] [--no-time] [--watch [--serve]]

Options:
    --gm-mode Enables GM mode, which displays secrets
    --no-time Disables timestamp generation (see RPGNOTES_NO_TIME)
    --watch   Watches for changes and automatically rebuilds the site
    --serve   If watch is enabled, runs a web server to serve the site

Environment variables:
RPGNOTES_NO_TIME     Disables timestamp generation on pages
RPGNOTES_PERFORMANCE Enables performance logging`);
    process.exit()
}

const gmMode = process.argv.includes('--gm-mode');
const noTime = process.argv.includes('--no-time') || process.env.RPGNOTES_NO_TIME;
const watch = process.argv.includes('--watch');
const serve = process.argv.includes('--serve');

if (serve) {
    if (!watch) {
        console.warn('Warning: --serve cannot be used without --watch')
    } else {
        server.startServer(options.build.destination);
    }
}

const buildDate = new Date();
const buildDateDisplay = buildDate.toUTCString();
const buildDateIso = buildDate.toISOString();

metalsmith(__dirname)
    .metadata({
        siteTitle: options.about.title,
        noTime: noTime,
        buildDateDisplay,
        buildDateIso,
        cssFiles: options.build.cssFiles,
    })
    .source(options.build.source)
    .destination(options.build.destination)
    .clean(true)
    .watch(watch)
    .use(performance.init())
    .use(secrets.pages(gmMode)).use(performance.measure('secrets.pages'))
    .use(gitDate(options.build.source)).use(performance.measure('gitDate'))
    .use(home()).use(performance.measure('home'))
    .use(css(__dirname)).use(performance.measure('css'))
    .use(search.page(__dirname)).use(performance.measure('search.page'))
    .use(collections(collections_opts)).use(performance.measure('collections'))
    .use(collect()).use(performance.measure('collect'))
    .use(markdown()).use(performance.measure('markdown'))
    .use(macros(options.build.macroDirectory)).use(performance.measure('macros'))
    .use(alignment()).use(performance.measure('alignment'))
    .use(secrets.sections(gmMode)).use(performance.measure('secrets.sections'))
    .use(validate()).use(performance.measure('validate'))
    .use(links.analyze()).use(performance.measure('links.analyze'))
    .use(layouts({
        default: 'page.hbs',
        pattern: '**/*.html',
    })).use(performance.measure('layouts'))
    .use(links.transform(gmMode)).use(performance.measure('links.transform'))
    .use(permalinks({ relative: false })).use(performance.measure('permalinks'))
    .use(brokenLinkChecker({ checkAnchors: true })).use(performance.measure('brokenLinkChecker'))
    .use(search.index()).use(performance.measure('search.index'))
    .use(performance.result())
    .build(function (err, files) {
        if (err) { throw err; }
    });
