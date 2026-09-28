# Installing Matata Media

Deploy the production build on HTTPS. Localhost is suitable for development, but a phone accessing a plain HTTP server on a LAN cannot install the app reliably.

Open **Install Matata Media** at the bottom of the page:

- Android: use Chrome's Install app / Add to Home screen option.
- iPhone or iPad: open in Safari, choose Share, then Add to Home Screen.
- Windows or Linux: use Chrome or Edge's install option.
- macOS: use Safari's File → Add to Dock option where supported, or Chrome's install option.

Installation availability depends on the browser and OS version. The website remains usable when installation is unavailable. The installed app opens the staff Packages page; normal sign-in and access permissions still apply. Clients can continue using their receipt's unique QR link.

## Connectivity and updates

Package creation, edits, photos and downloads require internet. The service worker caches only the public offline page; it does not cache guest pages, media or API responses, and does not queue submissions. An offline navigation shows a retry screen. For interrupted submissions, check the package before retrying.

Service worker registration runs only in production. Deploying a new worker updates it through the browser's normal lifecycle; close existing app windows and reopen to activate a waiting update. Bump the offline cache version in `public/sw.js` when changing the offline page.

## Device acceptance checks

Before rollout, test the deployed HTTPS app at 320, 375, 390, 768, 1024 and 1440 pixels wide, in portrait and landscape and with browser zoom increased. Verify sign-in, navigation, filters, creation, phone/email feedback, duplicate warnings, photos, package details, guest collection, account settings and receipt printing.

Also verify installation and standalone launch on a real iPhone/iPad, Android device and desktop; turn connectivity off and back on; confirm receipts do not include the installation footer. Browser/device checks remain required; static checks do not prove compatibility with every device.
