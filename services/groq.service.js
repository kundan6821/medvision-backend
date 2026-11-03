const axios = require('axios');

class GroqService {
  constructor(apiKey = process.env.NV_API_KEY || process.env.NVIDIA_TEXT_KEY || process.env.NVIDIA_API_KEY) {
    this.apiKey = apiKey;
    this.baseURL = 'https://integrate.api.nvidia.com/v1/chat/completions';
    this.model = 'nvidia/nemotron-3.5-bolt-e4b';
  }

  async extractMedicineInfo(medicineName) {
    if (!this.apiKey) {
      throw new Error("NV_API_KEY environment variable is missing on server.");
    }
    const prompt = this._buildPrompt(medicineName);
    try {
      const response = await this._callAPI(prompt, this._standardSystemPrompt());
      const content = response.data.choices[0].message.content;
      return this.parseJSON(content);
    } catch (error) {
      throw new Error(`NVIDIA API error: ${error.response?.data?.detail || error.response?.data?.error?.message || error.message}`);
    }
  }

  async extractMedicineInfoWithAllergies(medicineName, allergies = []) {
    if (!this.apiKey) {
      throw new Error("NV_API_KEY environment variable is missing on server.");
    }
    if (!allergies || allergies.length === 0) {
      return this.extractMedicineInfo(medicineName);
    }
    const allergyList = allergies.join(', ');
    const prompt = this._buildAllergyPrompt(medicineName, allergyList);
    try {
      const response = await this._callAPI(prompt, this._allergySystemPrompt(allergyList));
      const content = response.data.choices[0].message.content;
      return this.parseJSON(content);
    } catch (error) {
      throw new Error(`NVIDIA API error: ${error.response?.data?.detail || error.response?.data?.error?.message || error.message}`);
    }
  }

  _buildPrompt(medicineName) {
    return `You are a pharmaceutical data extraction engine.

Extract the following from the medicine name "${medicineName}":
- brand_name, composition, strength, dosage_form
- common_uses (at least 3)
- common_side_effects (at least 5, include SEVERE side effects)
- therapeutic_alternatives (3-5 different composition medicines for same conditions)
- substitute_medicines (3-5 same composition brand alternatives with INR prices)

Rules:
1. Never return empty fields.
2. If brand name unknown, return "Generic {composition}".
3. If dosage form unknown, assume "Tablet".
4. Return valid JSON only. No explanations.
5. Set allergy_warning: false, allergy_details: null.

JSON format:
{
  "brand_name": "",
  "composition": "",
  "strength": "",
  "dosage_form": "",
  "common_uses": [],
  "common_side_effects": [],
  "allergy_warning": false,
  "allergy_details": null,
  "therapeutic_alternatives": [],
  "substitute_medicines": [{"name": "Medicine Name", "approximate_price": 100, "allergy_safe": true}]
}`;
  }

  _buildAllergyPrompt(medicineName, allergyList) {
    return `You are a pharmaceutical data extraction engine with patient safety focus.

⚠️ CRITICAL PATIENT ALLERGY PROFILE:
This patient is allergic to: ${allergyList}

Extract info for medicine "${medicineName}" while checking allergies.

Rules:
1. Check if any ingredient or drug family of "${medicineName}" conflicts with the patient's allergies.
2. Set "allergy_warning": true if ANY allergy risk exists.
3. "allergy_details": clear explanation like "⚠️ Contains Penicillin which you are allergic to. Consult doctor before taking." OR if safe: "✅ This medicine appears safe based on your allergy profile."
4. In substitute_medicines: mark each "allergy_safe: true/false". Put safe ones FIRST.
5. Return valid JSON only.

JSON format:
{
  "brand_name": "",
  "composition": "",
  "strength": "",
  "dosage_form": "",
  "common_uses": [],
  "common_side_effects": [],
  "allergy_warning": false,
  "allergy_details": "",
  "therapeutic_alternatives": [],
  "substitute_medicines": [{"name": "Medicine Name", "approximate_price": 100, "allergy_safe": true}]
}`;
  }

  _standardSystemPrompt() {
    return 'You are a pharmaceutical data extraction engine. Return only valid JSON. Never return empty fields. Include at least 5 side effects (common + severe). substitute_medicines must include "allergy_safe: true" for all entries.';
  }

  _allergySystemPrompt(allergyList) {
    return `You are a pharmaceutical safety engine. Patient allergies: ${allergyList}. Check for conflicts. Set allergy_warning: true if conflict exists. Mark each substitute with allergy_safe: true/false. Safe alternatives go first. Return only valid JSON.`;
  }

  async _callAPI(prompt, systemPrompt) {
    return axios.post(
      this.baseURL,
      {
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: 0.2,
        max_tokens: 1400
      },
      {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );
  }

  parseJSON(content) {
    try {
      // Strip markdown code blocks if present
      const stripped = content.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
      const jsonMatch = stripped.match(/\{[\s\S]*\}/);
      if (jsonMatch) return JSON.parse(jsonMatch[0]);
      return JSON.parse(stripped);
    } catch (error) {
      throw new Error('Failed to parse LLM response');
    }
  }
}

module.exports = GroqService;
