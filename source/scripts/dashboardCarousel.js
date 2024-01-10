import { getPreferences } from './utility/jsTools.js';
import { style, s } from './utility/style.js';

const styleElement = style('');
const styles = {
  caughtUp: `
    [data-cell-id*='timelineObject:title']:has(+ [data-cell-id*='watermark_carousel']) ${s('titleArea')} {
      position: relative;
      text-indent: -9999px;
    }
    [data-cell-id*='timelineObject:title']:has(+ [data-cell-id*='watermark_carousel']) ${s('titleArea')}:before {
      position: absolute;
      top: 0;
      left: 0;
      content: "Caught up!";
      text-indent: 0;
    }
    [data-cell-id*='watermark_carousel'] > ${s('listTimelineObject')} { display: none; }
  `,
  divider: `
    [data-cell-id*='timelineObject:title']:has(+ [data-cell-id*='watermark_carousel']) ${s('listTimelineObject')} { display: none; }
    [data-cell-id*='watermark_carousel'] > ${s('listTimelineObject')} {
      height: 0px;
      overflow-y: hidden;
      border: 4px solid rgb(var(--white));
      border-radius: 3px;
    }
  `,
  hide: `
    [data-cell-id*='timelineObject:title']:has(+ [data-cell-id*='watermark_carousel']) ${s('listTimelineObject')} { display: none; }
    [data-cell-id*='watermark_carousel'] > ${s('listTimelineObject')} { display: none; }
  `
};

const run = ({ selected }) => {
  if (selected === 'show') return false;

  styleElement.innerText = styles[selected];
  return true;
};

export const main = async () => {
  if (run(await getPreferences('dashboardCarousel'))) document.head.append(styleElement);
};

export const clean = async () => styleElement.remove();

export const update = ({ preferences }) => run(preferences);