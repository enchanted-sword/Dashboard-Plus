window.postMessage({ text: 'db+controlInitMessage' }, 'https://www.tumblr.com');

let cssMap, languageData, init = false;
const themeColors = {};

const waitForWindow = () => new Promise(resolve => {
  window.requestAnimationFrame(() => (typeof window.tumblr === 'undefined' || typeof window.tumblr.getCssMap === 'undefined' || typeof window.tumblr.apiFetch === 'undefined') ? waitForWindow().then(resolve) : resolve());
});

const camelCase = str => str.replace(/(?:-(\w))/g, (a, b) => b.toUpperCase())
const getThemeColor = color => getComputedStyle(document.getElementById('root')).getPropertyValue(`--${color}`);
const colors = [
  'black',
  'white',
  'white-on-dark',
  'navy',
  'red',
  'orange',
  'yellow',
  'green',
  'blue',
  'purple',
  'pink',
  'accent',
  'secondary-accent',
  'follow'
];
const updateThemeColors = () => {
  colors.forEach(color => {
    themeColors[camelCase(color)] = getThemeColor(color)
  });
  window.postMessage({ text: 'db+themeColorUpdateMessage', themeColors }, 'https://www.tumblr.com');
}

window.addEventListener('message', (event) => {
  if (event.origin !== 'https://www.tumblr.com') return;
  if (event.data?.text === 'db+sendCachedData') {
    console.info('data fetched!');
    ({ cssMap, languageData } = event.data);

    if (cssMap && languageData && !init) {
      const reverseCssMap = {};
      const reverseTranslations = {};
      for (const [key, values] of Object.entries(cssMap)) {
        for (const value of values) {
          reverseCssMap[value] = key;
        }
      }
      for (const [key, value] of Object.entries(languageData.translations)) {
        reverseTranslations[value] = key;
      }

      const cssTargetSelector = '[class]:not([data-css])';
      const titleTargetSelector = '[title]:not([data-title])';
      const timelineTargetSelector = '[data-timeline]:not([data-route])';
      const body = (document.body || document);

      const labelCss = elements => {
        elements.forEach(element => {
          const classes = [];
          for (const css of element.classList.values()) {
            const mappedCss = reverseCssMap[css];
            if (mappedCss && mappedCss !== 'loader') classes.push(mappedCss);
          }
          if (classes.length > 0) element.dataset.css = classes.join(' ');
        });
      };
      const labelTitles = elements => {
        elements.forEach(element => {
          const title = reverseTranslations[element.title] || element.title;
          element.dataset.title = title;
        });
      }
      const labelTimelines = elements => {
        elements.forEach(element => {
          let route = element.getAttribute('data-timeline').split('/v2/')[1];
          if (route.includes('blog/') && route.split('/')[1] === window.location.pathname.split('/')[1]) route = `peepr/${route}`;
          document.getElementById('base-container').setAttribute('data-route', route);
          element.setAttribute('data-route', route);
        });
      }
      const label = () => {
        labelCss(document.querySelectorAll(cssTargetSelector));
        labelTitles(document.querySelectorAll(titleTargetSelector));
        labelTimelines(document.querySelectorAll(timelineTargetSelector))
      };

      label();

      const observer = new MutationObserver(label);

      observer.observe(body, {
        childList: true,
        subtree: true,
      });

      const updateRoute = mutations => {
        const elements = mutations.flatMap(({ target }) => target);
        labelTimelines(elements);
      }
      const attributeObserver = new MutationObserver(updateRoute);

      attributeObserver.observe(body, {
        attributes: true,
        attributeFilter: ['data-timeline'],
        subtree: true
      })
      init = true;
    } else if (!init) console.info('resources not cached, skipping first run');
  }
});

waitForWindow().then(async function () {
  updateThemeColors();
  cssMap = await window.tumblr.getCssMap();
  languageData = window.tumblr.languageData;
  window.postMessage({ text: 'db+helperLoadMessage', cssMap, languageData }, 'https://www.tumblr.com');

  window.addEventListener('keydown', event => { if (['p','P'].includes(event.key) && event.shiftKey) updateThemeColors(); });
  const colorPaletteSwitcher = document.getElementById('colorPaletteSwitcher');
  if (colorPaletteSwitcher) colorPaletteSwitcher.addEventListener('change', () => window.setTimeout(() => updateThemeColors(), 100));
});

