"use strict";

{
  const permissions = {
    origins: ["*://*.tumblr.com/"],
  };

  const button = document.getElementById('grantPermissions');
  button.onclick = async function () {
    const granted = await browser.permissions.request(permissions);
    if (granted) {
      await browser.tabs.query({ url: '*://*.tumblr.com/*' }).then(async tabs => {
        tabs.forEach(tab => browser.tabs.reload(tab.id));
      });
      window.close();
    }
  };
}
