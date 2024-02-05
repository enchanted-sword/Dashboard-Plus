browser.runtime.onInstalled.addListener(() => {
  browser.tabs.create({
    url: '../meta/permissions.html'
  });
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
    if (m.action = 'dynamicDnr') dynamicDnr(m.data);
  });
}

browser.runtime.onConnect.addListener(connected);

browser.runtime.onSuspend.addListener(() => { console.log("Unloading."); });