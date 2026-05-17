const test = require('node:test');
const assert = require('node:assert');
const fetchUrl = require('../api/fetch-url.js');

test('Serverless API responds with error on invalid action', async () => {
  const req = {
    method: 'POST',
    body: { action: 'invalid-action' }
  };
  
  let statusCode = 0;
  let jsonResult = null;
  
  const res = {
    setHeader: () => {},
    status: (code) => {
      statusCode = code;
      return res;
    },
    json: (data) => {
      jsonResult = data;
    }
  };
  
  // Set fake env so it doesn't fail early on credentials
  process.env.GCP_PROJECT_ID = 'test';
  process.env.GCP_CLIENT_EMAIL = 'test@test.com';
  process.env.GCP_PRIVATE_KEY = '-----BEGIN PRIVATE KEY-----\ntest\n-----END PRIVATE KEY-----\n';
  
  await fetchUrl(req, res);
  
  assert.strictEqual(statusCode, 400);
  assert.strictEqual(jsonResult.error, 'Invalid action');
});
