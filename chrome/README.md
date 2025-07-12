# ZeroTrace [Add-on]

An advanced, open-source browser extension for comprehensive privacy protection, anti-tracking, and digital identity management.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/badge/Version-4.0-blue.svg)]()
[![Status](https://img.shields.io/badge/Status-Complete-brightgreen.svg)]()

---

## Key Features

This extension is an all-in-one solution designed to protect you against a wide array of tracking methods and information leaks:

* **WebRTC Leak Protection:** Prevents the exposure of your real IP address when using a VPN.
* **Dynamic Tracker Blocker:** Blocks thousands of known advertising and tracking domains using dynamically updated blocklists.
* **Advanced Anti-Fingerprinting:** Neutralizes sophisticated device identification techniques, including Canvas, WebGL, and AudioContext fingerprinting.
* **Full Location Spoofing:** Aligns your entire digital identity with your VPN's IP location by faking the timezone, geolocation, and browser language.
* **Complete User Control:**
    * **Whitelist:** Easily disable protection for specific websites that may not function correctly.
    * **Advanced Options Page:** Granular control to toggle every single protection feature individually.
    * **Blocklist Management:** Add your own custom blocklist URLs for enhanced protection.
* **Advanced User Interface:**
    * A clean popup that displays the overall protection status and a real-time count of blocked trackers.
    * **Live Test** functionality to quickly check the status of spoofing features.
    * Includes a user-friendly **Dark Mode** for eye comfort.

---

## Installation

Since this extension is not published on the Chrome Web Store, you must load it manually in Developer Mode.

1.  Download the latest version of the project and unzip the folder.
2.  Open your Chrome browser and navigate to `chrome://extensions`.
3.  Enable **Developer mode** using the toggle switch in the top-right corner.
4.  Click the **Load unpacked** button.
5.  Select the unzipped project folder you just downloaded.

The extension is now installed and ready to use.

---

## How to Use

* **Popup:** Click the extension's icon in your toolbar to view the main dashboard. From here, you can see the overall protection status, toggle it on or off, whitelist the current site, and run a live test.
* **Options Page:** To access advanced settings, click the "Settings" link in the popup. This page allows you to manage each security feature individually and add your custom blocklists.
* **Help Page:** For a full breakdown of each feature and how to test them, click the "Guide" link in the popup.

---

## Technology Stack

* **Manifest V3:** The latest Chrome extension standard for enhanced security and performance.
* **JavaScript (ES6+):** Used to implement all of the extension's logic.
* **`declarativeNetRequest` API:** For high-performance, privacy-preserving tracker blocking.
* **`scripting` API:** To inject defensive scripts into web pages at runtime.
* **`webRequest` API:** For monitoring network requests to count blocked trackers.
* **HTML5 / CSS3:** To build the user interface for the popup and options page.

---

## Contributing

This is an open-source project, and contributions are welcome. To contribute, please fork the repository and submit a Pull Request with your proposed changes. You can also open an Issue to report bugs or suggest new features.

---

## Support the Project

If you find this extension useful, please consider supporting its development through one of the addresses below:

* **Bitcoin (BTC):** `bc1q...placeholder...xyz`
* **Ethereum (ETH):** `0x123...placeholder...abc`
* **Monero (XMR):** `442A...placeholder...def`

---

## License

This project is licensed under the **MIT License**. See the `LICENSE` file for more details.

<p align="center">Created with ❤️ by GeekNeuron</p>
