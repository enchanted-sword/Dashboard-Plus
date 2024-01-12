import { elem } from './utility/jsTools.js';
import { mutationManager } from './utility/mutations.js';
import { timelineObject } from './utility/reactProps.js';
import { s } from './utility/style.js';
import { keyToClasses, translate } from './utility/tumblr.js';
import { addUrlPopover } from './utility/dashboardElements.js';

const customClass = 'dbplus-revertHeaders'
const postSelector = `[data-timeline]:not([data-route="user/inbox"]) [data-id] article:not(.${customClass})`;
const reblogIcon = () => elem('span', { class: 'dbplus-reblogIcon' }, null, `
  <svg xmlns="http://www.w3.org/2000/svg" height="15" width="15" role="presentation" style="--icon-color-primary: rgba(var(--black), 0.65);">
    <use href="#managed-icon__reblog-compact"></use>
  </svg>
`);

const revertHeaders = async posts => {
  for (const post of posts) {
    const { parentPostUrl } = await timelineObject(post);
    const header = post.querySelector('header');
    const attribution = header.querySelector(s('attribution'));
    let rebloggedFrom = attribution.querySelector(s('rebloggedFromName'));
    let addingNewRebloggedFrom = false;
    let rebloggedFromName;

    if (parentPostUrl) rebloggedFromName = parentPostUrl.split('/')[3];
    if (!rebloggedFrom && rebloggedFromName) {
      const labels = post.querySelectorAll(`:scope ${s('username')} ${s('label')}`);

      if (labels.length !== 0) {
        addingNewRebloggedFrom = true;
        const classes = keyToClasses('rebloggedFromName');
        rebloggedFrom = [...labels].find(node => node.querySelector(s('attribution')).innerText === rebloggedFromName).cloneNode(true);
        addUrlPopover(rebloggedFrom.querySelector('a'));
        const follow = rebloggedFrom.querySelector(s('followButton'));

        classes.push('dbplus-rebloggedFrom');
        rebloggedFrom.classList.add(...classes);
        $(rebloggedFrom.querySelector(s('attribution'))).css({ color: 'rgba(var(--black),.65)' });
        if (follow) $(follow).hide();
      }
    }

    attribution.normalize();
    [...attribution.childNodes].filter(node => node.nodeName === '#text').forEach(node => node.remove());
    if (addingNewRebloggedFrom) attribution.append(rebloggedFrom);
    if (rebloggedFrom && !header.querySelector('dbplus-reblogIcon')) rebloggedFrom.before(reblogIcon());

    post.classList.add(customClass);
  }
};

export const main = async () => mutationManager.start(postSelector, revertHeaders);

export const clean = async () => {
  mutationManager.stop(revertHeaders);

  $('.dbplus-rebloggedFrom').remove();
  $('.dbplus-reblogIcon').replaceWith(` ${translate('reblogged')} `);
  $(`.${customClass}`).removeClass(customClass);
}