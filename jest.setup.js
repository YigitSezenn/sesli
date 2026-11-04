const https = require('https');
const http = require('http');

require('react-native');

// React Native's Jest fetch never settles, and undici's body stream stalls here.
// Catalog tests still call the real LibriVox URLs over HTTPS.
global.fetch = (url) =>
  new Promise((resolve, reject) => {
    const target = new URL(String(url));
    const lib = target.protocol === 'https:' ? https : http;
    const agent = new lib.Agent({ keepAlive: false });
    const req = lib.get(
      target,
      {
        agent,
        headers: { accept: 'application/json', 'user-agent': 'Sesli/1.0 (personal audiobook; public LibriVox API)' },
      },
      (response) => {
        const chunks = [];
        response.on('data', (chunk) => chunks.push(chunk));
        response.on('end', () => {
          const text = Buffer.concat(chunks).toString('utf8');
          const status = response.statusCode || 0;
          resolve({
            ok: status >= 200 && status < 300,
            status,
            json: async () => JSON.parse(text),
            text: async () => text,
          });
        });
      },
    );
    req.on('error', reject);
  });

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
