browser.runtime.onInstalled.addListener(async details => {
  console.info(details);

  await browser.tabs.query({ url: '*://*.tumblr.com/*' }).then(async tabs => {
    tabs.forEach(tab => browser.tabs.reload(tab.id));
  });
  if (details.reason === 'update') {
    console.log('updated!');

    browser.tabs.create({ url: '../meta/menu.html' });
  }
  if (details.reason === 'install') {
    import(browser.runtime.getURL('/scripts/utility/jsTools.js')).then(({ importFeatures, featureify }) => {
      let installedFeatures, preferences;

      const setupFeatures = async () => {
        installedFeatures = await importFeatures();
        preferences = featureify(installedFeatures, preferences);
        browser.storage.local.set({ preferences });
        console.log(preferences);
      };

      setupFeatures().then(() => browser.tabs.create({ url: '../meta/permissions.html' }));
    });
  }
});

const dynamicDnr = async ({ removeRuleIds, newRules }) => {
  console.log(removeRuleIds, newRules);
  await browser.declarativeNetRequest.updateDynamicRules({
    removeRuleIds,
    addRules: newRules,
  });
}

let connectionPort;

const connected = p => {
  connectionPort = p;
  connectionPort.onMessage.addListener(m => {
    if (m.action === 'dynamicDnr') dynamicDnr(m.data);
  });
}

browser.runtime.onConnect.addListener(connected);

browser.runtime.onSuspend.addListener(() => { console.log("Unloading."); });