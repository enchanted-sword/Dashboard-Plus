import { mutationManager, postFunction } from './utility/mutations.js';
import { elem, getPreferences } from './utility/jsTools.js';
import { primaryBlogName } from './utility/user.js';
import { translate } from './utility/tumblr.js';
import { s, style } from './utility/style.js';
import { addUrlPopover } from './utility/dashboardElements.js';

let scroll, showOwnAvatar, editorAvatar;
const staticStyleElement = style(`.dbplus-stickyContainer > ${s('avatar')} { position: static !important; }`);
const editorStyleElement = style(`
  #glass-container ${s('menuContainer')} {
    border-bottom: none !important;

    ${s('avatarWrapper')} {
      position: absolute;
      top: -6px;
      left: -100px;
    }
    ${s('avatar')} {
      &, img {
        width: 64px !important;
        height: 64px !important;
      }
    }
    ${s('selectedBlogName hasAvatar')} { margin-left: 0 !important; }
  }
`);
const customClass = 'dbplus-floatingAvatars';
const postSelector = `${s('main')} > :not(${s('blogTimeline')}) [data-timeline]:not([data-timeline*='posts/'],${s('masonry')}) [tabindex='-1']:not([data-css*='masonryTimelineObject']) article:not(.${customClass})`;
const menuContainerSelector = `#glass-container ${s('menuContainer')}`;
const userAvatar = elem('div', { class: 'dbplus-userAvatarWrapper'}, null, `
  <div class="dbplus-avatarWrapperOuter">
    <div class="dbplus-avatarWrapper" role="figure" aria-label="${translate("avatar")}">
      <span class="dbplus-targetWrapper">
        <a href="https://${primaryBlogName}.tumblr.com/" title="${primaryBlogName}" rel="noopener" role="link" class="dbplus-blogLink" tabindex="0">
          <div class="dbplus-avatarInner" style="width: 64px; height: 64px;">
            <div class="dbplus-avatarWrapperInner">
              <div class="dbplus-placeholder" style="padding-bottom: 100%;">
                <img
                class="dbplus-avatarImage"
                srcset="https://api.tumblr.com/v2/blog/${primaryBlogName}/avatar/64 64w,
                        https://api.tumblr.com/v2/blog/${primaryBlogName}/avatar/96 96w,
                        https://api.tumblr.com/v2/blog/${primaryBlogName}/avatar/128 128w,
                        https://api.tumblr.com/v2/blog/${primaryBlogName}/avatar/512 512w"
                sizes="64px" 
                alt="${translate("Avatar")}" 
                style="width: 64px; height: 64px;" 
                loading="eager">
              </div>
            </div>
          </div>
        </a>
      </span>
    </div>
  </div> 
`);
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
    const stickyContainer = elem('div', { class: 'dbplus-stickyContainer' })

    post.prepend(stickyContainer);
    stickyContainer.append(avatar);
    avatar.querySelector(`${s('targetWrapper')} img`).sizes = '64px';
    avatar.querySelectorAll(`${s('subAvatarTargetWrapper')} img`).forEach(img => img.sizes = '32px');
    post.classList.add(customClass);
  }
};
const addFloatingEditorPortrait = editors => {
  for (const editor of editors) {
    const avatar = editor.querySelector(`${s('avatarWrapper')} img`);
    avatar.sizes = '64px';
    console.info('64');
  }
};

export const main = async () => {
  if (window.innerWidth < 990) return;
  
  ({ scroll, showOwnAvatar } = await getPreferences('floatingAvatars'));
  postFunction.start(addScrollingAvatars, postSelector);

  if (!scroll) document.head.append(staticStyleElement);
  if (editorAvatar) {
    mutationManager.start(menuContainerSelector, addFloatingEditorPortrait);
    document.head.append(editorStyleElement);
  }
  if (showOwnAvatar) addUserPortrait();
}

export const clean = async () => {
  postFunction.stop(addScrollingAvatars);
  mutationManager.stop(addFloatingEditorPortrait);

  $(`.dbplus-stickyContainer > ${s('avatar')} ${s('targetWrapper')} img`).each(function() {this.sizes = "32px"});
  $(`.dbplus-stickyContainer > ${s('avatar')} ${s('subAvatarTargetWrapper')} img`).each(function() {this.sizes = "16px"});
  $(`.${customClass}`).removeClass(customClass);
  $('.dbplus-userAvatarWrapper').remove()
  document.querySelectorAll(`.dbplus-stickyContainer > ${s('avatar')}`).forEach(avatar => avatar.closest('article').querySelector('header').prepend(avatar));
  $('.dbplus-stickyContainer').remove();
  staticStyleElement.remove();
  editorStyleElement.remove()
}

export const update = async ({ preferences }) => {
  ({ scroll, showOwnAvatar, editorAvatar } = preferences);

  if (!scroll) document.head.append(staticStyleElement);
  else staticStyleElement.remove();

  if (editorAvatar) {
    mutationManager.start(menuContainerSelector, addFloatingEditorPortrait);
    document.head.append(editorStyleElement);
  } else {
    mutationManager.stop(addFloatingEditorPortrait);
    editorStyleElement.remove();
  }
  if (showOwnAvatar) addUserPortrait();
  else $('.dbplus-userAvatarWrapper').remove();
};