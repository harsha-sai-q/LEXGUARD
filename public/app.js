import { analyzeText, analyzePDF, analyzeFromURL } from './gemini.js';

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabPanes = document.querySelectorAll('.tab-pane');
  
  const loadingOverlay = document.getElementById('loading-overlay');
  
  // URL Tab
  const urlInput = document.getElementById('url-input');
  const analyzeUrlBtn = document.getElementById('analyze-url-btn');
  
  // PDF Tab
  const dropZone = document.getElementById('drop-zone');
  const pdfInput = document.getElementById('pdf-input');
  const analyzePdfBtn = document.getElementById('analyze-pdf-btn');
  const fileNameDisplay = document.getElementById('file-name-display');
  
  // Paste Tab
  const textInput = document.getElementById('text-input');
  const analyzeTextBtn = document.getElementById('analyze-text-btn');
  
  // Results Section
  const resultsSection = document.getElementById('results-section');
  const riskScoreValue = document.getElementById('risk-score-value');
  const riskMeterFill = document.getElementById('risk-meter-fill');
  const riskSummary = document.getElementById('risk-summary');
  const clausesGrid = document.getElementById('clauses-grid');

  let currentPdfBase64 = null;

  // Tab Switching
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      // Remove active from all
      tabButtons.forEach(b => b.classList.remove('active'));
      tabPanes.forEach(p => p.classList.remove('active'));
      
      // Add active to clicked
      btn.classList.add('active');
      const targetId = btn.getAttribute('data-target');
      document.getElementById(targetId).classList.add('active');
    });
  });

  // Loading State
  function showLoading() {
    loadingOverlay.classList.remove('hidden');
  }
  
  function hideLoading() {
    loadingOverlay.classList.add('hidden');
  }

  // URL Tab Logic
  analyzeUrlBtn.addEventListener('click', async () => {
    const url = urlInput.value.trim();
    if (!url) {
      showToast("Please enter a valid URL", "error");
      return;
    }

    showLoading();
    try {
      // Use CORS proxy to fetch HTML client-side
      const response = await fetch('https://api.allorigins.win/get?url=' + encodeURIComponent(url));
      
      if (!response.ok) throw new Error("Failed to fetch URL content via proxy");
      
      const data = await response.json();
      if (!data.contents) throw new Error("No text extracted from URL");

      // Parse the HTML string into a DOM Document
      const parser = new DOMParser();
      const doc = parser.parseFromString(data.contents, 'text/html');
      
      // Extract text from the body
      const extractedText = doc.body.innerText.replace(/\s+/g, ' ').trim().substring(0, 30000);
      if (!extractedText || extractedText.length < 50) {
         throw new Error("Could not extract meaningful text from the URL");
      }

      const analysisData = await analyzeFromURL(extractedText);
      renderResults(analysisData);
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      hideLoading();
    }
  });

  // PDF Tab Logic
  dropZone.addEventListener('click', () => pdfInput.click());

  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragover');
  });

  dropZone.addEventListener('dragleave', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
  });

  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handlePdfFile(e.dataTransfer.files[0]);
    }
  });

  pdfInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handlePdfFile(e.target.files[0]);
    }
  });

  function handlePdfFile(file) {
    if (file.type !== 'application/pdf') {
      showToast("Please select a valid PDF file", "error");
      return;
    }
    
    fileNameDisplay.textContent = file.name;
    fileNameDisplay.classList.remove('hidden');
    analyzePdfBtn.disabled = false;

    const reader = new FileReader();
    reader.onload = (e) => {
      currentPdfBase64 = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  analyzePdfBtn.addEventListener('click', async () => {
    if (!currentPdfBase64) {
      showToast("Please select a PDF file first", "error");
      return;
    }

    showLoading();
    try {
      const data = await analyzePDF(currentPdfBase64);
      renderResults(data);
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      hideLoading();
    }
  });

  // Paste Tab Logic
  analyzeTextBtn.addEventListener('click', async () => {
    const text = textInput.value.trim();
    if (!text) {
      showToast("Please paste contract text", "error");
      return;
    }

    showLoading();
    try {
      const data = await analyzeText(text);
      renderResults(data);
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      hideLoading();
    }
  });

  // renderResults(data)
  function renderResults(data) {
    if (!data || typeof data.risk_score === 'undefined') {
      showToast("Invalid response from server", "error");
      return;
    }

    resultsSection.classList.remove('hidden');

    const score = data.risk_score;
    riskScoreValue.textContent = score;
    
    // Reset classes
    riskScoreValue.className = 'risk-score';
    // Animate risk meter
    setTimeout(() => {
      riskMeterFill.style.width = `${score}%`;
    }, 50);

    // Color code based on score
    if (score < 30) {
      riskScoreValue.classList.add('text-low');
    } else if (score <= 70) {
      riskScoreValue.classList.add('text-med');
    } else {
      riskScoreValue.classList.add('text-high');
    }

    riskSummary.textContent = data.summary;

    clausesGrid.innerHTML = '';
    
    if (data.clauses && Array.isArray(data.clauses)) {
      data.clauses.forEach(clause => {
        const card = document.createElement('div');
        card.className = 'clause-card';

        let severityClass = 'badge-low';
        const severityLower = (clause.severity || '').toLowerCase();
        if (severityLower === 'high') severityClass = 'badge-high';
        if (severityLower === 'medium') severityClass = 'badge-med';

        const headerDiv = document.createElement('div');
        headerDiv.className = 'clause-header';

        const textDiv = document.createElement('div');
        textDiv.className = 'clause-text';
        textDiv.textContent = `"${clause.text}"`;

        const badgesDiv = document.createElement('div');
        badgesDiv.className = 'badges';

        const catBadge = document.createElement('span');
        catBadge.className = 'badge badge-category';
        catBadge.textContent = clause.category;

        const sevBadge = document.createElement('span');
        sevBadge.className = `badge ${severityClass}`;
        sevBadge.textContent = clause.severity;

        badgesDiv.appendChild(catBadge);
        badgesDiv.appendChild(sevBadge);
        headerDiv.appendChild(textDiv);
        headerDiv.appendChild(badgesDiv);

        const expDiv = document.createElement('div');
        expDiv.className = 'clause-explanation';
        expDiv.textContent = clause.explanation;

        card.appendChild(headerDiv);
        card.appendChild(expDiv);
        
        clausesGrid.appendChild(card);
      });
    }

    // Smooth scroll to results
    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // Error Toast Helper
  function showToast(message, type = "error") {
    let toast = document.getElementById('lexguard-toast-msg');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'lexguard-toast-msg';
      Object.assign(toast.style, {
        position: 'fixed',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor: '#EA4335',
        color: 'white',
        padding: '12px 24px',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        fontSize: '14px',
        fontWeight: '500',
        zIndex: '9999',
        opacity: '0',
        transition: 'opacity 0.3s ease',
        pointerEvents: 'none'
      });
      document.body.appendChild(toast);
    }
    
    toast.textContent = message;
    toast.style.opacity = '1';
    
    setTimeout(() => {
      toast.style.opacity = '0';
    }, 3500);
  }
});
