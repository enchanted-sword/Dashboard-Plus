import { translate } from './utility/tumblr.js';
import { userBlogs } from './utility/user.js';
import { mutationManager } from './utility/mutations.js';
import { debounce } from './utility/jsTools.js';
import { s } from './utility/style.js';
import { svgIcon } from './utility/dashboardElements.js';
import { noact } from './utility/noact.js';

let ENGAGED = false;

const customClass = 'dbplus-hnav';
const menuSelector = `${s('homeMenu')},#account_subnav`;
const tileSelector = `${s('blogTile')},${s('accountBlogItem')}`;

const newCaret = i => noact({
  className: customClass + ' hnav-caret',
  dataset: { state: i === 0 ? 'open' : '' },
  ariaLabel: translate('Show Blog Statistics'),
  onclick: function () {
    if (this.dataset.state === 'open') this.dataset.state = '';
    else this.dataset.state = 'open';
  },
  children: {
    tag: 'span',
    tabindex: -1,
    children: svgIcon('caret-thin', 12, 12, '', 'currentcolor')
  }
});

const newStats = blog => noact({
  tag: 'ul',
  className: customClass + ' hnav-blogStats',
  children: [
    {
      tag: 'li',
      children: {
        href: `/blog/${blog.name}`,
        children: [
          {
            tag: 'span',
            children: translate('Posts')
          },
          blog.posts || ''
        ]
      },
    },
    {
      tag: 'li',
      children: {
        href: `/blog/${blog.name}/followers`,
        children: [
          {
            tag: 'span',
            children: translate('Followers')
          },
          blog.followers || ''
        ]
      },
    },
    {
      tag: 'li',
      children: {
        href: `/blog/${blog.name}/activity`,
        children: [
          {
            tag: 'span',
            children: translate('Activity')
          }
        ]
      },
    },
    blog.isGroupChannel ? {
      tag: 'li',
      children: {
        href: `/blog/${blog.name}/members`,
        children: [
          {
            tag: 'span',
            children: translate('Members')
          }
        ]
      }
    } : null,
    {
      tag: 'li',
      children: {
        href: `/blog/${blog.name}/drafts`,
        children: [
          {
            tag: 'span',
            children: translate('Drafts')
          },
          blog.drafts || ''
        ]
      }
    },
    {
      tag: 'li',
      children: {
        href: `/blog/${blog.name}queue`,
        children: [
          {
            tag: 'span',
            children: translate('Queue')
          },
          blog.queue || ''
        ]
      }
    },
    {
      tag: 'li',
      children: {
        href: `settings/blog/${blog.name}`,
        children: [
          {
            tag: 'span',
            children: translate('Blog settings')
          }
        ]
      }
    },
    {
      tag: 'li',
      children: {
        href: `/mega-editor/published/${blog.name}`,
        target: '_blank',
        children: [
          {
            tag: 'span',
            children: translate('Mass Post Editor')
          }
        ]
      }
    },
  ]
});

const addStats = () => {
  const blogTiles = Array.from(document.querySelectorAll(tileSelector));
  blogTiles.forEach((tile, i) => {
    const blogName = tile.querySelector(s('displayName')).textContent;
    const blog = userBlogs.find(({ name }) => name === blogName);
    const caret = newCaret(i);

    if (blog) {
      tile.querySelector(s('actionButtons'))?.append(caret);
      const stats = newStats(blog);
      tile.insertAdjacentElement('afterend', stats);
    }
  });
};

const newSubNavItem = (title, href, icon, h, w) => noact({
  tag: 'li',
  className: customClass + ' hnav-subNavItem',
  dataset: { title },
  title: translate(title),
  children: {
    href,
    children: [
      {
        tag: 'span',
        children: [
          svgIcon(icon, h, w, '', 'rgba(var(--black), 0.65);'),
          translate(title)
        ]
      },
    ]
  }
});

const newAccountHeader = () => noact({
  id: 'dbplus-accountHeader',
  className: customClass + ' hnav-navSubHeader',
  children: {
    tag: 'h3',
    children: translate('Account')
  }
});

const shuffleIcons = () => {
  const settings = newSubNavItem('Settings', '/settings/account', 'settings', 20, 20);
  const domains = newSubNavItem('Domains', '/domains', 'earth', 20, 20);
  const adFree = newSubNavItem('Go Ad-Free', '/settings/ad-free-browsing', 'sparkle', 21, 20);
  const purchases = newSubNavItem('Payment & Purchases', '/settings/purchases', 'payment-purchases', 21, 20);
  const gifts = newSubNavItem('Gifts', '/settings/gifts', 'gift', 21, 20);

  document.querySelector(`${s('navItem')}:has([href="/following"])`)?.insertAdjacentElement('afterend', settings);
  settings.insertAdjacentElement('afterend', domains);
  domains.insertAdjacentElement('afterend', adFree);
  adFree.insertAdjacentElement('afterend', purchases);
  purchases.insertAdjacentElement('afterend', gifts);
};

const menuModfifcations = menu => {
  menu = menu[0];
  shuffleIcons();
  addStats();

  if (menu.matches('#account_subnav')) {
    const header = newAccountHeader();
    menu.prepend(header);
    header.append(document.querySelector(s('logoutButton')));

    document.querySelector(`[href="/likes"] ${s('childWrapper')}`)?.prepend(svgIcon('like-filled', 18, 20, customClass));
    document.querySelector(`[href="/following"] ${s('childWrapper')}`)?.prepend(svgIcon('following', 20, 21, customClass));
    window.addEventListener('click', function () {
      const accountSubnav = document.getElementById('account_subnav');
      if (!accountSubnav?.matches(':hover') && !accountSubnav.hasAttribute('hidden')) document.getElementById('account_button')?.click();
    })
  }
};

const reorientNav = () => requestAnimationFrame(() => {
  if (document.getElementById('base-container').dataset.navigation === 'horizontal') return;
  document.getElementById('base-container').dataset.navigation = 'horizontal';

  document.querySelector(s('tabsHeader'))?.insertAdjacentElement('afterend', document.querySelector(`${s('postColumn')} > ${s('bar')}`));
  document.querySelector(s('navigation'))?.append(document.querySelector(s('searchSidebarItem')));

  mutationManager.start(menuSelector, menuModfifcations);
  ENGAGED = true;
});


export const main = async function () {
  window.addEventListener('resize', debounce(function (event) {
    if (window.innerWidth >= 990 && !ENGAGED) reorientNav();
    else if (window.innerWidth < 990 && ENGAGED) clean();
  }));
  if (window.innerWidth >= 990) reorientNav();
};

export const clean = async function () {
  requestAnimationFrame(() => {
    document.querySelector(`${s('postColumn')} > ${s('bar')}`)?.insertAdjacentElement('afterend', document.querySelector(s('tabsHeader')));
    document.querySelector(`${s('sidebar')} aside`)?.append(document.querySelector(s('searchSidebarItem')));
    document.querySelector('[data-navigation]')?.removeAttribute('data-navigation');
    document.querySelector('#account_subnav li:has([href="/following"])')?.insertAdjacentElement(document.querySelector(s('logoutButton')));

    document.querySelectorAll(`.${customClass}`).forEach(e => e.remove());
    mutationManager.stop(menuModfifcations);
    ENGAGED = false;
  });
};
