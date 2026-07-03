const axios = require('axios');
(async () => {
  try {
    const response = await axios.post('https://integrate.api.nvidia.com/v1/chat/completions', {
      model: 'deepseek-ai/deepseek-r1',
      messages: [{ role: 'user', content: 'Say hello in json' }],
      max_tokens: 50
    }, {
      headers: {
        'Authorization': 'Bearer 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',
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    console.log(response.data);
  } catch (error) {
    console.log('ERROR:', error.response ? error.response.data : error.message);
  }
})();
