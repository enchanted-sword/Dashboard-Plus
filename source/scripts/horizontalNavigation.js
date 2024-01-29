import { keyToCss, keyToClasses, translate } from './utility/tumblr.js';
import { userBlogs } from './utility/user.js';
import { mutationManager } from './utility/mutations.js';
import { elem } from './utility/jsTools.js';
import { s } from './utility/style.js';
import { svgIcon, svgIconString } from './utility/dashboardElements.js';

const match = [
  '',
  'dashboard',
  'settings',
  'blog',
  'domains',
  'search',
  'likes',
  'following',
  'inbox',
  'tagged',
  'explore',
  'reblog'
];
const pathname = location.pathname.split('/')[1];
const customClass = 'dbplus-hnav';
const menuSelector = `${s('homeMenu')},#account_subnav`;
const tileSelector = `${s('blogTile')},${s('accountBlogItem')}`

const newCaret = i => elem('button', { class: `${keyToClass('button')} ${customClass}`, index: i, 'aria-label': translate('Show Blog Statistics')}, {
  'click': function() {
    if ($(s('accountStats')).eq(i).is(':hidden')) {
      $(this).css('transform', 'rotate(180deg)');
      } else { $(this).css('transform', 'rotate(0deg)'); }
    $(s('accountStats')).eq(i).toggle();
  }}, 
  `<span class='${keyToClass('buttonInner')} ${keyToClass('menuTarget')}' tabindex='-1'>
    ${svgIconString('caret-thin', 12, 12, customClass)}
  </span>`
);
const newStats = blog => $(`
  <ul class='${keyToClass('accountStats')} ${customClass}'>
    <li>
        <a class='${customClass}' href='/blog/${blog}'>
            <span>${translate('Posts')}</span>
        </a>
    </li>
    <li>
        <a class='${customClass}' href='/blog/${blog}/followers'>
            <span>${translate('Followers')}</span>
        </a>
    </li>
    <li id='${customClass}-${blog}-activity'>
        <a class='${customClass}' href='/blog/${blog}/activity'>
            <span>${translate('Activity')}</span>
        </a>
    </li>
    <li>
        <a class='${customClass}' href='/blog/${blog}/drafts'>
            <span>${translate('Drafts')}</span>
        </a>
    </li>
    <li>
        <a class='${customClass}' href='/blog/${blog}/queue'>
            <span>${translate('Queue')}</span>
        </a>
    </li>
    <li>
        <a class='${customClass}' href='/blog/${blog}/post-plus'>
            <span>${translate('Post+')}</span>
        </a>
    </li>
    <li>
        <a class='${customClass}' href='/blog/${blog}/blaze'>
            <span>${translate('Tumblr Blaze')}</span>
        </a>
    </li>
    <li>
        <a class='${customClass}' href='/settings/blog/${blog}'>
            <span>${translate('Blog settings')}</span>
        </a>
    </li>
    <li>
        <a class='${customClass}' href='/mega-editor/published/${blog}' target='_blank'>
            <span>${translate('Mass Post Editor')}</span>
        </a>
    </li>
  </ul>
`);
const newSubnavItem = (title, href, icon, h, w) => {
  const navItem = elem('li', { class: `${keyToClass('navItem')} ${keyToClass('desktop')} ${customClass}`, 'data-title': title, title: translate(title) }, null,
    `<a class='${keyToClasses('navLink').join(' ')}' href='${href}'>
      <div class='${keyToClasses('navInfo').join(' ')}'>
        <span class='${keyToClasses('childWrapper').join(' ')}'>${translate(title)}</span>
        <span class='${keyToClasses('endChildWrapper').join(' ')}'></span>
      </div>
    </a>`
  );
  $(navItem).find(keyToCss('childWrapper')).prepend(svgIcon(icon, h, w, customClass));
  return navItem;
};
const keyToClass = key => keyToClasses(key)[0];

