const GroqService = require('./groq.service');
const PriceService = require('./price.service');

class MedicineService {
  constructor(groqService = new GroqService(), priceService = new PriceService()) {
    this.groqService = groqService;
    this.priceService = priceService;
  }

  async getMedicineInfo(medicineName, userAllergies = []) {
    const hasAllergies = userAllergies && userAllergies.length > 0;
    // Step 1: Check local database first
    const localMatch = this.priceService.findByBrandName(medicineName);
    
    if (localMatch) {
      const alternatives = this.priceService.findAlternatives(
        localMatch.composition,
        localMatch.strength,
        localMatch.dosage_form,
        localMatch.brand_name
      ).map(alt => ({
        name: alt.brand_name,
        price: `₹${alt.price}`,
        manufacturer: alt.manufacturer,
        composition: alt.composition,
        strength: alt.strength
      }));

      // Fetch AI data for uses, side effects, and therapeutic alternatives
      try {
        const aiInfo = hasAllergies
          ? await this.groqService.extractMedicineInfoWithAllergies(localMatch.composition, userAllergies)
          : await this.groqService.extractMedicineInfo(localMatch.composition);
        const therapeuticAlts = await this.getTherapeuticAlternatives(aiInfo.therapeutic_alternatives || []);
        
        return {
          dataSource: 'local_database_with_ai',
          medicineInfo: {
            brand_name: localMatch.brand_name,
            composition: localMatch.composition,
            strength: localMatch.strength,
            dosage_form: localMatch.dosage_form,
            manufacturer: localMatch.manufacturer
          },
          uses: Array.isArray(aiInfo.common_uses) ? aiInfo.common_uses : [aiInfo.common_uses].filter(Boolean),
          sideEffects: aiInfo.common_side_effects || [],
          allergyWarning: aiInfo.allergy_warning || false,
          allergyDetails: aiInfo.allergy_details || null,
          alternatives,
          therapeuticAlternatives: therapeuticAlts,
          priceNote: null,
          confidenceScore: 0.95
        };
      } catch (error) {
        return {
          dataSource: 'local_database',
          medicineInfo: {
            brand_name: localMatch.brand_name,
            composition: localMatch.composition,
            strength: localMatch.strength,
            dosage_form: localMatch.dosage_form,
            manufacturer: localMatch.manufacturer
          },
          uses: [],
          sideEffects: [],
          allergyWarning: false,
          allergyDetails: null,
          alternatives,
          therapeuticAlternatives: [],
          priceNote: null,
          confidenceScore: 1.0
        };
      }
    }

    // Step 1.5: Check if it's a generic composition name
    const compositionMatch = this.priceService.findByComposition(medicineName);
    if (compositionMatch) {
      const alternatives = this.priceService.findAlternatives(
        compositionMatch.composition,
        compositionMatch.strength,
        compositionMatch.dosage_form,
        compositionMatch.brand_name
      ).map(alt => ({
        name: alt.brand_name,
        price: `₹${alt.price}`,
        manufacturer: alt.manufacturer,
        composition: alt.composition,
        strength: alt.strength
      }));

      // Fetch AI data for uses, side effects, and therapeutic alternatives
      try {
        const aiInfo = hasAllergies
          ? await this.groqService.extractMedicineInfoWithAllergies(compositionMatch.composition, userAllergies)
          : await this.groqService.extractMedicineInfo(compositionMatch.composition);
        const therapeuticAlts = await this.getTherapeuticAlternatives(aiInfo.therapeutic_alternatives || []);
        
        return {
          dataSource: 'local_database_with_ai',
          medicineInfo: {
            brand_name: compositionMatch.brand_name,
            composition: compositionMatch.composition,
            strength: compositionMatch.strength,
            dosage_form: compositionMatch.dosage_form,
            manufacturer: compositionMatch.manufacturer
          },
          uses: Array.isArray(aiInfo.common_uses) ? aiInfo.common_uses : [aiInfo.common_uses].filter(Boolean),
          sideEffects: aiInfo.common_side_effects || [],
          allergyWarning: aiInfo.allergy_warning || false,
          allergyDetails: aiInfo.allergy_details || null,
          alternatives,
          therapeuticAlternatives: therapeuticAlts,
          priceNote: null,
          confidenceScore: 0.9
        };
      } catch (error) {
        return {
          dataSource: 'local_database',
          medicineInfo: {
            brand_name: compositionMatch.brand_name,
            composition: compositionMatch.composition,
            strength: compositionMatch.strength,
            dosage_form: compositionMatch.dosage_form,
            manufacturer: compositionMatch.manufacturer
          },
          uses: [],
          sideEffects: [],
          allergyWarning: false,
          allergyDetails: null,
          alternatives,
          therapeuticAlternatives: [],
          priceNote: null,
          confidenceScore: 0.9
        };
      }
    }

    // Step 2: Use AI to extract info (with allergy awareness)
    const aiInfo = hasAllergies
      ? await this.groqService.extractMedicineInfoWithAllergies(medicineName, userAllergies)
      : await this.groqService.extractMedicineInfo(medicineName);

    // Check if strength is unknown
    if (!aiInfo.strength || aiInfo.strength.toUpperCase() === 'UNKNOWN' || aiInfo.strength.trim() === '') {
      return {
        clarificationRequired: 'Please specify strength (e.g., 500mg or 650mg).'
      };
    }

    // Check if composition is valid
    if (!aiInfo.composition || aiInfo.composition.trim() === '') {
      return {
        error: 'Medicine not recognized. Please check spelling or provide full name.',
        dataSource: 'unverified_input'
      };
    }

    // Check local DB for alternatives with extracted info
    const alternatives = this.priceService.findAlternatives(
      aiInfo.composition,
      aiInfo.strength,
      aiInfo.dosage_form
    ).map(alt => ({
      name: alt.brand_name,
      price: `₹${alt.price}`,
      manufacturer: alt.manufacturer,
      composition: alt.composition,
      strength: alt.strength
    }));

    // Get therapeutic alternatives
    const therapeuticAlts = await this.getTherapeuticAlternatives(aiInfo.therapeutic_alternatives || []);

    // Calculate confidence score
    const confidenceScore = this.calculateConfidence(aiInfo, alternatives, therapeuticAlts);

    const uses = Array.isArray(aiInfo.common_uses) ? aiInfo.common_uses : [aiInfo.common_uses].filter(Boolean);
    const sideEffects = aiInfo.common_side_effects || [];
    
    // If no local alternatives, use AI-suggested substitutes
    const aiSubstitutes = alternatives.length === 0 && aiInfo.substitute_medicines 
      ? (Array.isArray(aiInfo.substitute_medicines) 
          ? aiInfo.substitute_medicines.map(sub => ({
              name: typeof sub === 'string' ? sub : sub.name,
              price: typeof sub === 'object' && sub.approximate_price ? `₹${sub.approximate_price} (approx)` : 'Price not available',
              manufacturer: 'N/A',
              composition: aiInfo.composition,
              strength: aiInfo.strength,
              source: 'ai_suggested'
            }))
          : aiInfo.substitute_medicines.split(',').map(sub => ({
              name: sub.trim(),
              price: 'Price not available',
              manufacturer: 'N/A',
              composition: aiInfo.composition,
              strength: aiInfo.strength,
              source: 'ai_suggested'
            }))
        )
      : [];

    return {
      dataSource: alternatives.length > 0 ? 'ai_generated_with_local_price' : 'ai_generated_no_price_data',
      medicineInfo: {
        brand_name: aiInfo.brand_name,
        composition: aiInfo.composition,
        strength: aiInfo.strength,
        dosage_form: aiInfo.dosage_form
      },
      uses,
      sideEffects,
      allergyWarning: aiInfo.allergy_warning || false,
      allergyDetails: aiInfo.allergy_details || null,
      alternatives: alternatives.length > 0 ? alternatives : aiSubstitutes,
      therapeuticAlternatives: therapeuticAlts,
      priceNote: alternatives.length === 0 && aiSubstitutes.length > 0 ? 'Prices are approximate based on AI training data (may be outdated). Please verify current prices with pharmacist.' : alternatives.length === 0 ? 'No matching price data available in local database.' : null,
      confidenceScore
    };
  }

