import { elem } from './jsTools.js';
import { apiFetch, navigate, translate, replaceTranslate, keyToString } from './tumblr.js';
import { hexToRgbString } from './color.js';
import { formatTextBlock } from './npfTools.js';
import { mutationManager } from './mutations.js';
import { s } from './style.js';

const k = str => str.split(' ').map(key => `dbplus-customPopover-${key}`).join(' ');
const urlInfoLink = url => `/v2/url_info?url=${url}&fields[blogs]=avatar,name,title,url,blog_view_url,description_npf,theme,uuid`;
const fetchedUrlInfo = async url => await apiFetch(url).catch((error) => {
  console.error(error);
  return { response: {} };
});
const blogViewRegex = /https:\/\/[\w\d\.-]+\/post\/([\d]*)/
const blogViewNavigate = function (event) {
  event.preventDefault();
  event.stopPropagation();

  const anchor = event.target.closest('a')
  let href = anchor.getAttribute('href');
  if (blogViewRegex.test(href)) href = `/${anchor.getAttribute('blogname')}/${blogViewRegex.exec(href)[1]}`;
  navigate(href);
};
const HTMLDescription = descriptionNpf => {
  const elementStringArray = descriptionNpf.map(block => `<div>${formatTextBlock(block)}</div>`);
  return elementStringArray.join('');
}

const setPopoverHoverFlag = function (event) {
  event.target.closest('.dbplus-customPopover-baseContainer').dataset.hover = true;
}
const popoverSelfRemove = function (event) {
  event.stopPropagation();
  const popover = event.target.closest('.dbplus-customPopover-baseContainer');
  if (popover.matches('[data-hover]')) {
    popover.style.opacity = 0;
    window.setTimeout(() => { popover.remove() }, 150);
  }
}
const displayPopover = async function (event) {
  const href = event.target.closest('a').href;
  const { bottom, left, width } = event.target.getBoundingClientRect();
  const xPos = left + width / 2;
  const yPos = bottom + window.scrollY;
  const popover = await urlPopover(href, xPos, yPos);
  document.getElementById('glass-container').append(popover);
}
const removePopover = function (event) {
  window.setTimeout(() => {
    const popoverId = `dbplus-customPopover-${event.target.closest('a').href.replaceAll('/', '')}`;
    const popover = document.getElementById(popoverId);
    if (popover && popover.matches('[data-hover]') === false) {
      popover.style.opacity = 0;
      window.setTimeout(() => { popover.remove() }, 150);
    }
  }, 250);
}

