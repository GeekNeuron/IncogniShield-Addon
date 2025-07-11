document.addEventListener('DOMContentLoaded', async () => {
  const { settings } = await chrome.storage.local.get('settings');
  if (settings && settings.darkMode) {
    document.body.classList.add('dark-theme');
  }
});
document.addEventListener('contextmenu', event => event.preventDefault());
