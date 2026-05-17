// background.js

// Allow users to open the side panel by clicking the action (extension) icon
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionIconClick: true })
  .catch((error) => console.error(error));
