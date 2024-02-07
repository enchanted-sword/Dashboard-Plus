'use strict';

{
  const version = 0.1;

  console.info('init');
  console.info(browser.storage.local.get());

  const { getURL } = browser.runtime;
  let cssMap, languageData, themeColors;
  let areHelpersLoaded = false;
  const isReactLoaded = () => document.querySelector('[data-rh]') === null;
  const waitForLoad = () => new Promise(resolve => {
    window.requestAnimationFrame(() => (isReactLoaded() && areHelpersLoaded) ? resolve() : waitForLoad().then(resolve));
  });
  const defer = (func, args = []) => { //runs function when the DOM, react, and the helper functions are all loaded
    if (['interactive', 'complete'].includes(document.readyState)) waitForLoad().then(() => func(...args));
    else window.addEventListener('DOMContentLoaded', () => waitForLoad().then(() => func(...args)));
  };
  const deepEquals = (x, y) => {
    const tx = typeof x, ty = typeof y;
    return x && y && tx === 'object' && tx === ty ? (
      Object.keys(x).length === Object.keys(y).length &&
      Object.keys(x).every(key => deepEquals(x[key], y[key]))
    ) : (x === y);
  };

  const script = document.createElement('script'); //run control script
  script.src = getURL('control/control.js');
  (document.head || document.documentElement).append(script);
  script.onload = () => script.remove();

  const sendCachedData = async () => {
    ({ cssMap } = await browser.storage.local.get('cssMap') || '');
    ({ languageData } = await browser.storage.local.get('languageData') || '');

    window.postMessage({ text: 'db+sendCachedData', cssMap: cssMap, languageData: languageData }, 'https://www.tumblr.com');
  };

  window.addEventListener('message', (event) => {
    if (event.origin !== 'https://www.tumblr.com') return;
    if (event.data?.text === 'db+controlInitMessage') sendCachedData(); //recive control init message and respond with helper functions
    else if (event.data?.text === 'db+helperLoadMessage') { //recieve helper functions and update storage
      areHelpersLoaded = true;
      ({ cssMap, languageData } = event.data);

      browser.storage.local.set({ cssMap, languageData });

      window.postMessage({ text: 'db+sendCachedData', cssMap, languageData }, 'https://www.tumblr.com'); //send helper functions back to control script for alternate load case
    } else if (event.data?.text === 'db+themeColorUpdateMessage') {
      ({ themeColors } = event.data);
      browser.storage.local.set({ themeColors });
    }
  });

  const getJsonFile = async name => {
    const url = getURL(`/scripts/${name}.json`);
    const file = await fetch(url);
    const json = await file.json();

    return json;
  };

  let installedFeatures = [];
  let enabledFeatures = [];
  const preferenceListeners = {};
  const resizeListeners = [];
  
  const executeFeature = async name => {
    const data = await getJsonFile(name);

    try {
      if (data.desktopOnly && !resizeListeners.includes(name)) resizeListeners.push(name);
      if (data.css) {
        const link = Object.assign(document.createElement('link'), {
          rel: 'stylesheet',
          href: getURL(`/scripts/${name}.css`)
        });
  
        if (data.css === 'fast') document.documentElement.appendChild(link);
        else defer(() => document.documentElement.appendChild(link));
      }
      if (data.js) defer(async () => {
        const scriptPath = getURL(`/scripts/${name}.js`);
        const { main, clean, update } = await import(scriptPath);
  
        main().catch(console.error);
  
        preferenceListeners[name] = (changes, areaName) => {
          const { preferences } = changes;
          if (areaName !== 'local' || typeof preferences === 'undefined') return;
    
          const changed = Object.keys(preferences.newValue).filter(key => !deepEquals(preferences?.newValue[key], preferences?.oldValue[key]));
          if ((changed.includes(name) && preferences?.newValue[name].enabled === true) 
            || data.recieveUpdates?.some(key => changed.includes(key))) {
            if (update instanceof Function) update(preferences.newValue[name]);
            else clean().then(main);
          }
        };

        browser.storage.onChanged.addListener(preferenceListeners[name]);
      });
    } catch (e) { console.error(`failed to execute feature ${name}`, e); }
  };
  const destroyFeature = async name => {
    const data = await getJsonFile(name);

    try {
      if (data.css) document.querySelector(`link[href='${getURL(`/scripts/${name}.css`)}']`).remove();
      if (data.js) defer(async () => {
        const scriptPath = getURL(`/scripts/${name}.js`);
        const { clean } = await import(scriptPath);

        clean().catch(console.error);

        if (browser.storage.onChanged.hasListener(preferenceListeners[name])) browser.storage.onChanged.removeListener(preferenceListeners[name]);
        delete preferenceListeners[name];
      });

      enabledFeatures = enabledFeatures.filter(val => val !== name);
    } catch (e) { console.error(`failed to destroy feature ${name}`, e); }
  };

  const onStorageChanged = async (changes, areaName) => {
    const { preferences } = changes;
    if (areaName !== 'local' || typeof preferences === 'undefined') return;

    console.info(changes);

    const { oldValue = {}, newValue = {} } = preferences;

    const newlyEnabled = Object.keys(newValue).filter(feature => !oldValue[feature]?.enabled && newValue[feature]?.enabled);
    const newlyDisabled = Object.keys(oldValue).filter(feature => oldValue[feature]?.enabled && !newValue[feature]?.enabled);

    newlyEnabled.forEach(executeFeature);
    enabledFeatures.push(newlyEnabled);
    newlyDisabled.forEach(destroyFeature);
  };
  const onResized = () => {
    if (window.innerWidth < 990) {
      resizeListeners.forEach(feature => {
        if (enabledFeatures.includes(feature)) destroyFeature(feature);
      });
    } else resizeListeners.forEach(feature => {
      if (!enabledFeatures.includes(feature)) {
        enabledFeatures.push(feature);
        executeFeature(feature);
      }
    });
  }

  const initFeatures = async () => {
    installedFeatures = await getJsonFile('!features');

    let { preferences } = await browser.storage.local.get('preferences');

    if (typeof preferences === 'undefined') preferences = await getJsonFile('!preferences');

    installedFeatures.forEach(async feature => {
      if (!preferences[feature]) {
        const localPreferences = await getJsonFile('!preferences');
        preferences[feature] = localPreferences[feature];
      }
    });
    Object.keys(preferences).forEach(key => { if (!installedFeatures.includes(key)) delete preferences[key]; });

    enabledFeatures = Object.keys(preferences).filter(key => preferences[key].enabled);

    browser.storage.local.set({ preferences });
    if (enabledFeatures.length) enabledFeatures.forEach(executeFeature);
    browser.storage.onChanged.addListener(onStorageChanged);
    window.addEventListener('resize', onResized);

    console.info(`running ${enabledFeatures.length} of ${installedFeatures.length} features`)
  };

  initFeatures();

  defer(() => {
    console.info('loaded!');
    console.info(browser.storage.local.get());
  });
}
