import { elem } from './jsTools.js';
import { apiFetch, navigate, translate, replaceTranslate, keyToString } from './tumblr.js';
import { hexToRgbString } from './color.js';
import { formatTextBlock } from './npfTools.js';
import { mutationManager } from './mutations.js';
import { s, style } from './style.js';
import { noact } from './noact.js';

export const svgIconString = (icon, h, w, className = '', primary = 'rgba(var(--black),.65)') => `<svg class='${className}' xmlns='http://www.w3.org/2000/svg' height='${h}' width='${w}' role='presentation' style='--icon-color-primary: ${primary};'><use href='#managed-icon__${icon}'></use></svg>`;
export const svgIcon = (icon, h, w, className = '', primary = 'rgba(var(--black),.65)') => $(svgIconString(icon, h, w, className, primary))[0];

const k = str => str.split(' ').map(key => `dbplus-customPopover-${key}`).join(' ');
const urlInfoLink = url => `/v2/url_info?url=${url}&fields[blogs]=avatar,name,title,url,blog_view_url,description_npf,theme,uuid`;
const fetchedUrlInfo = async url => await apiFetch(url).catch((error) => {
  console.error(error);
  return { response: {} };
});
const blogViewRegex = /https:\/\/[\w\d.-]+\/post\/([\d]*)/;
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

  if (!blog) return;

  const popover = noact({
    className: k('baseContainer'),
    id: `dbplus-customPopover-${url.replaceAll('/', '')}`,
    tabindex: 0,
    role: 'group',
    children: {
      className: k('popoverHolder'),
      style: `position: absolute; inset: 0px auto auto 0px; width: 280px; max-height: 370px; transform: translate(${xPos - 140}px, ${yPos + 10}px);`,
      onmouseenter: setPopoverHoverFlag,
      onmouseleave: popoverSelfRemove,
      children: {
        className: k('blogCard'),
        style: `
          --blog-title-color: ${blog.theme.titleColor};
          --blog-link-color: ${blog.theme.linkColor};
          --blog-background-color: ${blog.theme.backgroundColor};
          --blog-title-color-15: rgba(${hexToRgbString(blog.theme.titleColor)}, 0.15);
          --blog-link-color-15: rgba(${hexToRgbString(blog.theme.linkColor)}, 0.15);
          `,
        children: [
          {
            className: k('blogHeader'),
            children: [
              blog.theme.showHeaderImage ? {
                className: k('headerImage small stretched blogLink'),
                target: '_blank',
                rel: 'noopener',
                href: `/${blog.name}`,
                role: 'link',
                tabindex: 0,
                onclick: blogViewNavigate,
                children: {
                  className: k('image'),
                  src: blog.theme.headerImageFocused,
                  alt: blog.title,
                  loading: 'lazy'
                }
              } : null,
              {
                className: k(`bottomHalf smallBottom ${blog.theme.showAvatar ? 'withAvatar' : ''} ${blog.theme.showHeaderImage ? 'withStretchedHeaderImage' : 'withoutHeader'} ${(
                  !(blog.theme.showTitle || blog.theme.showDescription)
                  && !blog.theme.showHeaderImage && blog.theme.showAvatar) ? 'empty' : ''
                  }`),
                children: [
                  {
                    className: k('headerBar'),
                    children: {
                      className: k(`headerContainer ${blog.theme.showHeaderImage ? 'withStretchedHeaderImage' : ''} blogCardHeaderBar`),
                      children: {
                        className: k(`headerBar ${blog.theme.showHeaderImage ? 'withStretchedHeaderImage' : ''} blogCardHeaderBar`),
                        'aria-label': replaceTranslate(`%1$s's blog header`, blog.name),
                        role: 'banner',
                        children: {
                          className: k('blogLinkRecommendationWrapper'),
                          children: {
                            className: k('blogLinkWrapper blogCardBlogLink'),
                            children: {
                              className: k('blogLink'),
                              style: 'color: rgb(255, 255, 255);',
                              target: '_blank',
                              rel: 'noopener',
                              href: blog.url,
                              role: 'link',
                              tabindex: 0,
                              children: {
                                className: k('blogLinkShort'),
                                children: blog.name
                              }
                            }
                          }
                        }
                      }
                    }
                  },
                  {
                    className: k('avatarBlock blogLink'),
                    target: '_blank',
                    rel: 'noopener',
                    href: `/${blog.name}`,
                    role: 'link',
                    tabindex: 0,
                    onclick: blogViewNavigate,
                    children: {
                      className: k('avatarPositioner smallAvatarPositioner atopHeaderImage'),
                      children: {
                        className: k(`avatarWrapper animateAvatar smallAvatar ${blog.theme.avatarShape}`),
                        children: {
                          className: k('avatarWrapper'),
                          role: 'figure',
                          ariaLabel: translate('avatar'),
                          children: {
                            className: k('avatar'),
                            style: 'width:64px;height:64px',
                            children: {
                              className: k(`avatarWrapperInner ${blog.theme.avatarShape}`),
                              children: {
                                className: k('placeholder'),
                                style: 'padding-bottom:100%;',
                                children: {
                                  className: k('image visible'),
                                  srcset: `${blog.avatar[3].url} 64w, ${blog.avatar[2].url} 96w, ${blog.avatar[1].url} 128w, ${blog.avatar[0].url} 512w`,
                                  sizes: '64px',
                                  alt: translate('Avatar'),
                                  style: 'width:64px;height:64px',
                                  loading: 'eager'
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  },
                  blog.theme.showTitle || blog.theme.showDescription ? {
                    className: k('textContainer'),
                    children: [
                      blog.theme.showTitle ? {
                        tag: 'h1',
                        className: k('title'),
                        style: `font-family: "${blog.theme.titleFont}"; font-weight: bold; color: var(--blog-title-color);`,
                        children: blog.title
                      } : null,
                      blog.theme.showDescription ? {
                        className: k('description'),
                        children: {
                          className: k('description small gradient'),
                          innerHtml: HTMLDescription(blog.descriptionNpf)
                        }
                      } : null
                    ]
                  } : null
                ]
              }
            ]
          },
          posts.length ? {
            className: k('posts'),
            children: posts.map(post => {
              let postElement;

              switch (post.objectData.displayStyle) {
                case 'regular':
                  postElement = {
                    className: k('text'),
                    children: {
                      className: k('textBlock textBlockMicro'),
                      children: post.objectData.body
                    }
                  };
                  break;
                case 'photo':
                  postElement = {
                    tag: 'figure',
                    className: k('image'),
                    children: {
                      className: k('placeholder foreground'),
                      style: 'padding-bottom:100%;',
                      srcset: `${post.objectData.backgroundImage} 100w`,
                      sizes: '80px',
                      alt: translate('Image'),
                      loading: 'lazy'
                    }
                  };
                  break;
                case 'video':
                  postElement = {
                    className: k('video'),
                    children: [
                      {
                        className: k('placeholder foreground'),
                        children: {
                          className: k('image visible blankBackground'),
                          srcset: `${post.objectData.backgroundImage} 100w`,
                          sizes: '80px',
                          alt: translate('Image'),
                          loading: 'lazy'
                        }
                      },
                      {
                        className: k('playButton'),
                        children: svgIcon('play-circle', 46, 46)
                      }
                    ]
                  };
                  break;
                case 'audio':
                  postElement = noact({
                    className: k('audio'),
                    children: [
                      {
                        className: k('placeholder foreground'),
                        children: {
                          className: k('image visible blankBackground'),
                          srcset: `${post.objectData.backgroundImage} 100w`,
                          sizes: '80px',
                          alt: translate('Image'),
                          loading: 'lazy'
                        }
                      },
                      {
                        className: k('audioPlayButton'),
                        children: svgIcon('play', 46, 46)
                      }
                    ]
                  });
                  break;
              }

              return {
                className: k('chicletHolder blogLink'),
                blogname: blog.name,
                href: post.links.tap.href,
                target: '_blank',
                rel: 'noopener',
                tabindex: 0,
                onclick: blogViewNavigate,
                children: postElement
              };
            })
          } : null
        ]
      }
    }
  });

  return popover;
};

/**
 * Adds blog popovers to blog links
 * @param {Element} anchor - Tumblr blog URL to attach a blog popover to 
 */
export const addUrlPopover = async anchor => {
  if (!anchor) return;

  anchor.addEventListener('mouseenter', displayPopover);
  anchor.addEventListener('mouseleave', removePopover);
}

const controlTargetSelector = `[tabindex="-1"][data-id] article :is(${s('footerRow')}:has(${s('noteCount')}) ${s('controls')},${s('footerContent')})`;
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
  advancedCollection: new Map(),

  /**
   * Register a new control icon in post footers
   * @param {string} icon - Name of managed icon SVG to display
   * @param {string} tooltip - Tooltip displayed on hovering over the icon
   * @param {Function} func - Function to run when the icon is clicked
   */
  register(icon, tooltip, func) {
    if (this.collection.has(func)) this.collection.delete(func);
    this.collection.set(func, { icon, tooltip });
    if (mutationManager.listeners.has(onNewControlElement)) mutationManager.trigger(onNewControlElement);
    else mutationManager.start(controlTargetSelector, onNewControlElement)
  },
  registerAdvanced(noactIcon, className) {
    if (this.advancedCollection.has(className)) this.collection.delete(className);
    this.advancedCollection.set(className, noactIcon);
    if (mutationManager.listeners.has(onNewControlElement)) mutationManager.trigger(onNewControlElement);
    else mutationManager.start(controlTargetSelector, onNewControlElement)
  },

  /**
   * Removes a custom control icon
   * @param {Function} func - function associated with icon to be removed
   */
  unregister(func) {
    if (this.collection.has(func)) {
      $(`.dbplus-controlIcon`).has(`[href="#managed-icon__${this.collection.get(func).icon}"]`).remove();
      this.collection.delete(func);
    }
  }
});
const onNewControlElement = controlElements => {
  for (const controlElement of controlElements) {
    const insert = controlElement.matches(s('footerContent'));
    for (const [func, { icon, tooltip }] of controlIcons.collection) {
      if (!controlElement.querySelector(`[href="#managed-icon__${icon}"]`)) insert
        ? controlElement.append(newControlIcon(icon, func, tooltip))
        : controlElement.prepend(newControlIcon(icon, func, tooltip));
    }
    for (const [className, noactIcon] of controlIcons.advancedCollection) {
      if (!controlElement.querySelector(className)) insert
        ? controlElement.append(noact(noactIcon))
        : controlElement.prepend(noact(noactIcon));
    }
  }
}