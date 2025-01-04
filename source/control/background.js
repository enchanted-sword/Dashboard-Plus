browser.runtime.onInstalled.addListener(async details => {
  await browser.tabs.query({ url: '*://*.tumblr.com/*' }).then(async tabs => {
    tabs.forEach(tab => browser.tabs.reload(tab.id));
  });
  if (details.reason === 'update') {
    browser.browserAction.setBadgeText({ text: '+' });
    browser.browserAction.setBadgeTextColor({ color: '#20163d' });
    browser.browserAction.setBadgeBackgroundColor({ color: '#42b0ff' });
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