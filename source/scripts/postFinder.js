import { openDatabase, updateData, updateNeeded, getIndexedPosts } from './utility/database.js';
import { unique, debounce, getOptions } from './utility/jsTools.js';
import { noact } from './utility/noact.js';
import { svgIcon } from './utility/dashboardElements.js';
import { navigate } from './utility/tumblr.js';

import { fillDb } from './utility/dbTest.js';

const customClass = 'dbplus-postFinder';

let db, splitMode, maxResults, resultSection, postIndices, searchableIndices;
const textSeparator = 'φ(,)';
const querySeparators = {
  comma: ',',
  space: ' '
};

const updateFrequency = 100;
const cursorStatus = { // silly little react-esque state var
  _index: 0,
  _remaining: 0,
  _hits: 0,
  keywords: [],

  get index() {
    return this._index;
  },
  set index(n) {
    this._index = n;
    if (!(n % updateFrequency)) document.querySelectorAll('.postFinder-status-cursorIndex')?.forEach(e => e.textContent = n);
  },
  get remaining() {
    return this._remaining;
  },
  set remaining(n) {
    this._remaining = n;
    if (!(n % updateFrequency)) document.querySelectorAll('.postFinder-status-cursorRemaining')?.forEach(e => e.textContent = n);
  },
  get hits() {
    return this._hits;
  },
  set hits(n) {
    this._hits = n;
    if (!(n % updateFrequency)) document.querySelectorAll('.postFinder-status-cursorHits')?.forEach(e => e.textContent = n);
  },

  sync() {
    document.querySelectorAll('.postFinder-status-cursorIndex')?.forEach(e => e.textContent = this._index);
    document.querySelectorAll('.postFinder-status-cursorRemaining')?.forEach(e => e.textContent = this._remaining);
    document.querySelectorAll('.postFinder-status-cursorHits')?.forEach(e => e.textContent = this._hits);
  },
  syncInterval: 0,
  enableAutoSync() {
    if (this.syncInterval === 0) this.syncInterval = window.setInterval(() => this.sync(), 1000);
  },
  disableAutoSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.sync();
      this.syncInterval = 0;
    }
  }
};
const indexProgress = {
  _progress: 0,
  _total: 0,

  get progress() {
    return this._progress;
  },
  set progress(n) {
    this._progress = n;
    if (!(n % updateFrequency)) document.querySelectorAll('.postFinder-status-indexProgress')?.forEach(e => e.textContent = n);
  },
  get total() {
    return this._total;
  },
  set total(n) {
    this._total = n;
    document.querySelectorAll('.postFinder-status-indexTotal')?.forEach(e => e.textContent = n);
  },

  sync() {
    document.querySelectorAll('.postFinder-status-indexProgress')?.forEach(e => e.textContent = this._progress);
  },
  syncInterval: 0,
  enableAutoSync() {
    if (this.syncInterval === 0) this.syncInterval = window.setInterval(() => this.sync(), 1000);
  },
  disableAutoSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.sync();
      this.syncInterval = 0;
    }
  }
};

const unstringifyHits = hit => {
  const parsedInfo = JSON.parse(hit.quickInfo);

  parsedInfo.texts && (parsedInfo.texts = parsedInfo.texts.split(textSeparator));
  parsedInfo.blogs && (parsedInfo.blogs = parsedInfo.blogs.split(','));
  parsedInfo.types && (parsedInfo.types = parsedInfo.types.split(','));
  parsedInfo.tags && (parsedInfo.tags = parsedInfo.tags.split(','));

  return Object.assign(hit, { quickInfo: parsedInfo });
};

const newSearchProgress = () => noact({
  className: 'postFinder-status-cursor',
  children: [
    'checked ',
    {
      tag: 'span',
      className: 'postFinder-status-cursorIndex',
      children: cursorStatus.index || '?'
    },
    ' of ',
    {
      tag: 'span',
      className: 'postFinder-status-cursorRemaining',
      children: cursorStatus.remaining || '?'
    },
    ' posts (',
    {
      tag: 'span',
      className: 'postFinder-status-cursorHits',
      children: cursorStatus.hits || '?'
    },
    ' matches)'
  ]
});

