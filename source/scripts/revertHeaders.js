import { noact } from './utility/noact.js';
import { postFunction } from './utility/mutations.js';
import { timelineObject } from './utility/reactProps.js';
import { s, style } from './utility/style.js';
import { keyToClasses, translate } from './utility/tumblr.js';
import { addUrlPopover, svgIcon } from './utility/dashboardElements.js';

const customClass = 'dbplus-revertHeaders'
const postSelector = `[data-timeline-id]:not([data-route="user/inbox"]) [data-id] article:not(.${customClass})`;
const reblogIcon = () => noact({
  tag: 'span',
  className: 'dbplus-reblogIcon',
  children: svgIcon('reblog-compact', 15, 15)
});
const styleElement = style(`
  ${s('attribution')} ${s('targetWrapperInline')} + ${s('badgeContainer')} { margin-left: 5px; }
  .dbplus-reblogIcon {
    height: 14px;
    display: inline-block;
    transform: translateY(3px);
    margin: 0 5px;
  }
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

    [...attribution.childNodes].filter(node => node.nodeName === '#text').forEach(function (node) { node.textContent = '' });
    if (addingNewRebloggedFrom) attribution.append(rebloggedFrom);
    if (rebloggedFrom && !header.querySelector('dbplus-reblogIcon')) rebloggedFrom.before(reblogIcon());

    post.classList.add(customClass);
  }
};

export const main = async () => {
  postFunction.start(revertHeaders, postSelector);
  document.head.append(styleElement)
}

export const clean = async () => {
  postFunction.stop(revertHeaders);

  $('.dbplus-rebloggedFrom').remove();
  $('.dbplus-reblogIcon').replaceWith(` ${translate('reblogged')} `);
  $(`.${customClass}`).removeClass(customClass);
  styleElement.remove();
}