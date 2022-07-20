import MiniSearch from 'https://cdn.jsdelivr.net/npm/minisearch@5.0.0/dist/es5m/index.min.js';

const searchText = new URLSearchParams(location.search).get('q');

document.getElementsByTagName('h2')[0].textContent = 'Search results for "' + searchText + '".';

const searchOptions = await (await fetch('/search_options.json')).json();
const searchIndex = await (await fetch('/search_index.json')).text();
const minisearch = MiniSearch.loadJSON(searchIndex, searchOptions);

const resultsElement = document.getElementById('search-results');
for (const result of minisearch.search(searchText)) {
    const p1 = document.createElement('p');

    const link = document.createElement('a');
    link.href = result.path;
    link.textContent = result.title;
    p1.appendChild(link);

    const matches = [];
    for (const match of Object.keys(result.match)) {
        matches.push(match);
    }

    const p2 = document.createElement('p');
    p2.innerHTML = matches.join(', ');

    const newListItem = document.createElement('li');
    newListItem.appendChild(p1);
    newListItem.appendChild(p2);

    resultsElement.appendChild(newListItem);
}
