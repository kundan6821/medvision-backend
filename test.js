const axios = require('axios');
(async () => {
  try {
    const response = await axios.post('https://integrate.api.nvidia.com/v1/chat/completions', {
      model: 'deepseek-ai/deepseek-v3.2',
      messages: [{ role: 'user', content: 'Say hello in json' }],
      temperature: 0.2,
      max_tokens: 100,
      chat_template_kwargs: { thinking: true }
    }, {
      headers: {
        'Authorization': 'Bearer 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',
        'Content-Type': 'application/json'
      }
    });
    console.log(response.data);
  } catch (error) {
    console.error(error.response ? error.response.data : error.message);
  }
})();
