import { getOptions } from './utility/jsTools.js';
import { style, s } from './utility/style.js';

const styleElement = style('');

const run = ({ width, justify }) => {
  styleElement.innerText = `
    @media (min-width: 990px) {
      :is(${s('main')}:not(:has(${s('masonry')})), :is(${s('postColumn')},${s('postsColumn')}):not(:has(${s('masonry')})))
        { max-width: ${width}px !important; }
      #base-container[data-navigation="horizontal"]:not(:has(${s('masonry')})) {
        ${s('mainContentWrapper')} { width: 100%; }
        ${s('mainContentWrapper')} > ${s('container')} { justify-content: ${justify}; }
      }
      #base-container:not([data-navigation="horizontal"]):not(:has(${s('masonry')})) {
        ${s('mainContentWrapper')} { width: ${width + 370}px; }
        ${s('bluespaceLayout')} > div { justify-content: ${justify}; }
      }
    }
  `;

};

export const main = async () => {
  const preferences = await getOptions('contentWizard');
  run(preferences);

  document.body.append(styleElement);
};

export const clean = async () => styleElement?.remove();

export const update = async preferences => run(preferences);