const keywordSearch = async (keywords, start = 0) => {
  keywords = keywords.filter(isDefined).map(v => v.toLowerCase());
  const tx = db.transaction('searchStore', 'readonly');
  const hits = [];
  let cursor = await tx.store.openCursor(null, 'prev'), searchable, i = 0;

  cursorStatus.index = start;
  cursorStatus.hits = 0;
  cursorStatus.keywords = keywords;

  resultSection.append(newSearchProgress());

  if (start) await cursor.advance(start);

  const t0 = Date.now();
  cursorStatus.enableAutoSync();

  while (cursor && i < maxResults) {
    searchable = cursor.value;
    if (keywords.every(keyword => {
      if ((keyword[0] === '-' && !(searchable.quickInfo.toLowerCase().includes(keyword.substring(1))))
        || searchable.quickInfo.includes(keyword)) return true;
      else return false;
    })) {
      hits.push(searchable);
      ++cursorStatus.hits;
      ++i;
    }
    ++cursorStatus.index;
    cursor = await cursor.continue();
  }

  cursorStatus.disableAutoSync();
  console.log(`searched ${cursorStatus.index - start} indices in ${Date.now() - t0}ms`);

  return hits.map(unstringifyHits).sort((a, b) => (new Date(b.quickInfo.date)) - (new Date(a.quickInfo.date)));
};
const categorySearch = async ({ blogs, types, texts, tags, date }) => keywordSearch([blogs, types, texts, tags, date].flat());
const strictCategorySearch = async ({ blogs, types, texts, tags, date }) => categorySearch({ blogs, types, texts, tags, date }).then(hits => {
  [blogs, types, texts, tags] = [blogs, types, texts, tags].map(v => v.filter(k => k[0] !== '-').map(k => k.toLowerCase()));
  const threshold = [blogs, types, texts, tags, date].filter(v => v.length).length;
  const matches = [];

  hits.forEach(postInfo => {
    const { quickInfo } = postInfo;
    let n = 0;

    if (quickInfo.blogs?.length && blogs.length
      && blogs.every(searchedBlog => quickInfo.blogs.includes(searchedBlog))) ++n;
    if (quickInfo.types?.length && types.length
      && types.every(searchedType => quickInfo.types.includes(searchedType))) ++n;
    if (quickInfo.texts?.length && texts.length
      && quickInfo.texts.some(postText => texts.some(text => postText.includes(text)))) ++n;
    if (quickInfo.tags?.length && tags.length
      && tags.every(searchedTag => quickInfo.tags.includes(searchedTag))) ++n;
    if (date.length && date.some(date => quickInfo.date?.includes(date))) ++n;

    if (n === threshold) matches.push(postInfo);
  });

  return matches;
});

const isDefined = x => !!x;
const quickInfo = ({ id, blog, content, trail, tags, date }) => {
  const blogs = [blog, ...trail.map(({ blog }) => blog)].filter(isDefined);
  const contents = unique([...content, ...trail.flatMap(({ content }) => content)].filter(isDefined));
  const tagStr = unique([...tags, ...trail.flatMap(({ tags }) => tags)]).filter(isDefined).join(',').toLowerCase();
  const texts = unique(contents.map(({ question, answers, text }) => {
    const returnArr = [];
    question && returnArr.push(question);
    answers && returnArr.push(...answers.map(({ answerText }) => answerText));
    text && returnArr.push(text);
    return returnArr;
  }).flat(Infinity)).filter(isDefined).join(textSeparator).toLowerCase();

  return JSON.stringify({
    id,
    blogs: unique(blogs.map(blog => blog.name)).filter(isDefined).join(','),
    types: unique(contents.map(({ type }) => type)).filter(isDefined).join(','),
    texts,
    tags: tagStr,
    date
  });
};
const indexPosts = async (force = false) => {
  const tx = db.transaction('postStore', 'readonly');
  let cursor = await tx.store.openCursor(), post, i = 0;
  tx.store.getAllKeys().then(keys => indexProgress.total = keys.length);

  const t0 = Date.now();
  indexProgress.enableAutoSync();

  while (cursor) {
    post = cursor.value;
    if (!searchableIndices.has(post.id) || force) {
      const searchable = { id: post.id, summary: post.summary, postUrl: post.postUrl, quickInfo: quickInfo(post), storedAt: Date.now() };
      updateData({ searchStore: searchable }).then(() => {
        if (!searchableIndices.has(post.id)) {
          searchableIndices.add(post.id);
          ++indexProgress.progress;
        }
      });
      ++i;
    }

    cursor = await cursor.continue();
  }

  const dt = Date.now() - t0;

  indexProgress.disableAutoSync();
  console.log(`indexed ${i} posts in ${dt}ms\ncursor seek speed: ${((indexProgress.progress * 1000) / dt).toFixed(3)} keys/s`);

  cursorStatus.remaining = searchableIndices.length;
  indexProgress.progress = cursorStatus.remaining;

  document.getElementById('postFinder-status-index')?.remove();
  console.log(indexProgress);
};
const indexFromUpdate = async ({ detail: { targets } }) => { // take advantage of dispatched events to index new posts for free without opening extra cursors
  if ('postStore' in targets) {
    [targets.postStore].flat().map(post => {
      if (postIndices.has(post.id)) postIndices.add(post.id);
      if (!searchableIndices.has(post.id)) {
        const searchable = { id: post.id, summary: post.summary, postUrl: post.postUrl, quickInfo: quickInfo(post) };
        updateData({ searchStore: searchable }).then(() => {
          if (searchableIndices.has(post.id)) searchableIndices.add(post.id);
        });
      }
    });

    cursorStatus.remaining = searchableIndices.size;
  }
};