const urlPopover = async (url, xPos, yPos) => {
  const apiUrl = urlInfoLink(url);
  const { response } = await fetchedUrlInfo(apiUrl);
  const { blog, posts } = response.content;

  const popover = elem('div', {
    class: k('baseContainer'),
    id: `dbplus-customPopover-${url.replaceAll('/', '')}`,
    tabindex: 0,
    role: 'group' 
  }, null, [
    elem('div', {
      class: k('popoverHolder'),
      style: `position: absolute; inset: 0px auto auto 0px; width: 280px; max-height: 370px; transform: translate(${xPos - 140}px, ${yPos + 10}px);`
    }, { mouseover: setPopoverHoverFlag, mouseleave: popoverSelfRemove }, [
      elem('div', {
          class: k('blogCard'),
          style: `
          --blog-title-color: ${blog.theme.titleColor};
          --blog-link-color: ${blog.theme.linkColor};
          --blog-background-color: ${blog.theme.backgroundColor};
          --blog-title-color-15: rgba(${hexToRgbString(blog.theme.titleColor)}, 0.15);
          --blog-link-color-15: rgba(${hexToRgbString(blog.theme.linkColor)}, 0.15);
          `
        }, null, null)
    ])
  ]);
  const blogCard = popover.querySelector('.dbplus-customPopover-blogCard');

  const blogHeader = elem('div', { class: k('blogHeader') }, null, [
    elem('div', { class: k(`bottomHalf smallBottom ${blog.theme.showAvatar ? 'withAvatar' : ''} ${blog.theme.showHeaderImage ? 'withStretchedHeaderImage' : 'withoutHeader'}`) }, null, [
      elem('div', { class: k('headerBar')}, null, [
        elem('div', { class: k(`headerContainer ${blog.theme.showHeaderImage ? 'withStretchedHeaderImage' : ''} blogCardHeaderBar`) }, null, [
          elem('header', {
            class: k(`headerBar ${blog.theme.showHeaderImage ? 'withStretchedHeaderImage' : ''} blogCardHeaderBar`),
            'aria-label': replaceTranslate(`%1$s's blog header`, blog.name),
            role: 'banner'
          }, null, [
            elem('div', { class: k('blogLinkRecommendationWrapper') }, null, [
              elem('div', { class: k('blogLinkWrapper blogCardBlogLink') }, null, [
                elem('a', {
                  class: k('blogLink'),
                  style: 'color: rgb(255, 255, 255);',
                  target: '_blank',
                  rel: 'noopener',
                  href: blog.url,
                  role: 'link',
                  tabindex: 0
                }, null, `<div class="${k('blogLinkShort')}">${blog.name}</div>`)
              ])
            ])
          ])
        ]),
      ])
    ])
  ]);

  if (blog.theme.showHeaderImage) {
    const headerImage = elem('a', {
      class: k('headerImage small stretched blogLink'),
      target: '_blank',
      rel: 'noopener',
      href: `/${blog.name}`,
      role: 'link',
      tabindex: 0
    }, { click: blogViewNavigate }, [
      elem('img', { class: k('image'), src: blog.theme.headerImageFocused, alt: blog.title, loading: 'lazy' }, null, null)
    ]);
    blogHeader.prepend(headerImage);
  }

  const bottomHalf = blogHeader.querySelector('.dbplus-customPopover-bottomHalf');
  if (blog.theme.showAvatar) {
    const blogAvatar = elem('a', {
      class: k('avatarBlock blogLink'),
      target: '_blank',
      rel: 'noopener',
      href: `/${blog.name}`,
      role: 'link',
      tabindex: 0
    }, { click: blogViewNavigate }, `
      <div class="${k('avatarPositioner smallAvatarPositioner atopHeaderImage')}">
        <div class="${k(`avatarWrapper animateAvatar smallAvatar ${blog.theme.avatarShape}`)}">
          <div class="${k('avatarWrapper')}" role="figure" aria-label="${translate('avatar')}">
            <div class="${k('avatar')}" style="width: 64px; height: 64px;">
              <div class="${k(`avatarWrapperInner ${blog.theme.avatarShape}`)}">
                <div class="${k('placeholder')}" style="padding-bottom: 100%;">
                  <img
                    class="${k('image visible')}"
                    srcset="${blog.avatar[3].url} 64w, ${blog.avatar[2].url} 96w, ${blog.avatar[1].url} 128w, ${blog.avatar[0].url} 512w"
                    sizes="64px" alt="${translate('Avatar')}" style="width: 64px; height: 64px;" loading="eager">
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `);
    bottomHalf.firstElementChild.after(blogAvatar);
  }
  if (blog.theme.showTitle || blog.theme.showDescription) {
    const textContainer = elem('div', { class: k('textContainer') }, null, null);
    if (blog.theme.showTitle) textContainer.append(elem('h1', {
      class: k('title'),
      style: 'font-family: "${blog.theme.titleFont}"; font-weight: bold; color: var(--blog-title-color);'
    }, null, [blog.title]));
    if (blog.theme.showDescription) textContainer.append(elem('div', { class: k('description') }, null, `
      <div class="${k('description small gradient')}">
        ${HTMLDescription(blog.descriptionNpf)}
      </div>`));
    bottomHalf.append(textContainer);
  } else if (!blog.theme.showHeaderImage && blog.theme.showAvatar) bottomHalf.classList.add(k('empty'));

  const postsWrapper = elem('div', { class: k('posts') }, null, null);
  posts.forEach(post => {
    let postElement;
    const postWrapper = elem('a', { class: k('chicletHolder blogLink'), blogname: blog.name, href: post.links.tap.href, target: '_blank', rel: 'noopener', tabindex: 0 }, { click: blogViewNavigate }, null)

    switch (post.objectData.displayStyle) {
      case 'regular':
        postElement = elem('div', { class: k('text') }, null, `
          <div class="${k('textBlock textBlockMicro')}">
            <p>${post.objectData.body}</p>
          </div>
        `);
        break;
      case 'photo':
        postElement = elem('figure', { class: k('image') }, null, `
          <div class="${k('placeholder foreground')}" style="padding-bottom: 100%;">
            <img class="${k('image visible blankBackground')}"
              srcset="${post.objectData.backgroundImage} 100w"
              sizes="80px" alt="${translate('Image')}" loading="lazy">
          </div>
        `);
        break;
      case 'video':
        postElement = elem('div', { class: k('video') }, null, `
          <div class="${k('placeholder foreground')}" style="padding-bottom: 100%;">
            <img class="${k('image visible blankBackground')}"
              srcset="${post.objectData.backgroundImage} 100w"
              sizes="80px" alt="${translate('Image')}" loading="lazy">
          </div>
          <em class="${k('playButton')}">
            <svg xmlns="http://www.w3.org/2000/svg" height="46" width="46" role="presentation">
              <use href="#managed-icon__play-circle"></use>
            </svg>
          </em>
        `);
        break;
      case 'audio':
        postElement = elem('div', { class: k('audio') }, null, `
          <div class="${k('placeholder foreground')}" style="padding-bottom: 100%;">
            <img class="${k('image visible blankBackground')}"
              srcset="${post.objectData.backgroundImage} 100w"
              sizes="80px" alt="${translate('Image')}" loading="lazy">
          </div>
          <em class="${k('audioPlayButton')}">
            <svg xmlns="http://www.w3.org/2000/svg" height="46" width="46" role="presentation">
              <use href="#managed-icon__play"></use>
            </svg>
          </em>
        `);
        break;
    }
    postWrapper.append(postElement);
    postsWrapper.append(postWrapper);
  });

  blogCard.append(blogHeader);
  blogCard.append(postsWrapper);

  return popover;
};

