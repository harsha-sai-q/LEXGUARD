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

## 🛡️ Security & API Key Protection
Unlike generic AI extensions, LexGuard does **not** leak developer API Keys to the client-side browser in Cloud Mode. The browser interacts solely with the secure serverless backend `/api/fetch-url`. The Vercel function injects the `GEMINI_API_KEY` from your serverless dashboard environment variables, keeping your API key 100% hidden and secure from inspect-element scraping.

---

## 📜 License
LexGuard is open-source and available under the **MIT License**.
