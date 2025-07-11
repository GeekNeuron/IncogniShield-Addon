document.addEventListener('DOMContentLoaded', async () => {
  const whitelistList = document.getElementById('whitelist-list');
  const darkModeToggle = document.querySelector('[data-setting="darkMode"]');
  const defaultSettings = {
    webrtc: true, tracker: true, fingerprint: true,
    timezone: true, geolocation: true, language: true, darkMode: false,
  };

  const { settings = defaultSettings, whitelistedSites = [] } = await chrome.storage.local.get(['settings', 'whitelistedSites']);

  const applyTheme = (isDark) => {
    if (isDark) {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
  };
  
  applyTheme(settings.darkMode);
  if (darkModeToggle) {
      darkModeToggle.checked = settings.darkMode;
  }

  if (darkModeToggle) {
    darkModeToggle.addEventListener('change', async (event) => {
      const isDark = event.target.checked;
      const { settings: currentSettings = defaultSettings } = await chrome.storage.local.get('settings');
      currentSettings.darkMode = isDark;
      await chrome.storage.local.set({ settings: currentSettings });
      applyTheme(isDark);
    });
  }

  document.querySelectorAll('.switch input').forEach(toggle => {
    const key = toggle.dataset.setting;
    if (key === 'darkMode') return;
    
    toggle.checked = settings[key];

    toggle.addEventListener('change', async event => {
      const value = event.target.checked;
      const { settings: currentSettings = defaultSettings } = await chrome.storage.local.get('settings');
      currentSettings[key] = value;
      await chrome.storage.local.set({ settings: currentSettings });
      chrome.runtime.sendMessage({ action: "settingsChanged" });
    });
  });

  function renderWhitelist(sites) {
    whitelistList.innerHTML = '';
    if (sites.length === 0) {
      whitelistList.innerHTML = '<li>No sites are whitelisted.</li>';
      return;
    }
    sites.forEach(site => {
      const li = document.createElement('li');
      li.textContent = site;
      const removeBtn = document.createElement('button');
      removeBtn.textContent = 'Remove';
      removeBtn.className = 'remove-btn';
      removeBtn.dataset.site = site;
      removeBtn.addEventListener('click', async () => {
        const siteToRemove = removeBtn.dataset.site;
        const { whitelistedSites: currentSites = [] } = await chrome.storage.local.get('whitelistedSites');
        const newSites = currentSites.filter(s => s !== siteToRemove);
        await chrome.storage.local.set({ whitelistedSites: newSites });
        chrome.runtime.sendMessage({ action: "whitelistChanged" });
        renderWhitelist(newSites);
      });
      li.appendChild(removeBtn);
      whitelistList.appendChild(li);
    });
  }

  renderWhitelist(whitelistedSites);
});
