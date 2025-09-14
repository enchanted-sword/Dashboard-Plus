'use strict';

{
  console.info('init');

  const { getURL } = browser.runtime;
  const urlPrefix = getURL('');
  let cssMap, languageData, themeColors;

  const preloadStyles = async () => {
    const t0 = Date.now();
    const { extensionStyles } = await browser.storage.local.get('extensionStyles');

    const style = Object.assign(document.createElement('style'), {
      id: 'dbplus-extensionStyles',
      textContent: extensionStyles
    });

    document.documentElement.append(style);
    console.info(`preloaded stylesheets in ${Date.now() - t0}ms`);
  };
  preloadStyles();

  const cacheExtensionStyles = () => {
    const extensionStyles = Array.from(document.styleSheets)
      ?.filter(sheet => sheet.ownerNode?.matches('.dbplus-style') || sheet.href?.includes(urlPrefix))
      .flatMap(sheet => {
        try {
          return Array.from(sheet.cssRules)
        } catch (e) {
          console.error(e, sheet);
          return void 0;
        }
      })
      .filter(rule => !!rule)
      .map(rule => rule.cssText)
      .join('\n');

    browser.storage.local.set({ extensionStyles });
  };
  const styleObserver = new MutationObserver(mutations => {
    const changedNodes = mutations
      .flatMap(({ addedNodes, removedNodes }) => [...addedNodes, ...removedNodes])
      .filter(node => node instanceof Element)
      .filter(node => node.matches('.dbplus-style'));

    if (changedNodes.length) cacheExtensionStyles
  });
  styleObserver.observe(document.documentElement, { childList: true, subtree: true });

  const runContextScript = () => {
    const script = document.createElement('script');
    script.src = getURL('control/control.js');
    (document.head || document.documentElement).append(script);
    script.onload = () => script.remove();
  };

  const scriptManager = async () =>
    import(browser.runtime.getURL('/scripts/utility/jsTools.js')).then(({ debounce, deepEquals, importFeatures, featureify }) => {  // browser.runtime.getURL is only a valid escape when written in full
      let installedFeatures = {};
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
              id: `dbplus-styles-${name}`,
              class: 'dbplus-style',
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
                  const diff = Object.entries(newPref.options).filter(([key, val]) => !deepEquals(val, oldPref.options[key]));
                  update(newPref.options, Object.fromEntries(diff));
                }
                else clean().then(main);
              }
            };

            browser.storage.onChanged.addListener(preferenceListeners[name]);
          }
        } catch (e) { console.error(`failed to execute feature ${name}`, e, 'IF THIS IS A "FAILED TO IMPORT DYNAMIC MODULE" ERROR, ENABLE WARNINGS IN THE BROWSER CONSOLE TO DISPLAY IMPORT PATH ERRORS'); }
      };
      const destroyFeature = async name => {
        const feature = installedFeatures[name];

        try {
          if (feature.css) document.querySelector(`link[href='${getURL(`/scripts/${name}.css`)}']`)?.remove();
          if (feature.js) {
            const { clean } = await import(browser.runtime.getURL(`/scripts/${name}.js`)); // browser.runtime.getURL is only a valid escape when written in full

            window.requestAnimationFrame(() => clean().catch(console.error));

            if (browser.storage.onChanged.hasListener(preferenceListeners[name])) browser.storage.onChanged.removeListener(preferenceListeners[name]);
            delete preferenceListeners[name];
          }

          resizeListeners = resizeListeners.filter(val => val !== name);
          enabledFeatures = enabledFeatures.filter(val => val !== name);
        } catch (e) { console.error(`failed to destroy feature ${name}`, e); }

        return void 0;
      };

      const onStorageChanged = async (changes, areaName) => {
        const { preferences } = changes;
        if (areaName !== 'local' || typeof preferences === 'undefined') return;

        const { oldValue = {}, newValue = {} } = preferences;

        console.info(preferences);

        const newlyEnabled = Object.keys(newValue).filter(feature => !oldValue[feature]?.enabled && newValue[feature]?.enabled);
        const newlyDisabled = Object.keys(oldValue).filter(feature => oldValue[feature]?.enabled && !newValue[feature]?.enabled);

        Promise.all([...newlyEnabled.map(executeFeature), ...newlyDisabled.map(destroyFeature)]).then(cacheExtensionStyles);
        enabledFeatures.push(newlyEnabled);
      };
      const onResized = function () {
        if (window.innerWidth < 990) {
          resizeListeners.forEach(feature => {
            if (installedFeatures[feature]?.desktopOnly && enabledFeatures.includes(feature)) destroyFeature(feature)
              .then(() => resizeListeners.push(feature)); // destroying a feature removes its resize listener, so we re-add it here
          });
        } else resizeListeners.forEach(feature => {
          console.log(feature);
          if (!enabledFeatures.includes(feature)) {
            enabledFeatures.push(feature);
            executeFeature(feature);
          }
        });
      };

      const initFeatures = async () => {
        await import(browser.runtime.getURL('/scripts/utility/database.js')).then(({ openDatabase }) => openDatabase()); // ensures the database is created before anything interacts with it
        installedFeatures = await importFeatures();

        ({ preferences } = await browser.storage.local.get('preferences'));

        preferences = featureify(installedFeatures, preferences);
        enabledFeatures = Object.keys(preferences).filter(key => preferences[key].enabled);
        browser.storage.local.set({ preferences });

        if (enabledFeatures.length) Promise.all(enabledFeatures.map(executeFeature)).then(() => document.getElementById('dbplus-extensionStyles').remove());
        else document.getElementById('dbplus-extensionStyles').remove();

        browser.storage.onChanged.addListener(onStorageChanged);

        window.addEventListener('resize', debounce(onResized));

        console.info(`running ${enabledFeatures.length} of ${Object.keys(installedFeatures).length} features`);
      };

      initFeatures();

      console.info('loaded!');
      console.info(browser.storage.local.get());
    });

  const reactObserver = new MutationObserver(() => {
    if (document.querySelector('[data-rh]') === null) {
      reactObserver.disconnect();
      scriptManager();
    }
  });

  reactObserver.observe(document.documentElement, { childList: true, subtree: true });
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
}