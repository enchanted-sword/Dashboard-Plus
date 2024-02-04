browser.runtime.onInstalled.addListener(() => {
  browser.tabs.create({
    url: '../meta/permissions.html'
  });
});