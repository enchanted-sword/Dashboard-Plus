import { controlIcons } from './utility/dashboardElements.js';
import { translate } from './utility/tumblr.js';
import { timelineObject } from './utility/reactProps.js'

const copyLink = async event => {
  const post = event.target.closest('[tabindex="-1"][data-id] article');
  const { shortUrl } = await timelineObject(post);
  window.navigator.clipboard.writeText(shortUrl).then(() => {
    event.target.closest('.dbplus-controlIcon').classList.add('copied') ;
  });

}

export const main = async () => controlIcons.register('copy', translate('Copy link'), copyLink);
export const clean = async () => controlIcons.unregister(copyLink);