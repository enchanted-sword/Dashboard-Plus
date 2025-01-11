'use strict';

{
  console.info('init');
  console.info(browser.storage.local.get());

  const { getURL } = browser.runtime;
  let cssMap, languageData, themeColors;

  const runContextScript = () => {
    const script = document.createElement('script');
    script.src = getURL('control/control.js');
    (document.head || document.documentElement).append(script);
    script.onload = () => script.remove();
  };
  const observer = new MutationObserver(() => {
    if (document.querySelector('[data-rh]') === null) {
      observer.disconnect();
      scriptManager();
    }
  });

  observer.observe(document.documentElement, { childList: true, subtree: true });
  runContextScript();

  const sendCachedData = async () => {
    ({ cssMap } = await browser.storage.local.get('cssMap') || '');
    ({ languageData } = await browser.storage.local.get('languageData') || '');

    window.postMessage({ text: 'db+sendCachedData', cssMap: cssMap, languageData: languageData }, 'https://www.tumblr.com');
  };

  window.addEventListener('message', (event) => {
    if (event.origin !== 'https://www.tumblr.com') return;
    if (event.data?.text === 'db+controlInitMessage') sendCachedData(); //recive control init message and respond with helper functions
    else if (event.data?.text === 'db+helperLoadMessage') { //recieve helper functions and update storage
      ({ cssMap, languageData } = event.data);

      browser.storage.local.set({ cssMap, languageData });

      window.postMessage({ text: 'db+sendCachedData', cssMap, languageData }, 'https://www.tumblr.com'); //send helper functions back to control script for alternate load case
    } else if (event.data?.text === 'db+themeColorUpdateMessage') {
      ({ themeColors } = event.data);
      browser.storage.local.set({ themeColors });
    }
  });

  const scriptManager = async () =>
    import(browser.runtime.getURL('/scripts/utility/jsTools.js')).then(({ deepEquals, importFeatures, featureify }) => {  // browser.runtime.getURL is only a valid escape when written in full
      let installedFeatures = {};
      let menuFeatures = ['inheritColors'];
      let enabledFeatures = [];
      let resizeListeners = [];
      let preferences = {};
      const preferenceListeners = {};

      const executeFeature = async name => {
        const feature = installedFeatures[name];

        try {
          if (feature.desktopOnly && !resizeListeners.includes(name)) resizeListeners.push(name);
          if (feature.css) {
            const link = Object.assign(document.createElement('link'), {
              rel: 'stylesheet',
              href: getURL(`/scripts/${name}.css`)
            });

            document.documentElement.appendChild(link);
          }
          if (feature.js) {
            const { main, clean, update } = await import(browser.runtime.getURL(`/scripts/${name}.js`)); // browser.runtime.getURL is only a valid escape when written in full

            window.requestAnimationFrame(() => main().catch(console.error));

            preferenceListeners[name] = (changes, areaName) => {
              const { preferences } = changes;
              if (areaName !== 'local' || typeof preferences === 'undefined') return;
              const newPref = preferences.newValue[name];
              const oldPref = preferences.oldValue[name];

              const changed = Object.keys(preferences.newValue).filter(key => !deepEquals(preferences?.newValue[key], preferences?.oldValue[key]));
              if ((changed.includes(name) && newPref.enabled === true)
                || feature.recieveUpdates?.some(key => changed.includes(key))) {
                if (update instanceof Function && 'options' in newPref) {
                  const diff = Object.entries(newPref.options).filter(([key, val]) => val !== oldPref.options[key]);
                  update(newPref.options, Object.fromEntries(diff));
                }
                else clean().then(main);
              }
            };

            browser.storage.onChanged.addListener(preferenceListeners[name]);
          }
        } catch (e) { console.error(`failed to execute feature ${name}`, e); }
      };
      const destroyFeature = async name => {
        const feature = installedFeatures[name];

        try {
          if (feature.css) document.querySelector(`link[href='${getURL(`/scripts/${name}.css`)}']`).remove();
          if (feature.js) {
            const { clean } = await import(browser.runtime.getURL(`/scripts/${name}.js`)); // browser.runtime.getURL is only a valid escape when written in full

            window.requestAnimationFrame(() => clean().catch(console.error));

            if (browser.storage.onChanged.hasListener(preferenceListeners[name])) browser.storage.onChanged.removeListener(preferenceListeners[name]);
            delete preferenceListeners[name];
          }

          resizeListeners = resizeListeners.filter(val => val !== name);
          enabledFeatures = enabledFeatures.filter(val => val !== name);
        } catch (e) { console.error(`failed to destroy feature ${name}`, e); }
      };

      const onStorageChanged = async (changes, areaName) => {
        const { preferences } = changes;
        if (areaName !== 'local' || typeof preferences === 'undefined') return;

        const { oldValue = {}, newValue = {} } = preferences;

        console.info(preferences);

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
      };

      const initFeatures = async () => {
        // NEED TO OPEN DATABASE HERE IF DB INTEGRATION ADDED
        installedFeatures = await importFeatures();

        ({ preferences } = await browser.storage.local.get('preferences'));

        preferences = featureify(installedFeatures, preferences);
        enabledFeatures = Object.keys(preferences).filter(key => preferences[key].enabled);
        browser.storage.local.set({ preferences });
        if (enabledFeatures.length) enabledFeatures.forEach(executeFeature);
        browser.storage.onChanged.addListener(onStorageChanged);

        browser.storage.onChanged.addListener(onStorageChanged);
        window.addEventListener('resize', onResized);

        console.info(`running ${enabledFeatures.length} of ${Object.keys(installedFeatures).length} features`)
      };

      initFeatures();

      console.info('loaded!');
      console.info(browser.storage.local.get());
    });

}
