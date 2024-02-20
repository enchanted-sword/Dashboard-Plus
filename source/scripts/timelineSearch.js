import { mutationManager, postFunction } from './utility/mutations.js';
import { timelineObject } from './utility/reactProps.js';
import { elem } from './utility/jsTools.js';
import { svgIcon } from './utility/dashboardElements.js';
import { debounce } from './utility/jsTools.js';

const filters = {
  name: /"name":"([\w\d]*)"/g,
  blogName: /"blogName":"([\w\d]*)"/g,
  rebloggedRootName: /"rebloggedRootName":"([\w\d]*)"/g,
  rebloggedFromName: /"blogName":"([\w\d]*)"/g,
  summary: /"summary":"([^"]*)"/g,
  text: /"text":"([^"]*)"/g,
  tags: /"tags":\[((?:"(?:[^"]*)",?)*)\]/g,
  artist: /"artist":"([^"]*)"/g,
  album: /"album":"([^"]*)"/g,
  audioTitle: /url:"[^"]*","title":"([^"]*)"/g,
  sitename: /"sitename":"([^"]*)"/g,
  linkTitle: /sitename:"[^"]*","title":"([^"]*)"/g,
  description: /"description":"([^"]*)"/g
};

const hiddenAttribute = 'data-timeline-search-hidden';
const postSelector = `[tabindex="-1"][data-id] article:not([${hiddenAttribute}])`;
const targetSelector = '[data-timeline]:not(:has(.dbplus-timelineSearchContainer))';
const inputId = 'dbplus-timelineSearchTextarea';

const matchesToString = arr => arr.map(x => x[1]).join('');
const queryFilter = posts => {
  const query = document.getElementById(inputId).value.replace('"', '\'').toLowerCase();
  posts.forEach(async post => { // async forEach is okay here because queryFilter is synchronous
    let filterString = post.__timelineSearchFilter;

    if (typeof post.__timelineSearchFilter === 'undefined') {
      const str = JSON.stringify(await timelineObject(post))
        .replace(/\\"/g, '\'').replace(/"descriptionNpf":\[({"type":"text","text":"([^"]*)"},?)*\],/g, '');

      for (const key in filters) {
        filterString += matchesToString([...str.matchAll(filters[key])]);
      }
      filterString = filterString.toLowerCase();
      post.__timelineSearchFilter = filterString;
    }
    if (!filterString.includes(query)) post.setAttribute(hiddenAttribute, '');
    else post.removeAttribute(hiddenAttribute);
  });
};
const onInput = ({ target }) => {
  postFunction.stop(queryFilter);
  if($(`[${hiddenAttribute}]`).length) queryFilter(document.querySelectorAll(`[${hiddenAttribute}]`));
  if (target.value) postFunction.start(queryFilter, postSelector);
};
const search = elem('div', { class: 'dbplus-timelineSearchContainer' }, null, [
  elem('div', { class: 'dbplus-timelineSearchIcon' }, null, [svgIcon('search', 18, 18, '', 'rgba(var(--white-on-dark),.65)')]),
  elem('input', { type: 'text', id: inputId, placeholder: 'Search the timeline', value: '' }, { input: debounce(onInput) }, null)
]);
const renderSearch = element => element[0].prepend(search);

export const main = async () => mutationManager.start(targetSelector, renderSearch);

export const clean = async () => {
  mutationManager.stop(renderSearch);
  $('.dbplus-timelineSearchContainer').remove();
  $(`[${hiddenAttribute}]`).removeAttr(hiddenAttribute);
  postFunction.stop(queryFilter);
};