const months = ['jan', 'feb', 'mar', 'apr', 'may', 'june', 'july', 'aug', 'sept', 'oct', 'nov', 'dec'];

const typeIconColour = {
  text: 'black',
  photo: 'red',
  quote: 'orange',
  link: 'green',
  chat: 'blue',
  audio: 'purple',
  video: 'pink',
  ask: 'blue'
};

const newResultCounter = () => {
  const r = {
    tag: 'b',
    children: cursorStatus.hits
  }
  let l;
  if (cursorStatus.index < cursorStatus.remaining) l = ['showing the first ', r, ' results'];
  else l = [r, ` result${cursorStatus.hits > 1 ? 's' : ''} found`];
  return noact({ className: 'postFinder-resultCounter', children: l });
};
const renderResult = (post, hit) => {
  try {
    const d = new Date(post.date);

    return noact({
      tag: 'li',
      onclick: function (event) {
        closeDialog(event);
        navigate(`/${post.blogName}/${post.id}`)
      },
      className: 'postFinder-result',
      children: [
        {
          className: 'postFinder-info',
          children: [
            {
              className: 'postFinder-blog',
              children: [
                {
                  children: [
                    {
                      src: post.blog.avatar ? post.blog.avatar[2].url : 'https://assets.tumblr.com/pop/src/assets/images/avatar/anonymous_avatar_40-3af33dc0.png',
                      alt: post.blogName
                    },
                    post.blogName,
                  ]
                },
                `${d.getDate()} ${months[d.getMonth()]}, ${d.getFullYear()}`
              ]
            },
            {
              className: 'postFinder-types',
              children: hit.quickInfo.types.map(type => {
                type === 'image' && (type = 'photo');
                return svgIcon(`posts-${type}`, 24, 24, '', `rgb(var(--${typeIconColour[type]}))`);
              })
            }
          ]
        },
        {
          className: 'postFinder-post',
          children: [
            post.summary ? post.summary : null
          ]
        },
        post.tags.length ? {
          className: 'postFinder-tags',
          children: post.tags.map(t => ({ children: '#' + t }))
        } : null,
        {
          className: 'postFinder-link',
          href: post.postUrl,
          children: post.postUrl
        }
      ]
    });
  } catch (e) {
    console.error('postFinder renderResult error:', e, post, hit);
    return '';
  }
};
const renderResults = async (hits, replace = true) => {
  console.info(hits);


  if (!hits.length) {
    if (replace) resultSection.replaceChildren('zero results found');
    return;
  }

  const posts = await getIndexedPosts(hits.map(({ id }) => id));
  const results = posts.map((post, i) => renderResult(post, hits[i]));
  let resultLabel = newResultCounter();

  if (replace) resultSection.replaceChildren(resultLabel, ...results);
  else resultSection.append(...results)
};

