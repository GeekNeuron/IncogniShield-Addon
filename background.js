const BLOCKLIST_URL = 'https://s3.amazonaws.com/lists.disconnect.me/simple_tracking.txt';
const WEBRTC_POLICIES = {
  PROTECTED: 'disable_non_proxied_udp',
  DEFAULT: 'default',
};
const defaultSettings = {
  webrtc: true, tracker: true, fingerprint: true,
  timezone: true, geolocation: true, language: true,
};

let blockedCounts = {};

async function applyProtections() {
  const { settings = defaultSettings, isProtected, whitelistedSites = [] } = await chrome.storage.local.get(['settings', 'isProtected', 'whitelistedSites']);

  await chrome.privacy.network.webRTCIPHandlingPolicy.set({ value: WEBRTC_POLICIES.DEFAULT });
  await clearDynamicRules();
  await unregisterContentScripts();

  if (!isProtected) {
    updateIcon(false);
    return;
  }

  if (settings.webrtc) {
    await chrome.privacy.network.webRTCIPHandlingPolicy.set({ value: WEBRTC_POLICIES.PROTECTED });
  }

  if (settings.tracker) {
    await updateDynamicRules(whitelistedSites);
  }

  const spoofingFeatures = ['fingerprint', 'timezone', 'geolocation', 'language'];
  if (spoofingFeatures.some(s => settings[s])) {
    if (settings.timezone) await updateAndStoreTimezone();
    if (settings.geolocation) await updateAndStoreGeolocation();
    if (settings.language) await updateAndStoreLanguage();
    await registerContentScripts();
  }

  updateIcon(true);
}

async function updateDynamicRules(whitelistedSites = []) {
  const response = await fetch(BLOCKLIST_URL).catch(() => null);
  if (!response || !response.ok) return;
  const text = await response.text();
  const domains = text.split('\n').filter(d => d && !d.startsWith('#'));

  const trackerBlockRules = domains.map((domain, index) => ({
    id: index + 1,
    priority: 1,
    action: { type: 'block' },
    condition: {
      urlFilter: `||${domain}`,
      excludedRequestDomains: whitelistedSites,
      resourceTypes: ['main_frame', 'sub_frame', 'script', 'image', 'xmlhttprequest', 'stylesheet', 'media'],
    },
  }));

  const headerRemovalRule = {
    id: domains.length + 1,
    priority: 2,
    action: {
      type: 'modifyHeaders',
      requestHeaders: [
        { header: 'sec-ch-ua', operation: 'remove' },
        { header: 'sec-ch-ua-mobile', operation: 'remove' },
        { header: 'sec-ch-ua-platform', operation: 'remove' },
        { header: 'sec-ch-ua-arch', operation: 'remove' },
        { header: 'sec-ch-ua-model', operation: 'remove' },
        { header: 'sec-ch-ua-bitness', operation: 'remove' },
        { header: 'sec-ch-ua-full-version-list', operation: 'remove' },
        { header: 'sec-ch-ua-platform-version', operation: 'remove' },
      ],
    },
    condition: {
      urlFilter: '*',
      resourceTypes: ['main_frame', 'sub_frame', 'script', 'xmlhttprequest', 'image', 'stylesheet', 'media'],
    },
  };

  const allRules = [...trackerBlockRules, headerRemovalRule];

  const oldRules = await chrome.declarativeNetRequest.getDynamicRules();
  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: oldRules.map(r => r.id),
    addRules: allRules
  });
}

async function clearDynamicRules() {
  const oldRules = await chrome.declarativeNetRequest.getDynamicRules();
  if (oldRules.length > 0) {
    await chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds: oldRules.map(r => r.id) });
  }
}

async function registerContentScripts() {
  try {
    await chrome.scripting.registerContentScripts([{
      id: 'fingerprint-defender',
      js: ['fingerprint-defender.js'],
      matches: ['<all_urls>'],
      runAt: 'document_start',
      world: 'MAIN',
    }]);
  } catch (error) {
    if (!error.message.includes('Duplicate script ID')) console.error(error);
  }
}

