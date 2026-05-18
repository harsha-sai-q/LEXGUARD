const fs = require('fs');
const path = require('path');
const vm = require('vm');

describe('Gemini Secure Router Integration Tests', () => {
  let fileContent;
  let sandbox;

  beforeEach(() => {
    // Read the actual file content
    const filePath = path.join(__dirname, '../public/gemini.js');
    fileContent = fs.readFileSync(filePath, 'utf8');

    // Create a sandbox to run browser-targeted code safely in Node environment
    sandbox = {
      Map: Map,
      console: console,
      fetch: jest.fn()
    };
    vm.createContext(sandbox);
  });

  test('Should NOT contain the exposed hardcoded Gemini API Key', () => {
    // Verify that the old exposed key is completely absent from the file
    const exposedKey = 'AIzaSyCDsb-i1YZZbn5S3fWn0sKOxU2AW84JgCo';
    expect(fileContent).not.toContain(exposedKey);
    // General check: No hardcoded raw API key values starting with AIzaSy should be assigned
    expect(fileContent).not.toMatch(/AIzaSy[A-Za-z0-9_-]{33}/);
  });

  test('analyzeText should make a POST request to secure backend /api/fetch-url', async () => {
    // Convert exports to ordinary functions so we can run them in vm context
    const codeToRun = fileContent
      .replace(/export async function/g, 'async function')
      .replace(/export function/g, 'function');

    // Mock successful response from the serverless function
    sandbox.fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        risk_score: 25,
        summary: 'Low risk mock contract',
        clauses: []
      })
    });

    vm.runInContext(codeToRun, sandbox);

    // Call the function inside sandbox
    const result = await sandbox.analyzeText('This is a test legal contract clause.');

    // Assert fetch was called with relative secure proxy
    expect(sandbox.fetch).toHaveBeenCalledTimes(1);
    const [calledUrl, calledOptions] = sandbox.fetch.mock.calls[0];

    expect(calledUrl).toBe('/api/fetch-url');
    expect(calledOptions.method).toBe('POST');
    expect(calledOptions.headers['Content-Type']).toBe('application/json');

    // Assert body contains correct serverless action and data payload
    const parsedBody = JSON.parse(calledOptions.body);
    expect(parsedBody.action).toBe('analyze');
    expect(parsedBody.text).toBe('This is a test legal contract clause.');

    expect(result.risk_score).toBe(25);
  });

  test('analyzePDF should make a POST request to secure backend /api/fetch-url', async () => {
    const codeToRun = fileContent
      .replace(/export async function/g, 'async function')
      .replace(/export function/g, 'function');

    sandbox.fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        risk_score: 80,
        summary: 'High risk PDF contract',
        clauses: [{ text: 'Exorbitant fees', category: 'Financial', severity: 'High', explanation: 'Too expensive' }]
      })
    });

    vm.runInContext(codeToRun, sandbox);

    const mockBase64 = 'data:application/pdf;base64,JVBERi0xLjQKJd...'
    const result = await sandbox.analyzePDF(mockBase64);

    expect(sandbox.fetch).toHaveBeenCalledTimes(1);
    const [calledUrl, calledOptions] = sandbox.fetch.mock.calls[0];

    expect(calledUrl).toBe('/api/fetch-url');
    expect(calledOptions.method).toBe('POST');

    const parsedBody = JSON.parse(calledOptions.body);
    expect(parsedBody.action).toBe('analyze-pdf');
    // It should have stripped the base64 prefix
    expect(parsedBody.data).toBe('JVBERi0xLjQKJd...');

    expect(result.risk_score).toBe(80);
    expect(result.clauses[0].category).toBe('Financial');
  });
});
