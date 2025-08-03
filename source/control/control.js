window.postMessage({ text: 'db+controlInitMessage' }, 'https://www.tumblr.com');

let ___INITIAL_STATE___, cssMap, languageData, init = false;
const themeColors = {};

const waitForWindow = () => new Promise(resolve => {
  window.requestAnimationFrame(() => (typeof window.tumblr === 'undefined' || typeof window.tumblr.getCssMap === 'undefined' || typeof window.tumblr.apiFetch === 'undefined') ? waitForWindow().then(resolve) : resolve());
});

const camelCase = str => str.replace(/(?:-(\w))/g, (a, b) => b.toUpperCase());
const getThemeColor = color => {
  const value = getComputedStyle(document.getElementById('root')).getPropertyValue(`--${color}`);
  const [r, g, b, a] = value.replace(/[^\d]/g, ' ').replace(/\s{2,}/g, ' ').trim().split(' ');
  return `${r} ${g} ${b}${a ? ` / ${a}` : ''}`;
}
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
  'deprecated-accent',
  'follow'
];
const updateThemeColors = () => {
  colors.forEach(color => {
    themeColors[camelCase(color)] = getThemeColor(color)
  });

  window.postMessage({ text: 'db+themeColorUpdateMessage', themeColors }, 'https://www.tumblr.com');
}

const modifyObfuscatedFeatures = (obfuscatedFeatures, featureSet) => {
  const obf = JSON.parse(atob(obfuscatedFeatures));
  for (const x of featureSet) {
    obf[x.name] = x.value;
  }
  return btoa(JSON.stringify(obf));
};
const parseAndModifyState = () => {
  const initialStateScript = document.getElementById('___INITIAL_STATE___');
  ___INITIAL_STATE___ = JSON.parse(initialStateScript.textContent);

  (async () => { // blast from the past
    const featureSet = [{ name: 'postFooterSplitNotesCount', value: true }];
    const modifiedState = Object.assign(___INITIAL_STATE___, {
      obfuscatedFeatures: modifyObfuscatedFeatures(___INITIAL_STATE___.obfuscatedFeatures, featureSet)
    });

    initialStateScript.textContent = JSON.stringify(modifiedState);
  })(); // now that's a sneaky move
};

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
      const timelineTargetSelector = '[data-timeline-id]:not([data-route])';
      const body = (document.body || document);

      let mutateContainerLabel = true;

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
      };
      const labelTimelines = elements => {
        elements.forEach(element => {
          let route = element.getAttribute('data-timeline-id').split('/v2/').pop();
          if (route.includes('blog/') && route.split('/')[1] === window.location.pathname.split('/')[1]) route = `peepr/${route}`;
          if (mutateContainerLabel) document.getElementById('base-container').setAttribute('data-route', route);
          mutateContainerLabel = false;
          element.setAttribute('data-route', route);
        });
      };
      const label = () => {
        labelCss(document.querySelectorAll(cssTargetSelector));
        labelTitles(document.querySelectorAll(titleTargetSelector));
        labelTimelines(document.querySelectorAll(timelineTargetSelector));
      };

      label();

      const observer = new MutationObserver(label);

      observer.observe(body, {
        childList: true,
        subtree: true,
      });

      window.tumblr.on?.('navigation', () => {
        document.querySelectorAll('[data-timeline-id][data-route]').forEach(e => e.removeAttribute('data-route'));
      });
      init = true;
    } else if (!init) console.info('resources not cached, skipping first run');
  }
});

if (!document.getElementById('___INITIAL_STATE___')) {
  const newNodes = [];
  const findState = () => {
    const nodes = newNodes.splice(0);
    if (nodes.length !== 0 && (nodes.some(node => node.matches('#___INITIAL_STATE___') || node.querySelector('#___INITIAL_STATE___') !== null))) {
      parseAndModifyState();
    }
  };
  const observer = new MutationObserver(mutations => {
    const nodes = mutations
      .flatMap(({ addedNodes }) => [...addedNodes])
      .filter(node => node instanceof Element)
      .filter(node => node.isConnected);
    newNodes.push(...nodes);
    findState();
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });
} else parseAndModifyState();

waitForWindow().then(async function () {
  window.apiKey = ___INITIAL_STATE___?.apiFetchStore?.API_TOKEN;
  updateThemeColors();
  cssMap = await window.tumblr.getCssMap();
  languageData = window.tumblr.languageData;
  window.postMessage({ text: 'db+helperLoadMessage', cssMap, languageData }, 'https://www.tumblr.com');

  window.addEventListener('keydown', event => {
    if (['p', 'P'].includes(event.key) && event.shiftKey) window.setTimeout(updateThemeColors, 1000);
  });
  const colorPaletteSwitcher = document.getElementById('colorPaletteSwitcher');
  if (colorPaletteSwitcher) colorPaletteSwitcher.addEventListener('change', () => window.setTimeout(() => updateThemeColors(), 100));
});

