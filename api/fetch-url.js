const { GoogleAuth } = require('google-auth-library');
const fetch = require('node-fetch');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  
  // Diagnostic endpoint to check env var format (GET)
  if (req.method === 'GET') {
    const raw = process.env.GCP_PRIVATE_KEY || '';
    const geminiKey = process.env.GEMINI_API_KEY || '';
    return res.status(200).json({
      project_id_set: !!process.env.GCP_PROJECT_ID,
      client_email_set: !!process.env.GCP_CLIENT_EMAIL,
      private_key_set: !!process.env.GCP_PRIVATE_KEY,
      gemini_api_key_set: !!process.env.GEMINI_API_KEY,
      gemini_api_key_prefix: geminiKey ? geminiKey.substring(0, 7) : '',
      gemini_api_key_suffix: geminiKey ? geminiKey.substring(geminiKey.length - 5) : '',
      private_key_length: raw.length,
      private_key_first_50: raw.substring(0, 50),
      private_key_has_begin: raw.includes('-----BEGIN'),
      private_key_has_real_newlines: raw.includes('\n'),
      private_key_has_escaped_newlines: raw.includes('\\n'),
    });
  }
  
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { action, text, data, url } = req.body;
  
  // Read Vertex AI Service Account credentials from Environment Variables
  const projectId = process.env.GCP_PROJECT_ID;
  const clientEmail = process.env.GCP_CLIENT_EMAIL;
  // Vercel mangles private keys in many ways - aggressively fix all known issues
  let privateKey = undefined;
  if (process.env.GCP_PRIVATE_KEY) {
    privateKey = process.env.GCP_PRIVATE_KEY;
    // Remove surrounding quotes if Vercel added them
    if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
      privateKey = privateKey.slice(1, -1);
    }
    // Replace all forms of escaped newlines with real newlines
    privateKey = privateKey.replace(/\\\\n/g, '\n').replace(/\\n/g, '\n');
    // Ensure proper PEM format
    if (!privateKey.includes('-----BEGIN')) {
      privateKey = `-----BEGIN PRIVATE KEY-----\n${privateKey}\n-----END PRIVATE KEY-----\n`;
    }
    console.log('Private key starts with:', privateKey.substring(0, 40));
    console.log('Private key length:', privateKey.length);
  }

  if (!projectId || !clientEmail || !privateKey) {
    return res.status(500).json({ error: 'GCP credentials not fully configured in Vercel (GCP_PROJECT_ID, GCP_CLIENT_EMAIL, GCP_PRIVATE_KEY)' });
  }

  if (action === 'analyze' || action === 'analyze-pdf') {
    const prompt = `You are LexGuard, an AI legal contract analyzer. Analyze the following legal text. Return ONLY raw JSON, no markdown formatting, no backticks, no explanation. Just the JSON object. Return this exact structure: {"risk_score": <number 0-100>, "summary": "<2 sentence plain English summary>", "clauses": [{"text": "<clause text max 150 chars>", "category": "<Privacy|Financial|Employment|IP|Arbitration|Data Collection>", "severity": "<High|Medium|Low>", "explanation": "<2-3 sentence plain English explanation>"}]}. Legal text: ${action === 'analyze' ? text : 'Analyze this PDF document'}`;

    const body = JSON.stringify({
      contents: action === 'analyze'
        ? [{ role: "user", parts: [{ text: prompt }] }]
        : [{ role: "user", parts: [{ inline_data: { mime_type: 'application/pdf', data } }, { text: prompt }] }],
      generation_config: { temperature: 0.1 }
    });

    try {
      let endpoint;
      let headers = { 'Content-Type': 'application/json' };

      if (process.env.GEMINI_API_KEY) {
        // Securely use the standard Gemini API key on the backend
        // This gives us the full 15 requests/min free tier, which is perfect for extension usage!
        endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${process.env.GEMINI_API_KEY}`;
      } else {
        // Fallback to Service Account OAuth
        const auth = new GoogleAuth({
          credentials: {
            client_email: clientEmail,
            private_key: privateKey,
          },
          scopes: [
            'https://www.googleapis.com/auth/cloud-platform',
            'https://www.googleapis.com/auth/generative-language',
            'https://www.googleapis.com/auth/generative-language.retriever',
          ],
          projectId: projectId
        });

        const client = await auth.getClient();
        const accessToken = (await client.getAccessToken()).token;
        endpoint = `https://us-central1-aiplatform.googleapis.com/v1/projects/${projectId}/locations/us-central1/publishers/google/models/gemini-1.5-flash:generateContent`;
        headers['Authorization'] = `Bearer ${accessToken}`;
      }

      // 3. Make the API Call
      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body
      });

      if (!response.ok) {
         const errData = await response.json().catch(() => ({}));
         return res.status(response.status).json({ error: 'Vertex API error', details: errData });
      }

      const result = await response.json();
      console.log('Full Vertex AI response:', JSON.stringify(result));

      if (result.error) return res.status(200).json({ error: result.error.message, raw: result });
      if (!result.candidates || result.candidates.length === 0) return res.status(200).json({ error: 'No candidates', raw: result });
      
      const rawText = result.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
      console.log('Raw text:', rawText);
      const firstBrace = rawText.indexOf('{');
      const lastBrace = rawText.lastIndexOf('}');
      if (firstBrace === -1) return res.status(200).json({ error: 'No JSON in response', raw: rawText });
      
      const jsonStr = rawText.substring(firstBrace, lastBrace + 1);
      return res.status(200).json(JSON.parse(jsonStr));
    } catch (e) {
      console.error('Server error:', e);
      return res.status(500).json({ error: 'Internal server error', message: e.message });
    }
  }

  // URL fetching is handled entirely client-side via proxy now.
  if (action === 'fetch-url' || url) {
    return res.status(200).json({ text: 'URL fetching handled client-side' });
  }

  return res.status(400).json({ error: 'Invalid action' });
};
