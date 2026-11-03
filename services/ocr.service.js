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
        model: "mistralai/mistral-large-4-1t-a52b",
        messages: [
          {
            role: "system",
            content: "You are an OCR and pharmaceutical recognition engine. Output ONLY valid JSON in this exact structure: {\"name\": \"MedicineName\"}. Do not write explanations, sentences, or thoughts."
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Extract the exact brand name or active medicine name from this image. Output JSON only: {\"name\": \"MedicineName\"}"
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

      const nvidiaApiKey = process.env.NV_API_KEY || process.env.NVIDIA_TEXT_KEY || process.env.NVIDIA_API_KEY;
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
          },
          timeout: 45000
        }
      );

      const rawContent = response.data.choices[0].message.content || response.data.choices[0].message.reasoning_content || '';
      if (!rawContent) {
        throw new Error('NVIDIA Vision returned empty response.');
      }

      // 1. Try parsing JSON format: {"name": "..."}
      let medicineName = '';
      const jsonMatch = rawContent.match(/\{[\s\S]*?"name"\s*:\s*"([^"]+)"[\s\S]*?\}/);
      if (jsonMatch) {
        medicineName = jsonMatch[1].trim();
      } else {
        // 2. If model returned text with quoted brand name, e.g. 'clearly "Erytop"'
        const quotedMatch = rawContent.match(/"([A-Za-z0-9\-\+ ]{2,35})"/);
        if (quotedMatch && !quotedMatch[1].toLowerCase().includes('name') && !quotedMatch[1].toLowerCase().includes('image')) {
          medicineName = quotedMatch[1].trim();
        } else {
          // 3. Fallback: strip conversational explanations
          let cleaned = rawContent
            .replace(/The user wants.*?\. /gi, '')
            .replace(/Looking at the.*?brand name is (?:clearly )?/gi, '')
            .replace(/The brand name is (?:clearly )?/gi, '')
            .replace(/The medicine name is (?:clearly )?/gi, '')
            .replace(/^["'`]|["'`]$/g, '')
            .split(/[\n\.,]/)[0]
            .trim();
          medicineName = cleaned;
        }
      }

      // Remove any lingering quotes
      medicineName = medicineName.replace(/^["'`\s]+|["'`\s]+$/g, '').trim();

      if (!medicineName || medicineName.toUpperCase() === 'UNKNOWN') {
         throw new Error('NVIDIA Vision could not confidently decode a medicine name from this image.');
      }

      console.log(`[NVIDIA Vision] Detected: ${medicineName}`);

      return {
        fullText: "",
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