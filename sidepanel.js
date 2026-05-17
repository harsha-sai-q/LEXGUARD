// sidepanel.js

document.addEventListener('DOMContentLoaded', async () => {
  const tabCloud = document.getElementById('tab-cloud');
  const tabLocal = document.getElementById('tab-local');
  const setupSection = document.getElementById('setup-section');
  const analyzeSection = document.getElementById('analyze-section');
  const apiKeyInput = document.getElementById('api-key-input');
  const saveKeyBtn = document.getElementById('save-key-btn');
  const setupStatus = document.getElementById('setup-status');
  
  const analyzeBtn = document.getElementById('analyze-btn');
  const btnText = analyzeBtn.querySelector('.btn-text');
  const loader = analyzeBtn.querySelector('.loader');
  
  const resultsContainer = document.getElementById('results-container');
  const riskScoreValue = document.getElementById('risk-score-value');
  const riskStatusBadge = document.getElementById('risk-status');
  const riskSummaryText = document.getElementById('risk-summary-text');
  const clauseCount = document.getElementById('clause-count');
  const riskList = document.getElementById('risk-list');

  const CLOUD_ENDPOINT = 'https://lexguard-ai-mocha.vercel.app/api/fetch-url';

  // State Management
  let currentMode = 'cloud'; // default to cloud for premium zero-setup experience

  // 1. Initial Load of Storage State
  const state = await chrome.storage.local.get(['geminiApiKey', 'mode']);
  if (state.mode) {
    currentMode = state.mode;
  }
  if (state.geminiApiKey) {
    apiKeyInput.value = state.geminiApiKey;
  }

  // Set active tab UI
  updateTabUI();

  // Tab Listeners
  tabCloud.addEventListener('click', () => {
    currentMode = 'cloud';
    chrome.storage.local.set({ mode: 'cloud' });
    updateTabUI();
  });

  tabLocal.addEventListener('click', () => {
    currentMode = 'local';
    chrome.storage.local.set({ mode: 'local' });
    updateTabUI();
  });

  function updateTabUI() {
    if (currentMode === 'cloud') {
      tabCloud.classList.add('active');
      tabLocal.classList.remove('active');
      setupSection.classList.add('hidden'); // Cloud mode needs no setup!
    } else {
      tabLocal.classList.add('active');
      tabCloud.classList.remove('active');
      setupSection.classList.remove('hidden'); // Show setup input
    }
  }

  // Save API Key
  saveKeyBtn.addEventListener('click', async () => {
    const key = apiKeyInput.value.trim();
    if (!key) {
      setupStatus.textContent = 'Please enter a valid key.';
      setupStatus.className = 'status-msg error';
      return;
    }
    await chrome.storage.local.set({ geminiApiKey: key });
    setupStatus.textContent = 'Key saved securely!';
    setupStatus.className = 'status-msg success';
    
    setTimeout(() => {
      setupStatus.textContent = '';
    }, 2000);
  });

  // Analyze Page
  analyzeBtn.addEventListener('click', async () => {
    // Check prerequisites
    let apiKey = '';
    if (currentMode === 'local') {
      const storage = await chrome.storage.local.get('geminiApiKey');
      apiKey = storage.geminiApiKey;
      if (!apiKey) {
        setupStatus.textContent = 'Please configure your API Key first!';
        setupStatus.className = 'status-msg error';
        setupSection.classList.remove('hidden');
        setupSection.scrollIntoView({ behavior: 'smooth' });
        return;
      }
    }

    // UI Loading state
    btnText.classList.add('hidden');
    loader.classList.remove('hidden');
    analyzeBtn.disabled = true;
    resultsContainer.classList.add('hidden');
    riskList.innerHTML = '';

    try {
      // 1. Get active tab text
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab) throw new Error('No active tab found.');

      if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
        throw new Error('Cannot scan internal browser pages. Go to an external website or legal contract page.');
      }

      const [{ result }] = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          const text = document.body.innerText.replace(/\s+/g, ' ').trim();
          return text.substring(0, 30000);
        }
      });

      if (!result || result.length < 50) {
        throw new Error('No readable text found on this webpage. Make sure you are on a webpage containing contract text.');
      }

      // 2. Perform Analysis
      let analysisResult;
      if (currentMode === 'cloud') {
        analysisResult = await analyzeWithCloud(result);
      } else {
        analysisResult = await analyzeWithDirectAPI(result, apiKey);
      }
      
      // 3. Render Results
      renderResults(analysisResult);

    } catch (error) {
      console.error(error);
      showErrorCard(error.message);
    } finally {
      // Reset button UI
      btnText.classList.remove('hidden');
      loader.classList.add('hidden');
      analyzeBtn.disabled = false;
    }
  });

  // Zero-Setup Cloud Mode (Vercel Backend)
  async function analyzeWithCloud(text) {
    const response = await fetch(CLOUD_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ action: "analyze", text })
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || "Cloud analysis failed. If this continues, try direct API Key mode.");
    }

    return response.json();
  }

  // Direct Browser API Key Mode (Google AI Studio Endpoint)
  async function analyzeWithDirectAPI(text, apiKey) {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const prompt = `You are LexGuard, an AI legal contract analyzer. Analyze the following legal text. Return ONLY raw JSON, no markdown formatting, no backticks, no explanation. Just the JSON object. Return this exact structure: {"risk_score": <number 0-100>, "summary": "<2 sentence plain English summary>", "clauses": [{"text": "<clause text max 150 chars>", "category": "<Privacy|Financial|Employment|IP|Arbitration|Data Collection>", "severity": "<High|Medium|Low>", "explanation": "<2-3 sentence plain English explanation>"}]}. Legal text: ${text.substring(0, 15000)}`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.1,
          responseMimeType: "application/json"
        }
      })
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error?.message || `API Error: ${response.status}`);
    }

    const data = await response.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    
    // Robust extraction of JSON object
    const firstBrace = rawText.indexOf('{');
    const lastBrace = rawText.lastIndexOf('}');
    if (firstBrace === -1) {
      throw new Error("Invalid AI response. Please try again.");
    }
    const jsonStr = rawText.substring(firstBrace, lastBrace + 1);
    return JSON.parse(jsonStr);
  }

  // Render Results on the Interface
  function renderResults(data) {
    const score = Number(data.risk_score) || 0;
    const summary = data.summary || 'Scan complete. Summary unavailable.';
    const clauses = data.clauses || [];

    // Animate Score circle counter
    animateScoreCircle(score);

    // Set Risk status badge
    if (score >= 70) {
      riskStatusBadge.textContent = 'High Risk 🚨';
      riskStatusBadge.className = 'badge high';
      setCircleColor('#f43f5e'); // rose
    } else if (score >= 40) {
      riskStatusBadge.textContent = 'Medium Risk ⚠️';
      riskStatusBadge.className = 'badge med';
      setCircleColor('#fbbf24'); // amber
    } else {
      riskStatusBadge.textContent = 'Low Risk Safe 🛡️';
      riskStatusBadge.className = 'badge low';
      setCircleColor('#10b981'); // emerald
    }

    // Set Summary text
    riskSummaryText.textContent = summary;

    // Set clause counter
    clauseCount.textContent = `${clauses.length} clause${clauses.length === 1 ? '' : 's'} detected`;

    // Render Clause Cards
    if (clauses.length === 0) {
      const noRiskCard = document.createElement('div');
      noRiskCard.className = 'risk-item low';
      noRiskCard.style.opacity = '1';
      noRiskCard.style.transform = 'translateY(0)';
      
      const tagRow = document.createElement('div');
      tagRow.className = 'clause-tag-row';
      const catSpan = document.createElement('span');
      catSpan.className = 'clause-category';
      catSpan.textContent = 'Compliance';
      const sevSpan = document.createElement('span');
      sevSpan.className = 'clause-severity low';
      sevSpan.textContent = 'Info';
      tagRow.appendChild(catSpan);
      tagRow.appendChild(sevSpan);

      const quoteP = document.createElement('p');
      quoteP.className = 'clause-quote';
      quoteP.textContent = '"All legal clauses reviewed."';

      const expP = document.createElement('p');
      expP.className = 'clause-explanation';
      expP.textContent = 'No specific high-severity legal liabilities or risks were identified in the contract text.';

      noRiskCard.appendChild(tagRow);
      noRiskCard.appendChild(quoteP);
      noRiskCard.appendChild(expP);
      
      riskList.appendChild(noRiskCard);
    } else {
      clauses.forEach((clause, index) => {
        const severityClass = (clause.severity || 'low').toLowerCase();
        const card = document.createElement('div');
        card.className = `risk-item ${severityClass}`;
        
        const tagRow = document.createElement('div');
        tagRow.className = 'clause-tag-row';
        const catSpan = document.createElement('span');
        catSpan.className = 'clause-category';
        catSpan.textContent = clause.category || 'General';
        const sevSpan = document.createElement('span');
        sevSpan.className = `clause-severity ${severityClass}`;
        sevSpan.textContent = clause.severity || 'Low';
        tagRow.appendChild(catSpan);
        tagRow.appendChild(sevSpan);

        const quoteP = document.createElement('p');
        quoteP.className = 'clause-quote';
        quoteP.textContent = `"${clause.text}"`;

        const expP = document.createElement('p');
        expP.className = 'clause-explanation';
        expP.textContent = clause.explanation;

        card.appendChild(tagRow);
        card.appendChild(quoteP);
        card.appendChild(expP);
        
        riskList.appendChild(card);
        
        // Staggered slide up animation
        setTimeout(() => {
          card.style.transition = 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)';
          card.style.opacity = '1';
          card.style.transform = 'translateY(0)';
        }, index * 80);
      });
    }

    resultsContainer.classList.remove('hidden');
    resultsContainer.scrollIntoView({ behavior: 'smooth' });
  }

  function animateScoreCircle(targetScore) {
    let current = 0;
    const interval = setInterval(() => {
      if (current >= targetScore) {
        riskScoreValue.textContent = targetScore;
        clearInterval(interval);
      } else {
        current += Math.ceil((targetScore - current) / 5) || 1;
        riskScoreValue.textContent = current;
      }
    }, 30);
  }

  function setCircleColor(color) {
    const circle = document.querySelector('.score-circle');
    circle.style.borderColor = color;
    circle.style.boxShadow = `inset 0 0 15px rgba(0,0,0,0.5), 0 0 15px ${color}33`;
  }

  function showErrorCard(msg) {
    const errCard = document.createElement('div');
    errCard.className = 'risk-item high';
    errCard.style.opacity = '1';
    errCard.style.transform = 'translateY(0)';
    
    const tagRow = document.createElement('div');
    tagRow.className = 'clause-tag-row';
    const catSpan = document.createElement('span');
    catSpan.className = 'clause-category';
    catSpan.textContent = 'Scanner Error';
    const sevSpan = document.createElement('span');
    sevSpan.className = 'clause-severity high';
    sevSpan.textContent = 'Error';
    tagRow.appendChild(catSpan);
    tagRow.appendChild(sevSpan);

    const quoteP = document.createElement('p');
    quoteP.className = 'clause-quote';
    quoteP.textContent = '"Scanner could not process contract text."';

    const expP = document.createElement('p');
    expP.className = 'clause-explanation';
    expP.textContent = msg;

    errCard.appendChild(tagRow);
    errCard.appendChild(quoteP);
    errCard.appendChild(expP);
    
    riskList.appendChild(errCard);
    riskScoreValue.textContent = 'Err';
    riskStatusBadge.textContent = 'Failed';
    riskStatusBadge.className = 'badge high';
    riskSummaryText.textContent = 'Scan aborted due to an internal error. Please check your network and settings.';
    clauseCount.textContent = '0 risks';
    setCircleColor('#f43f5e');
    resultsContainer.classList.remove('hidden');
  }

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
});
