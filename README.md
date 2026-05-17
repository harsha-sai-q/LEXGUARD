# 🛡️ LexGuard — AI-Powered Legal Contract Scanner & Risk Indexer

> **Analyze complex legal contracts, Terms of Service, and Privacy Policies in real-time. Instantly translate "legalese" into plain English and highlight high-risk liabilities before you agree.**

LexGuard is a modern full-stack developer tool comprising a **Responsive Web Application** and a **Chrome Extension (Side Panel)** powered by Gemini 2.0 Flash Lite & 1.5 Flash. It utilizes a highly secure, serverless API architecture to deliver safe, rapid contract audits in one click.

---

## 🚀 Live Demo & Production
* **Web App & Production Endpoint:** [https://lexguard-ai-mocha.vercel.app](https://lexguard-ai-mocha.vercel.app)
* **Chrome Web Store / Unpacked Folder:** `lexguard-extension/`

---

## ✨ Key Features
* **🔒 Dual-Mode Scanning (Chrome Extension):**
  * **☁️ Zero-Setup Cloud Mode:** Scans contracts instantly out of the box using your secure, deployed Vercel proxy backend (zero user configuration required!).
  * **🔑 Direct API Key Mode:** Allows developers or privacy-focused users to paste their custom Google AI Studio Gemini API Key directly into the secure chrome storage area.
* **📈 Animated Risk Gauge & Score:** Evaluates contracts and calculates a dynamic risk index from 0 (Perfect Compliance) to 100 (Severe Liability).
* **🚨 Granular Clause-by-Clause Audit:** Detects, classifies, and tags risky clauses in categories like *Privacy, IP, Financial Liabilities, Arbitration, Data Collection, and Auto-Renewals*.
* **💬 Plain-English Explanations:** Deciphers dense jargon and lists precisely how each clause impacts you in 2 simple sentences.
* **📄 Document Analysis (Web App):** Drag and drop full contract PDFs or paste long-form contract texts for complete analysis.

---

## 🛠️ Tech Stack
* **Frontend:** Vanilla HTML5, CSS3 (Rich Modern Dark Glassmorphism), ES6 Javascript.
* **Backend:** Vercel Serverless Functions (Node.js).
* **AI Engine:** Google Gemini Pro (`gemini-2.0-flash-lite` and `gemini-1.5-flash`).
* **Authentication:** Google OAuth 2.0 JWT (Service Accounts) with custom API key secure fallback.

---

## 📦 Directory Structure
```bash
lexguard-extension/
├── api/
│   └── fetch-url.js      # Secure Serverless Backend Proxy (Vertex / AI Studio Router)
├── public/
│   ├── index.html        # Web Application Homepage
│   ├── style.css         # Web Application CSS (Premium UI Elements)
│   └── gemini.js         # Client API Router
├── background.js         # Chrome Extension Service Worker (opens Side Panel on click)
├── content.js            # Chrome Extension Script Injection (extracts page text safely)
├── sidepanel.html        # Chrome Extension Side Panel HTML
├── sidepanel.css         # Chrome Extension Side Panel Styles (Staggered Animation Card)
├── sidepanel.js          # Dual-Mode Controller Logic
├── manifest.json         # Extension Configuration (Manifest V3)
└── README.md             # This Documentation
```

---

## 🔧 Installation & Local Setup

### 1. Run the Chrome Extension (Local)
To install the LexGuard extension on your local Google Chrome browser:
1. Open Google Chrome.
2. Go to: `chrome://extensions/`
3. Toggle the **"Developer mode"** switch in the top-right corner to **ON**.
4. Click the **"Load unpacked"** button in the top-left corner.
5. Select the `lexguard-extension` folder inside your repository.
6. The LexGuard extension card will appear! Go to any contract page, click the extensions puzzle icon (🧩), and select **LexGuard** to launch.

---

### 2. Set Up the Serverless Backend (Local & Vercel)
If you want to run or deploy the backend proxy server:
1. Install dependencies:
   ```bash
   npm install
   ```
2. Set up environment variables in your `.env.local` file:
   ```env
   # Google AI Studio Developer Key
   GEMINI_API_KEY=AIzaSy...

   # (Optional) Google Service Account credentials for Enterprise OAuth:
   GCP_PROJECT_ID=your-project-id
   GCP_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
   GCP_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgk..."
   ```
3. Run the development server locally using Vercel CLI:
   ```bash
   npm run dev
   ```
4. Deploy to Vercel production:
   ```bash
   npx vercel --prod
   ```

---

## 🧪 Manual Testing & Verification Spec

To perform a full-length verification of the LexGuard scanner's capabilities, you can copy the standard high-liability mock contract below and scan it on either the Web App or the Chrome Extension:

### 1. Test Contract Payload (Copy & Paste)
```text
TERMS OF SERVICE AND SERVICE AGREEMENT

1. BINDING ARBITRATION: Any dispute, controversy or claim arising out of or relating to this contract, including its formation or breach, shall be settled by binding arbitration in accordance with the rules of the American Arbitration Association, and judgment on the award rendered by the arbitrator(s) may be entered in any court having jurisdiction thereof. YOU HEREBY WAIVE YOUR RIGHT TO A TRIAL BY JURY.

2. WAIVER OF CLASS ACTION: All claims must be brought in the parties' individual capacity, and not as a plaintiff or class member in any purported class or representative proceeding.

3. AUTOMATIC RENEWAL: This agreement shall automatically renew for successive terms of 12 months each at the then-current service fee rate, unless either party gives written notice of non-renewal at least 90 days prior to the expiration of the current term.

4. INTELLECTUAL PROPERTY & DATA RIGHTS: You hereby grant the Company an irrevocable, perpetual, worldwide, sublicensable, royalty-free license to use, reproduce, modify, adapt, publish, translate, and distribute your user data and content for any commercial purpose whatsoever.
```

### 2. Verification Walkthrough (Step-by-Step)
#### A. On the Web App:
1. Navigate to **[https://lexguard-ai-mocha.vercel.app](https://lexguard-ai-mocha.vercel.app)**.
2. Select the **"Paste Text"** tab.
3. Paste the 4-clause contract text above into the input textarea.
4. Click the blue **"Analyze Contract"** button.
5. Wait ~3-5 seconds.

#### B. On the Chrome Extension:
1. Ensure the extension is loaded locally from your Chrome extensions page.
2. Open any webpage containing legal text or open a raw file in the browser containing the text above.
3. Click the extensions icon in the toolbar, select **LexGuard** to open the side panel.
4. Keep the tab set to **"Zero-Setup Cloud"**.
5. Click **"🛡️ Scan Webpage"**.

---

### 3. Expected Successful Output (Verification Checklist)
* **Risk Score Index:** Should evaluate to **High Risk (75 to 90 range)**.
* **Risk status badge:** Color-coded in crimson rose (`high` classification).
* **Summary analysis:** Generates a 2-sentence plain English warning summarizing that you are waiving your day in court and granting perpetual ownership of your user data to the company.
* **Granular Cards Identified:**
  * **Clause 1 Tag:** Classified under `Arbitration`, Severity: `High`. Explains that you waive your constitutional right to a jury trial.
  * **Clause 2 Tag:** Classified under `Arbitration` or `Compliance`, Severity: `High`. Explains you cannot join class-action lawsuits.
  * **Clause 3 Tag:** Classified under `Financial` or `Arbitration`, Severity: `Medium`. Explains the auto-billing traps and the strict 90-day cancellation window.
  * **Clause 4 Tag:** Classified under `IP` or `Data Collection`, Severity: `High`. Explains you lose all copyrights and ownership of the content/media you upload.

---

## 🛡️ Security & API Key Protection
Unlike generic AI extensions, LexGuard does **not** leak developer API Keys to the client-side browser in Cloud Mode. The browser interacts solely with the secure serverless backend `/api/fetch-url`. The Vercel function injects the `GEMINI_API_KEY` from your serverless dashboard environment variables, keeping your API key 100% hidden and secure from inspect-element scraping.

---

## 📜 License
LexGuard is open-source and available under the **MIT License**.
