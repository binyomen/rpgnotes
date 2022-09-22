import MiniSearch from 'https://cdn.jsdelivr.net/npm/minisearch@5.0.0/dist/es5m/index.min.js';

const searchText = new URLSearchParams(location.search).get('q');

document.getElementById('page-header').textContent = `Search results for "${searchText}"`;
document.getElementById('search-input').value = searchText;

const searchOptions = await (await fetch('/search_options.json')).json();
const searchIndex = await (await fetch('/search_index.json')).text();
const minisearch = MiniSearch.loadJSON(searchIndex, searchOptions);

function escapeRegex(s) {
    return s.replaceAll(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function getIndicesOfMatch(match, sourceText) {
    const regex = new RegExp(`\\b${escapeRegex(match)}\\b`, 'gi');
    const matches = sourceText.matchAll(regex);

    const indices = [];
    for (const match of matches) {
        indices.push([match.index, match.index + match[0].length]);
    }
    return indices;
}

function getContext(s, start, end, context) {
    const contextStart = Math.max(start - context, 0);
    const contextEnd = Math.min(end + context, s.length);

    const prefix = contextStart === 0 ? '"' : '"…';
    const suffix = contextEnd === s.length ? '"' : '…"';

    return (
        prefix +
            s.substring(contextStart, start) +
            '<mark>' +
            s.substring(start, end) +
            '</mark>' +
            s.substring(end, contextEnd) +
            suffix
    );
}

const resultsElement = document.getElementById('search-results');
for (const result of minisearch.search(searchText)) {
    const p1 = document.createElement('p');

    const link = document.createElement('a');
    link.href = result.path;
    link.textContent = result.title;
    p1.appendChild(link);

    const contexts = [];
    for (const [match, sources] of Object.entries(result.match)) {
        for (const source of sources) {
            const sourceText = result[source];
            const indices = getIndicesOfMatch(match, sourceText);
            for (const [start, end] of indices) {
                contexts.push(getContext(sourceText, start, end, 30));
            }
        }
    }

    const p2 = document.createElement('p');
    const contextList = document.createElement('ul');
    for (const context of contexts) {
        const contextListItem = document.createElement('li');
        contextListItem.innerHTML = context;
        contextList.appendChild(contextListItem);
    }
    p2.appendChild(contextList);

    const newListItem = document.createElement('li');
    newListItem.appendChild(p1);
    newListItem.appendChild(p2);

    resultsElement.appendChild(newListItem);
}