  async getTherapeuticAlternatives(therapeuticNames) {
    const results = [];
    for (const name of therapeuticNames.slice(0, 5)) {
      const match = this.priceService.findByComposition(name) || this.priceService.findByBrandName(name);
      if (match) {
        results.push({
          brand_name: match.brand_name,
          composition: match.composition,
          strength: match.strength,
          price: match.price,
          note: 'Treats similar conditions'
        });
      } else {
        results.push({
          composition: name,
          note: 'Therapeutic alternative (price not available)'
        });
      }
    }
    return results;
  }

  calculateConfidence(aiInfo, alternatives, therapeuticAlts) {
    let score = 0.6;

    if (aiInfo.strength && aiInfo.strength.trim() !== '') {
      score += 0.1;
    }

    if (aiInfo.dosage_form && aiInfo.dosage_form.trim() !== '') {
      score += 0.1;
    }

    const uses = Array.isArray(aiInfo.common_uses) ? aiInfo.common_uses : [aiInfo.common_uses].filter(Boolean);
    if (uses.length >= 3) {
      score += 0.05;
    }

    if (alternatives.length > 0) {
      score += 0.1;
    }

    if (therapeuticAlts.length > 0) {
      score += 0.05;
    }

    return parseFloat(Math.min(score, 1.0).toFixed(2));
  }
}

module.exports = MedicineService;
