(async () => {
  'use strict';

  const { settings } = await chrome.runtime.sendMessage({ action: "getSettings" });
  if (!settings) return;

  if (settings.fingerprint) {
    const originalGetContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, contextAttributes) {
      const context = originalGetContext.call(this, type, contextAttributes);
      if (type === '2d') {
        const originalToDataURL = this.toDataURL;
        this.toDataURL = function () {
          context.fillStyle = `rgba(0, 0, 0, ${0.0001 * Math.random()})`;
          context.fillRect(0, 0, 1, 1);
          return originalToDataURL.apply(this, arguments);
        };
      }
      return context;
    };

    try {
      const originalGetParameter = WebGLRenderingContext.prototype.getParameter;
      WebGLRenderingContext.prototype.getParameter = function (parameter) {
        if (parameter === this.UNMASKED_VENDOR_WEBGL) return 'Google Inc. (Apple)';
        if (parameter === this.UNMASKED_RENDERER_WEBGL) return 'ANGLE (Apple, Apple M1, OpenGL 4.1)';
        return originalGetParameter.apply(this, arguments);
      };
    } catch (e) {}

    try {
      const originalGetChannelData = AudioBuffer.prototype.getChannelData;
      AudioBuffer.prototype.getChannelData = function (channel) {
        const data = originalGetChannelData.call(this, channel);
        for (let i = 0; i < data.length; i++) {
          data[i] += (Math.random() - 0.5) * 0.0000001;
        }
        return data;
      };
    } catch (e) {}
  }

  if (settings.timezone) {
    const { targetTimezone } = await chrome.runtime.sendMessage({ action: "getTimezone" });
    if (targetTimezone) {
      Date.prototype.toString = () => new Date().toLocaleString("en-US", { timeZone: targetTimezone });
      Date.prototype.toLocaleString = function(locales, options) {
         return new Date(this).toLocaleString(locales, { ...options, timeZone: targetTimezone });
      };
      const offset = new Date().toLocaleString("en-US", { timeZone: targetTimezone, timeZoneName: "shortOffset" }).split("GMT")[1];
      if (offset) {
         const offsetMinutes = (parseInt(offset.split(':')[0],10) * 60) + (parseInt(offset.split(':')[1] || 0,10));
         Date.prototype.getTimezoneOffset = () => -offsetMinutes;
      }
    }
  }

  if (settings.geolocation) {
    const { targetGeolocation } = await chrome.runtime.sendMessage({ action: "getGeolocation" });
    if (targetGeolocation) {
      navigator.geolocation.getCurrentPosition = (success, error, options) => {
        success({
          coords: { ...targetGeolocation, accuracy: 20, altitude: null, altitudeAccuracy: null, heading: null, speed: null },
          timestamp: Date.now(),
        });
      };
      navigator.geolocation.watchPosition = (success, error, options) => {
        navigator.geolocation.getCurrentPosition(success, error, options);
        return 1;
      };
    }
  }

  if (settings.language) {
    const { targetLanguage } = await chrome.runtime.sendMessage({ action: "getLanguage" });
    if (targetLanguage) {
      Object.defineProperties(navigator, {
        language: { value: targetLanguage, configurable: true },
        languages: { value: [targetLanguage], configurable: true },
      });
    }
  }

  if (settings.fingerprint) {
    try {
      const standardFonts = [
        "Arial", "Courier New", "Georgia", "Times New Roman", "Verdana",
        "Andale Mono", "Comic Sans MS", "Impact", "Trebuchet MS", "Webdings"
      ];

      if (navigator.fonts && navigator.fonts.query) {
        const originalQuery = navigator.fonts.query;
        navigator.fonts.query = (options) => {
          return new Promise(resolve => {
            const fonts = standardFonts.map(font => ({
              family: font,
              fullName: font,
              postscriptName: font,
              style: "normal",
              weight: "normal",
              stretch: "normal"
            }));
            resolve(fonts);
          });
        };
      }
    } catch (e) {
      console.error('Failed to apply Font fingerprinting protection:', e);
    }
  }
})();
