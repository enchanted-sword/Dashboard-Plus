import { getOptions } from './utility/jsTools.js';
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

export const main = async () => {
  const { displayStyle } = await getOptions('dashboardCarousel');
  if (displayStyle === 'show') styleElement.remove();
  else {
    styleElement.innerText = styles[displayStyle];
    document.head.append(styleElement);
  }
};

export const clean = async () => styleElement.remove();