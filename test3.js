const http = require('https');
const data = JSON.stringify({
  model: 'deepseek-ai/deepseek-v3.2',
  messages: [{ role: 'user', content: 'Say hello in json' }],
  stream: true
});

const options = {
  hostname: 'integrate.api.nvidia.com',
  path: '/v1/chat/completions',
  method: 'POST',
  headers: {
    'Authorization': 'Bearer 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',
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, res => {
  res.on('data', d => process.stdout.write(d));
});

req.on('error', error => console.error(error));
req.write(data);
req.end();
