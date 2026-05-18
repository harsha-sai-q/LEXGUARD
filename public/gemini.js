// Efficiency Optimization: Simple LRU-style Local Cache
const analysisCache = new Map();

function getCacheKey(text) {
  // Use first 1000 and last 1000 chars as a fast pseudo-hash for long contracts
  if (text.length < 2000) return text;
  return text.substring(0, 1000) + text.substring(text.length - 1000);
}

export async function analyzeText(text) {
  const cacheKey = getCacheKey(text);
  if (analysisCache.has(cacheKey)) {
    return analysisCache.get(cacheKey);
  }

  // Securely call serverless proxy endpoint
  const response = await fetch('/api/fetch-url', {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      action: "analyze",
      text: text
    })
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || "Failed to analyze text");
  }

  const resultObj = await response.json();
  
  // Save to cache before returning
  analysisCache.set(cacheKey, resultObj);
  // Keep cache small (max 10 entries) to prevent memory leaks
  if (analysisCache.size > 10) {
    const firstKey = analysisCache.keys().next().value;
    analysisCache.delete(firstKey);
  }

  return resultObj;
}

export async function analyzePDF(base64String) {
  const base64Data = base64String.replace(/^data:application\/pdf;base64,/, '');

  // Securely call serverless proxy endpoint for PDF scanning
  const response = await fetch('/api/fetch-url', {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      action: "analyze-pdf",
      data: base64Data
    })
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || "Failed to analyze PDF");
  }

  return response.json();
}

export async function analyzeFromURL(extractedText) {
  return analyzeText(extractedText);
}
