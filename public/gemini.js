const API_KEY = "AIzaSyCDsb-i1YZZbn5S3fWn0sKOxU2AW84JgCo";
const MODEL_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${API_KEY}`;

export async function analyzeText(text) {
  const prompt = `You are LexGuard, an AI legal contract analyzer. Analyze the following legal text. Return ONLY raw JSON, no markdown formatting, no backticks, no explanation. Just the JSON object. Return this exact structure: {"risk_score": <number 0-100>, "summary": "<2 sentence plain English summary>", "clauses": [{"text": "<clause text max 150 chars>", "category": "<Privacy|Financial|Employment|IP|Arbitration|Data Collection>", "severity": "<High|Medium|Low>", "explanation": "<2-3 sentence plain English explanation>"}]}. Legal text: ${text}`;

  const response = await fetch(MODEL_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.1,
        responseMimeType: "application/json"
      }
    })
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || "Failed to analyze text");
  }

  const result = await response.json();
  const rawText = result.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
  
  // Robust extraction of JSON object
  const firstBrace = rawText.indexOf('{');
  const lastBrace = rawText.lastIndexOf('}');
  if (firstBrace === -1) {
    throw new Error("No JSON in response");
  }
  const jsonStr = rawText.substring(firstBrace, lastBrace + 1);
  return JSON.parse(jsonStr);
}

export async function analyzePDF(base64String) {
  const base64Data = base64String.replace(/^data:application\/pdf;base64,/, '');
  const prompt = `You are LexGuard, an AI legal contract analyzer. Analyze the following legal contract PDF. Return ONLY raw JSON, no markdown formatting, no backticks, no explanation. Just the JSON object. Return this exact structure: {"risk_score": <number 0-100>, "summary": "<2 sentence plain English summary>", "clauses": [{"text": "<clause text max 150 chars>", "category": "<Privacy|Financial|Employment|IP|Arbitration|Data Collection>", "severity": "<High|Medium|Low>", "explanation": "<2-3 sentence plain English explanation>"}]}`;

  const response = await fetch(MODEL_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      contents: [{
        role: "user",
        parts: [
          { inline_data: { mime_type: 'application/pdf', data: base64Data } },
          { text: prompt }
        ]
      }],
      generationConfig: {
        temperature: 0.1,
        responseMimeType: "application/json"
      }
    })
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || "Failed to analyze PDF");
  }

  const result = await response.json();
  const rawText = result.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
  
  const firstBrace = rawText.indexOf('{');
  const lastBrace = rawText.lastIndexOf('}');
  if (firstBrace === -1) {
    throw new Error("No JSON in response");
  }
  const jsonStr = rawText.substring(firstBrace, lastBrace + 1);
  return JSON.parse(jsonStr);
}

export async function analyzeFromURL(extractedText) {
  return analyzeText(extractedText);
}
