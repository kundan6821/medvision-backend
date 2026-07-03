const fs = require('fs');
const path = require('path');
const axios = require('axios');

class OCRService {
  async extractTextFromImage(imagePath) {
    try {
      // 1. Read the image and map to Base64
      const imageBuffer = fs.readFileSync(imagePath);
      const base64Image = imageBuffer.toString('base64');
      const ext = path.extname(imagePath).toLowerCase().replace('.', '');
      const mimeType = ext === 'png' ? 'image/png' : 'image/jpeg';
      
      const payload = {
        model: "meta/llama-3.2-90b-vision-instruct",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "You are an expert pharmaceutical vision engine. Analyze this image of a medicine container (bottle, packet, blister pack). Identify and return ONLY the fundamental brand name or primary active ingredient. Do not include dosage (like 500mg), manufacturer paths, expiry dates, or conversation formatting. Just return the raw medicine name. If it is illegible, return exactly: UNKNOWN"
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType};base64,${base64Image}`
                }
              }
            ]
          }
        ],
        max_tokens: 50,
        temperature: 0.00
      };

      const nvidiaApiKey = process.env.NV_API_KEY;
      if (!nvidiaApiKey) {
        throw new Error("NV_API_KEY environment variable is missing.");
      }

      const response = await axios.post(
        'https://integrate.api.nvidia.com/v1/chat/completions',
        payload,
        {
          headers: {
            'Authorization': `Bearer ${nvidiaApiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const rawContent = response.data.choices[0].message.content;
      const medicineName = rawContent.trim().replace(/^"|"$/g, '').replace(/\.$/, ''); // Clean up any quotes or trailing periods
      
      if (!medicineName || medicineName === 'UNKNOWN') {
         throw new Error('NVIDIA Vision could not confidently decode a medicine name from this image.');
      }

      console.log(`[NVIDIA Vision] Detected: ${medicineName}`);

      return {
        fullText: "NVIDIA Vision Multimodal Evaluation",
        medicineName: medicineName,
        confidence: 99
      };
      
    } catch (error) {
       console.error("[NVIDIA Vision Error]", error.response?.data || error.message);
       // Throw error back to medicine controller to display visually
       throw new Error(`Cloud Vision OCR failed: ${error.response?.data?.detail || error.message}`);
    }
  }
}

module.exports = OCRService;