const paginationFunction = page => async function () {
  this.remove(); // remove pagination button
  document.querySelector('.postFinder-resultCounter')?.remove();
  keywordSearch(cursorStatus.keywords, cursorStatus.index).then(hits => {
    paginationManager(hits, page + 1);
  });
};
const newPaginationMenu = page => noact({
  className: 'postFinder-pagination',
  onclick: paginationFunction(page),
  children: `load next ${maxResults} results`
});

const paginationManager = async (hits, page = 1) => {
  await renderResults(hits, page === 1);

  if (cursorStatus.index < cursorStatus.remaining) {
    resultSection.append(newPaginationMenu(page));
  }
};

async function onKeywordSearch({ target }) {
  let keywords = target.value;

  keywords = keywords.split(querySeparators[splitMode]).map(v => v.trim()).filter(isDefined);
  if (splitMode === 'space') keywords = keywords.map(v => v.replace(/_/g, ' '));

  if (!(keywords.length)) {
    resultSection.replaceChildren([]);
    return;
  }

  keywordSearch(keywords).then(paginationManager);
}
async function onAdvancedSearch() {
  const date = document.getElementById('postFinder-advanced-date').value;
  let keywordCategories = ['blogs', 'types', 'text', 'tags'].map(v => document.getElementById(`postFinder-advanced-${v}`).value);

  keywordCategories = keywordCategories.map(keywords => keywords.split(querySeparators[splitMode]).map(v => v.trim()).filter(isDefined));

  if (splitMode === 'space') keywordCategories = keywordCategories.map(keywords => keywords.map(v => v.replace(/_/g, ' ')));

  if (keywordCategories.every(keywords => !keywords.length) && !date) {
    resultSection.replaceChildren([]);
    return;
  }

  const [blogs, types, texts, tags] = keywordCategories;

  const strict = document.getElementById('postFinder-advanced-strict').checked;

  this.setAttribute('disabled', '');
  let px;

  if (strict) px = strictCategorySearch({ blogs, types, texts, tags, date }).then(paginationManager);
  else px = categorySearch({ blogs, types, texts, tags, date }).then(paginationManager);

  await px;
  this.removeAttribute('disabled');
}

function showDialog(event) {
  event.preventDefault();
  searchWindow.setAttribute('open', '');
}
function closeDialog(event) { if (!('key' in event) || (event.key === 'Escape' && searchWindow.hasAttribute('open'))) searchWindow.removeAttribute('open'); }

function toggleAdvanced() {
  const def = document.getElementById('postFinder-defaultSearch');

  if (this.dataset.state) {
    this.dataset.state = '';
    document.getElementById('postFinder-advanced').style.display = 'none';

    def.removeAttribute('disabled');
  } else {
    this.dataset.state = 'open';
    document.getElementById('postFinder-advanced').style.display = 'flex';

    def.value = '';
    def.setAttribute('disabled', '');
    resultSection.replaceChildren([]);
  }
}

const button = noact({
  className: 'postFinder-button',
  onclick: showDialog,
  children: [
    {
      tag: 'h2',
      className: 'postFinder-title',
      children: 'post finder'
    },
    svgIcon('search', 24, 24, 'postFinder-icon', 'rgb(var(--white-on-dark))'),
    {
      id: 'postFinder-status-index',
      children: [
        'indexed ',
        {
          tag: 'span',
          className: 'postFinder-status-indexProgress',
          children: indexProgress.progress || '?'
        },
        ' of ',
        {
          tag: 'span',
          className: 'postFinder-status-indexTotal',
          children: indexProgress.total || '?'
        },
        ' posts'
      ]
    }
  ]
});

