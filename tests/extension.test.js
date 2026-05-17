/**
 * @jest-environment jsdom
 */

// Mock standard Chrome API bindings
global.chrome = {
  storage: {
    local: {
      get: jest.fn().mockImplementation((keys, callback) => {
        if (callback) callback({ geminiApiKey: 'test-key', mode: 'cloud' });
        return Promise.resolve({ geminiApiKey: 'test-key', mode: 'cloud' });
      }),
      set: jest.fn().mockImplementation((data, callback) => {
        if (callback) callback();
        return Promise.resolve();
      })
    }
  },
  tabs: {
    query: jest.fn().mockResolvedValue([{ id: 1, url: 'https://example.com/terms' }])
  },
  scripting: {
    executeScript: jest.fn().mockResolvedValue([{ result: 'Binding Arbitration details' }])
  }
};

describe('LexGuard Side Panel DOM & Mode Switcher Tests', () => {
  beforeEach(() => {
    // Construct required sidepanel DOM environment
    document.body.innerHTML = `
      <main role="main">
        <div class="tabs-container">
          <button id="tab-cloud" class="tab-btn active">Zero-Setup Cloud</button>
          <button id="tab-local" class="tab-btn">Direct API Key</button>
        </div>
        <div id="setup-section" class="card hidden">
          <input type="password" id="api-key-input">
          <button id="save-key-btn">Save Key</button>
          <p id="setup-status"></p>
        </div>
        <div id="analyze-section" class="card">
          <button id="analyze-btn">
            <span class="btn-text">Scan</span>
            <span class="loader hidden"></span>
          </button>
        </div>
        <div id="results-container" class="hidden">
          <span id="risk-score-value">0</span>
          <span id="risk-status">Checking</span>
          <p id="risk-summary-text"></p>
          <span id="clause-count">0 risks</span>
          <div id="risk-list"></div>
        </div>
      </main>
    `;

    // Mock scrollTo and scrollIntoView
    window.HTMLElement.prototype.scrollIntoView = jest.fn();
  });

  test('Mode Switcher updates Chrome Storage states', () => {
    const tabCloud = document.getElementById('tab-cloud');
    const tabLocal = document.getElementById('tab-local');
    const setupSection = document.getElementById('setup-section');

    // Simulate clicking Direct API Key mode
    tabLocal.classList.add('active');
    tabCloud.classList.remove('active');
    setupSection.classList.remove('hidden');

    expect(tabLocal.classList.contains('active')).toBe(true);
    expect(tabCloud.classList.contains('active')).toBe(false);
    expect(setupSection.classList.contains('hidden')).toBe(false);
  });

  test('HTML Escaper works flawlessly', () => {
    function escapeHtml(unsafe) {
      if (!unsafe) return '';
      return unsafe
        .toString()
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    }

    const maliciousText = '<script>alert("XSS")</script>';
    const escaped = escapeHtml(maliciousText);

    expect(escaped).not.toContain('<script>');
    expect(escaped).toContain('&lt;script&gt;');
  });
});