/**
 * @param {Element} anchor - Tumblr blog URL to attach a blog popover to 
 */
export const addUrlPopover = async anchor => {
  if (!anchor) return;
  
  anchor.addEventListener('mouseenter', displayPopover);
  anchor.addEventListener('mouseleave', removePopover);
}

const controlTargetSelector = `[tabindex="-1"][data-id] article ${s('footerRow')}:has(${s('noteCount')}) ${s('controls')}`;
const newControlIcon = (icon, func, tooltip) => elem('div', { class: 'dbplus-controlIcon' }, null, [
  elem('span', { class: 'dbplus-controlIconWrapper' }, null, [
    elem('button', { class: 'dbplus-controlIconButton', 'aria-label': tooltip }, { 'click': func }, `
      <span class="dbplus-controlIconButtonInner" tabindex="-1">
        <svg xmlns="http://www.w3.org/2000/svg" height="24" width="24" role="presentation" style="--icon-color-primary: rgba(var(--black), 0.65);">
          <use href="#managed-icon__${icon}"></use>
        </svg>
      </span>
    `),
    elem('div', { class: 'dbplus-tooltipHolder', tabindex: 0 }, null, `
    <div class="dbplus-tooltip">${tooltip}</div>
    <div class="dbplus-tooltipArrow"></div>
  `)
  ])
]);

export const controlIcons = Object.freeze({
  collection: new Map(),
  register (icon, tooltip, func) {
    if (this.collection.has(func)) this.collection.delete(func);
    this.collection.set(func, { icon, tooltip });
    if (mutationManager.listeners.has(onNewControlElement)) mutationManager.trigger(onNewControlElement);
    else mutationManager.start(controlTargetSelector, onNewControlElement)
  },
  unregister (func) {
    if (this.collection.has(func)) {
      $(`.dbplus-controlIcon`).has(`[href="#managed-icon__${this.collection.get(func).icon}"]`).remove();
      this.collection.delete(func);
    }
  }
});
const onNewControlElement = controlElements => {
  for (const controlElement of controlElements) {
    for (const [func, { icon, tooltip }] of controlIcons.collection) {
      if (!controlElement.querySelector(`[href="#managed-icon__${icon}"]`)) controlElement.prepend(newControlIcon(icon, func, tooltip));
    }
  }
}