const searchWindow = noact({
  tag: 'dialog',
  className: `${customClass} postFinder-dialog`,
  onclick: function (event) {
    try {
      event.stopPropagation();
      if (event.target.matches(':is(dialog, .postFinder-close)')) searchWindow.removeAttribute('open');
    } catch { void 0; }
  },
  children: [{
    className: 'postFinder-container',
    children: [
      {
        className: 'postFinder-titleRow',
        children: [
          {
            tag: 'h2',
            children: ['search']
          },
          {
            tag: 'svg',
            className: 'postFinder-close',
            fill: 'none',
            viewBox: '0 0 24 24',
            'stroke-width': 2,
            stroke: 'rgb(var(--red))',
            'aria-hidden': true,
            children: [{
              'stroke-linecap': 'round',
              'stroke-linejoin': 'round',
              d: 'M6 18L18 6M6 6l12 12'
            }]
          }
        ]
      },
      {
        className: 'postFinder-searchRow',
        children: [
          {
            tag: 'input',
            id: 'postFinder-defaultSearch',
            className: 'postFinder-search',
            type: 'text',
            name: 'q1',
            placeholder: 'search cached posts',
            oninput: debounce(onKeywordSearch)
          },
          {
            onclick: toggleAdvanced,
            dataset: { state: '' },
            children: svgIcon('filter', 24, 24, '', 'rgba(var(--black), .6)')
          }
        ]
      },
      {
        id: 'postFinder-advanced',
        children: [
          {
            tag: 'h3',
            style: 'margin-bottom:.5rem',
            children: 'advanced search'
          },
          {
            children: [
              {
                tag: 'label',
                for: 'postFinder-advanced-blogs',
                children: 'blogs'
              },
              {
                tag: 'input',
                type: 'text',
                id: 'postFinder-advanced-blogs',
                className: 'postFinder-search',
                placeholder: 'blogs'
              }
            ]
          },
          {
            children: [
              {
                tag: 'label',
                for: 'postFinder-advanced-types',
                children: 'types'
              },
              {
                tag: 'input',
                type: 'text',
                id: 'postFinder-advanced-types',
                className: 'postFinder-search',
                placeholder: 'types (e.g. text, image)'
              }
            ]
          },
          {
            children: [
              {
                tag: 'label',
                for: 'postFinder-advanced-text',
                children: 'text'
              },
              {
                tag: 'input',
                type: 'text',
                id: 'postFinder-advanced-text',
                className: 'postFinder-search',
                placeholder: 'text'
              }
            ]
          },
          {
            children: [
              {
                tag: 'label',
                for: 'postFinder-advanced-tags',
                children: 'tags'
              },
              {
                tag: 'input',
                type: 'text',
                id: 'postFinder-advanced-tags',
                className: 'postFinder-search',
                placeholder: 'tags'
              }
            ]
          },
          {
            children: [
              {
                tag: 'label',
                for: 'postFinder-advanced-date',
                children: 'date'
              },
              {
                tag: 'input',
                type: 'date',
                id: 'postFinder-advanced-date',
                className: 'postFinder-search',
              }
            ]
          },
          {
            children: [
              {
                tag: 'label',
                for: '',
                children: 'strict mode'
              },
              {
                tag: 'input',
                type: 'checkbox',
                id: 'postFinder-advanced-strict'
              }
            ]
          },
          {
            id: 'postFinder-advanced-submit',
            onclick: onAdvancedSearch,
            children: 'search',
          }
        ]
      },
      {
        className: 'postFinder-placeholder',
        children: 'enter a query to see results!'
      },
      {
        id: 'postFinder-results',
        tag: 'ul',
        children: []
      }
    ]
  }]
});

export const main = async () => {
  ({ splitMode, maxResults } = await getOptions('postFinder'));
  db = await openDatabase();
  postIndices = new Set(await db.getAllKeys('postStore'));
  searchableIndices = new Set(await db.getAllKeys('searchStore'));

  document.body.append(button);
  document.body.append(searchWindow);
  document.addEventListener('keydown', closeDialog);
  document.getElementById('postFinder-defaultSearch').title = `${splitMode}-separated`;

  resultSection = document.getElementById('postFinder-results');

  indexProgress.progress = searchableIndices.size;
  indexProgress.total = postIndices.size;
  indexProgress.sync();

  if (indexProgress.progress === indexProgress.total) document.getElementById('postFinder-status-index').remove();

  indexPosts();
  window.addEventListener('dbplus-database-update', indexFromUpdate);

  //fillDb(0, 4000);
};

export const clean = async () => {
  button.remove();
  searchWindow.remove();
  document.querySelectorAll(`.${customClass}`).forEach(e => e.remove());
  document.removeEventListener('keydown', closeDialog);
};