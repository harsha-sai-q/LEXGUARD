// content.js
// This script can be injected into the active tab to extract text.
// We use a function that returns the text directly for chrome.scripting.executeScript.

function extractPageText() {
  const text = document.body.innerText.replace(/\s+/g, ' ').trim();
  // Truncate to 30,000 characters to stay within reasonable token limits for Gemini MVP
  return text.substring(0, 30000);
}

// In case it's injected as a file
extractPageText();
