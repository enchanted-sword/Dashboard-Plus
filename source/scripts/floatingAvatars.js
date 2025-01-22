import { postFunction } from './utility/mutations.js';
import { getOptions } from './utility/jsTools.js';
import { noact } from './utility/noact.js';
import { primaryBlogName } from './utility/user.js';
import { translate } from './utility/tumblr.js';
import { s, style } from './utility/style.js';
import { addUrlPopover } from './utility/dashboardElements.js';

let scroll, showOwnAvatar;
const staticStyleElement = style(`.dbplus-stickyContainer > ${s('avatar')} { position: static !important; }`);
const customClass = 'dbplus-floatingAvatars';
const postSelector = `${s('main')} > :not(${s('blogTimeline')}) [data-timeline-id]:not([data-timeline-id*='posts/'],${s('masonry')}) [tabindex='-1']:not([data-css*='masonryTimelineObject']) article:not(.${customClass})`;
const userAvatar = noact({
  className: 'dbplus-avatarWrapperOuter',
  children: {
    className: 'dbplus-avatarWrapper',
    role: 'figure',
    ariaLabel: translate('avatar'),
    children: {
      tag: 'span',
      className: 'dbplus-targetWrapper',
      children: {
        href: `https://${primaryBlogName}.tumblr.com/`,
        title: primaryBlogName,
        rel: 'noopener',
        children: {
          className: 'dbplus-avatarInner',
          children: {
            className: 'dbplus-avatarWrapperInner',
            children: {
              className: 'dbplus-placeholder',
              children: {
                class: 'dbplus-avatarImage',
                srcset: `https://api.tumblr.com/v2/blog/${primaryBlogName}/avatar/64 64w,
                        https://api.tumblr.com/v2/blog/${primaryBlogName}/avatar/96 96w,
                        https://api.tumblr.com/v2/blog/${primaryBlogName}/avatar/128 128w,
                        https://api.tumblr.com/v2/blog/${primaryBlogName}/avatar/512 512w`,
                sizes: '64px',
                alt: translate('Avatar'),
                loading: 'eager'
              }
            }
          }
        }
      }
    }
  }
});
const addUserPortrait = () => {
  const bar = $(`${s('postColumn')} > ${s('bar')}`);
  if (bar) {
    bar.prepend(userAvatar);
    addUrlPopover(userAvatar.querySelector('a'));
  }
};
const addScrollingAvatars = posts => {
  for (const post of posts) {
    const avatar = post.querySelector(`header > ${s('avatar')}`);
    const stickyContainer = noact({ className: 'dbplus-stickyContainer' });

    post.prepend(stickyContainer);
    stickyContainer.append(avatar);
    avatar.querySelector(`${s('targetWrapper')} img`).sizes = '64px';
    avatar.querySelectorAll(`${s('subAvatarTargetWrapper')} img`).forEach(img => img.sizes = '32px');
    post.classList.add(customClass);
  }
};

export const main = async () => {
  if (window.innerWidth < 990) return;

  ({ scroll, showOwnAvatar } = await getOptions('floatingAvatars'));
  postFunction.start(addScrollingAvatars, postSelector);

  if (!scroll) document.head.append(staticStyleElement);
  if (showOwnAvatar) addUserPortrait();
}

export const clean = async () => {
  postFunction.stop(addScrollingAvatars);

  $(`.dbplus-stickyContainer > ${s('avatar')} ${s('targetWrapper')} img`).each(function () { this.sizes = "32px" });
  $(`.dbplus-stickyContainer > ${s('avatar')} ${s('subAvatarTargetWrapper')} img`).each(function () { this.sizes = "16px" });
  $(`.${customClass}`).removeClass(customClass);
  $('.dbplus-userAvatarWrapper').remove()
  document.querySelectorAll(`.dbplus-stickyContainer > ${s('avatar')}`).forEach(avatar => avatar.closest('article').querySelector('header').prepend(avatar));
  $('.dbplus-stickyContainer').remove();
  staticStyleElement.remove();
}

export const update = async preferences => {
  ({ scroll, showOwnAvatar } = preferences);

  if (!scroll) document.head.append(staticStyleElement);
  else staticStyleElement.remove();
  if (showOwnAvatar) addUserPortrait();
  else $('.dbplus-userAvatarWrapper').remove();
};