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

let portFromCS;

const connected = p => {
  portFromCS = p;
  portFromCS.onMessage.addListener(m => {
    if (m.action = 'dynamicDnr') dynamicDnr(m.data);
  });
}

browser.runtime.onConnect.addListener(connected);