const fetchStats = async () => {
  const data = userBlogs;
  for (const blog of data) {
    for (const key of ['posts', 'followers', 'drafts', 'queue']) {
      if (blog[key]) {
        const count = $(elem('span', { class: `${customClass}-count`}, null, [blog[key]]));
        if (key === 'posts') {
          $(`.${customClass}[href='/blog/${blog.name}']`).append(count);
        } else { $(`.${customClass}[href='/blog/${blog.name}/${key}']`).append(count); }
      }
    }
    if (blog.isGroupChannel) {
      const members = elem('li', null, null,
        `<a class='${customClass}' href='/blog/${blog.name}/members' target='_blank'>
          <span>${translate('Members')}</span>
        </a>`
      );
      $(`#${customClass}-${blog.name}-activity`)[0].after(members);
    }
  }
};
const addStats = async () => {
  const blogTiles = $(tileSelector);
  for (let i = 0; i < blogTiles.length; ++i) {
    const tile = blogTiles.eq(i);
    const blog = tile.find(s('displayName')).text();
    const caret = newCaret(i);

    tile.find(s('actionButtons')).append(caret);
    const stats = $(newStats(blog));
    stats.insertAfter(tile);
    stats.hide();
  }
  fetchStats().then(() => { $(`button.${customClass}`).eq(0).trigger('click'); });
};

const bar = $(`${s('postColumn')} > ${s('bar')}`);
const search = $(s('searchSidebarItem'));
const accountHeader = elem('div', { class: `${keyToClass('navSubHeader')} ${customClass}` }, null, `<h3>Account</h3>`);

const shuffleIcons = () => {
  const settings = newSubnavItem('Settings', '/settings/account', 'settings', 20, 20);
  const domains = newSubnavItem('Domains', '/domains', 'earth', 20, 20);
  const adFree = newSubnavItem('Go Ad-Free', '/settings/ad-free-browsing', 'sparkle', 21, 20);
  const purchases = newSubnavItem('Payment & Purchases', '/settings/purchases', 'payment-purchases', 21, 20);
  const gifts = newSubnavItem('Gifts', '/settings/gifts', 'gift', 21, 20);

  $(settings).insertAfter($(s('navItem')).has('[href="/following"]'));
  settings.after(domains);
  domains.after(adFree);
  adFree.after(purchases);
  purchases.after(gifts);
};
const menuModfifcations = menu => {
  menu = menu[0];
  shuffleIcons();
  addStats();
  
  if (menu.matches('#account_subnav')) {
    menu.prepend(accountHeader);
    $(accountHeader).append($(s('logoutButton')));

    $(`[href="/likes"] ${s('childWrapper')}`).prepend(svgIcon('like-filled', 18, 20, customClass));
    $(`[href="/following"] ${s('childWrapper')}`).prepend(svgIcon('following', 20, 21, customClass));
    $(document).on('click', () => {
      if (!$('#account_subnav:hover').length && !$('#account_subnav').attr('hidden')) { document.getElementById('account_button').click(); }
    });
  }
};


export const main = async function () {
  if (window.innerWidth < 990) return;
  
  requestAnimationFrame(() => {
    if ($('#base-container').attr('data-navigation') === 'horizontal') return;
    else $('#base-container').attr('data-navigation', 'horizontal');

    if (bar.length) $(s('tabsHeader')).insertAfter(bar);
    if (search.length) $(s('navigation')).append(search);

    if (!match.includes(pathname)) {
      $(s('layout')).prepend($(elem('div', { class: `${customClass} ${keyToClass('searchSidebarItem')}` }, null,
        `<div class='${keyToClass('formContainer')}'>
          <span data-testid='controlled-popover-wrapper' class='${keyToClass('targetWrapper')}'>
            <span class='${keyToClass('targetWrapper')}'>
              <form method='GET' action='/search' role='search' class='${keyToClass('form')}'>
                <div class='${keyToClasses('searchbarContainer')[1]}'>
                  <div class='${keyToClasses('searchIcon')[5]}'>
                    ${svgIconString('search', 18, 18, customClass)}
                  </div>
                  <input
                    name='q'
                    type='text'
                    autocomplete='off'
                    aria-label='${translate('Search')}'
                    class='${keyToClasses('searchbar')[1]}'
                    placeholder='${translate('Search Tumblr')}'
                    autocapitalize='sentences'
                    value=''
                  />
                </div>
              </form>
            </span>
          </span>
        </div>`
      )));
    }

    mutationManager.start(menuSelector, menuModfifcations);
  });
};

export const clean = async function () {
  requestAnimationFrame(() => {
    if (bar.length) bar.insertAfter($(s('tabsHeader')));
    if (search.length) search.prependTo($(`${s('sidebar')} aside`));
    $('[data-navigation]').removeAttr('data-navigation');

    $(s('nagivationWrapper')).removeClass(keyToClasses('headerWrapper').join(' '));
    $(s('logoutButton')).insertAfter($('#account_subnav li').has('[href="/following"]'));

    $(`.${customClass}`).remove();
    mutationManager.stop(menuModfifcations);
  });
};
