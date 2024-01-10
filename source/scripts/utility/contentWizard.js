import { getStorage, getPreferences } from './jsTools.js';
import { style, s } from './style.js';

const widthStyle = {
  attached: false,
  element: style('')
};
const windowWidth = () => window.innerWidth;
const enabledFeatures = async () => {
  const { preferences } = await getStorage('preferences');
  const { contentWidth, contentPositioning, floatingAvatars, horizontalNavigation } = preferences;
  
  return {
    contentWidth: contentWidth.enabled,
    contentPositioning: contentPositioning.enabled,
    floatingAvatars: floatingAvatars.enabled,
    horizontalNavigation: horizontalNavigation.enabled
  };
};
const calcOffsets = async () => {
  let inner = 0, outer = 600;
  const { floatingAvatars, horizontalNavigation } = await enabledFeatures();

  if (floatingAvatars && horizontalNavigation) inner = 85;
  else if (floatingAvatars) inner = 93;
  
  if (horizontalNavigation) outer = 360;

  return { inner, outer }
};
minMax = async (min, max, key) => {
  const { bounds } = await getStorage('bounds');

  bounds[key].preferences.min = min.toString();
  bounds[key].preferences.max = max.toString();

  browser.storage.local.set({ bounds });
};

export const contentWizard = Object.freeze({
  async width (value) {
    if (value !== 'clean') {
      let min = 540, max;
      const { inner, outer } = await calcOffsets();

      max = windowWidth() - outer;
      minMax(min, max, 'contentWidth');

      if (value < min) value = min;
      if (value > max) value = max;

      widthStyle.element.innerText = `
        ${s('postColumn')} { max-width: ${value}px !important; }
        ${s('main')} { max-width: ${value + inner}px !important; }
      `;
      if (!widthStyle.attached) {
        document.head.append(widthStyle.element);
        widthStyle.attached = true;
      }
    } else {
      widthStyle.element.remove();
      widthStyle.attached = false;
    }
  },
});