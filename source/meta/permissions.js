"use strict";

{
  const permissions = {
    origins: ["*://*.tumblr.com/"],
  };

  const button = document.getElementById('grantPermissions');
  button.onclick = async function () {
    const granted = await browser.permissions.request(permissions);
    if (granted) window.close();
  };
}
