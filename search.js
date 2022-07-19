import Fuse from 'https://cdn.jsdelivr.net/npm/fuse.js@6.6.2/dist/fuse.esm.min.js';

function getContext(s, start, end, context) {
    const contextStart = Math.max(start - context, 0);
    const contextEnd = Math.min(end + context, s.length);

    const prefix = contextStart == 0 ? '"' : '"…';
    const suffix = contextEnd == s.length ? '"' : '…"';

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

const searchText = new URLSearchParams(location.search).get('q');

document.getElementsByTagName('h2')[0].textContent = 'Search results for "' + searchText + '".';

const objects = await (await fetch('/search_objects.json')).json();
const fuseIndex = Fuse.parseIndex(await (await fetch('/search_index.json')).json());

const fuseOptions = {
    keys: ['contents'],
    includeScore: true,
    includeMatches: true,
    minMatchCharLength: 3,
    ignoreLocation: true,
    useExtendedSearch: true,
};
const fuse = new Fuse(objects, fuseOptions, fuseIndex);

const resultsElement = document.getElementById('search-results');
for (const result of fuse.search(searchText)) {
    if (result.score > 0.6) {
        continue;
    }

    const p1 = document.createElement('p');

    const link = document.createElement('a');
    link.href = result.item.path;
    link.textContent = result.item.title;
    p1.appendChild(link);

    const contexts = [];
    for (const match of result.matches) {
        for (const index of match.indices) {
            contexts.push(getContext(match.value, index[0], index[1] + 1, 10));
        }
    }

    const p2 = document.createElement('p');
    p2.innerHTML = contexts.join(', ');

    const newListItem = document.createElement('li');
    newListItem.appendChild(p1);
    newListItem.appendChild(p2);

    resultsElement.appendChild(newListItem);
}
