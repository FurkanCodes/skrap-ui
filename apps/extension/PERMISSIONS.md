# Dealvinci Extension Permissions

These permissions support the extension's single purpose: adding the current product page to Dealvinci after the user connects their account.

- `activeTab`: read the current tab only after the user opens the Dealvinci popup.
- `tabs`: query the active tab URL and title for the product the user chooses to add.
- `scripting`: read visible product metadata such as price from the active page.
- `storage`: store the opaque Dealvinci extension session token and connection state locally.
- `identity`: start the browser-supported Dealvinci authorization flow.
- `webNavigation`: detect the auth callback in the fallback tab-based authorization flow.

Host permissions are limited to Dealvinci production app domains and the exact browser auth callback host for each store build. The extension does not request direct access to the Dealvinci API host; API calls are proxied by the app server.