async function unregisterContentScripts() {
  try {
    await chrome.scripting.unregisterContentScripts({ ids: ['fingerprint-defender'] });
  } catch (error) {
    if (!error.message.includes('No script with id')) console.error(error);
  }
}

function updateIcon(isProtected) {
  const iconPath = isProtected ? 'icons/icon-on-128.png' : 'icons/icon-off-128.png';
  chrome.action.setIcon({ path: iconPath });
  chrome.action.setBadgeText({ text: isProtected ? 'ON' : '' });
  chrome.action.setBadgeBackgroundColor({ color: '#34A853' });
}

async function updateAndStoreTimezone() {
  const response = await fetch('https://worldtimeapi.org/api/ip').catch(() => null);
  if (!response || !response.ok) return;
  const data = await response.json();
  if (data.timezone) {
    await chrome.storage.local.set({ targetTimezone: data.timezone });
  }
}

async function updateAndStoreGeolocation() {
  const response = await fetch('http://ip-api.com/json/?fields=lat,lon').catch(() => null);
  if (!response || !response.ok) return;
  const data = await response.json();
  if (data.lat && data.lon) {
    await chrome.storage.local.set({ targetGeolocation: { latitude: data.lat, longitude: data.lon } });
  }
}

async function updateAndStoreLanguage() {
  const response = await fetch('https://api.bigdatacloud.net/data/reverse-geocode-client').catch(() => null);
  if (!response || !response.ok) return;
  const data = await response.json();
  if (data.localityInfo?.informative[0]?.isoCode) {
    await chrome.storage.local.set({ targetLanguage: data.localityInfo.informative[0].isoCode });
  }
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({
    isProtected: false,
    whitelistedSites: [],
    settings: defaultSettings,
  });
  chrome.alarms.create('updateBlocklistAlarm', { periodInMinutes: 1440 });
});

chrome.runtime.onStartup.addListener(async () => {
  const { isProtected } = await chrome.storage.local.get('isProtected');
  if (isProtected) {
    await applyProtections();
  } else {
    updateIcon(false);
  }
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'updateBlocklistAlarm') {
    const { isProtected, settings } = await chrome.storage.local.get(['isProtected', 'settings']);
    if (isProtected && settings.tracker) {
      await updateDynamicRules();
    }
  }
});

chrome.webRequest.onErrorOccurred.addListener(
  (details) => {
    if (details.error === 'net::ERR_BLOCKED_BY_CLIENT') {
      const tabId = details.tabId;
      if (tabId > 0) {
        const count = (blockedCounts[tabId] || 0) + 1;
        blockedCounts[tabId] = count;
        chrome.action.setBadgeText({ text: count.toString(), tabId: tabId });
        chrome.action.setBadgeBackgroundColor({ color: '#d32f2f', tabId: tabId });
      }
    }
  }, { urls: ['<all_urls>'] }
);

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === 'loading') {
    blockedCounts[tabId] = 0;
    chrome.storage.local.get('isProtected', data => {
      chrome.action.setBadgeText({ text: data.isProtected ? 'ON' : '', tabId: tabId });
      chrome.action.setBadgeBackgroundColor({ color: '#34A853', tabId: tabId });
    });
  }
});

chrome.tabs.onRemoved.addListener(tabId => delete blockedCounts[tabId]);

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.action) {
    case "toggleGlobalProtection":
      chrome.storage.local.get('isProtected', data => {
        chrome.storage.local.set({ isProtected: !data.isProtected }).then(applyProtections);
      });
      break;
    case "whitelistChanged":
    case "settingsChanged":
      applyProtections();
      break;
    case "getTabCount":
      sendResponse({ count: blockedCounts[request.tabId] || 0 });
      break;
    case "getTimezone":
    case "getGeolocation":
    case "getLanguage":
    case "getSettings":
      const key = request.action.replace('get', '').toLowerCase();
      const storageKey = key === 'settings' ? 'settings' : `target${key.charAt(0).toUpperCase() + key.slice(1)}`;
      chrome.storage.local.get(storageKey, data => sendResponse(data));
      return true;
  }
  return true;
});
