# 🧪 LexGuard Manual Verification Files

This directory contains test files with high-severity legal liabilities and data collection clauses. You can use these files to verify that the LexGuard Web Application and Chrome Extension are successfully parsing, scoring, and explaining complex legal terms.

## 📂 Included Test Files:
1. **[`mock_contract.txt`](mock_contract.txt)**: A mock service agreement containing terms for Binding Arbitration, Class Action Waivers, Automatic 12-Month Renewals, and Perpetual Content Licensing.
2. **[`sample_privacy_policy.txt`](sample_privacy_policy.txt)**: A mock privacy statement with extreme terms concerning Real-Time Location Tracking, Indefinite Data Retention, and Third-Party Data Broker Selling.

## 🚶 How to run a test:
1. Open any of these `.txt` files.
2. Select and copy all the text.
3. Paste it into the **Paste Text** section on the LexGuard Web Application or scan the file in the browser using the Chrome Extension!
4. Check that the Risk Score gauge successfully evaluates to **High Risk** (typically 75 - 90 index points) and lists the plain-English translation cards!
