const medicinesDB = require('../database/medicines.mock.json');

class PriceService {
  findByBrandName(brandName) {
    const lower = brandName.toLowerCase();
    // 1. Exact match
    const exact = medicinesDB.find(med => med.brand_name.toLowerCase() === lower);
    if (exact) return exact;
    // 2. Partial match — DB entry contains the OCR name or vice versa
    return medicinesDB.find(med => {
      const dbName = med.brand_name.toLowerCase();
      return dbName.includes(lower) || lower.includes(dbName);
    }) || null;
  }

  findByComposition(composition) {
    return medicinesDB.find(med => 
      med.composition.toLowerCase() === composition.toLowerCase()
    );
  }

  findByCompositionStrengthForm(composition, strength, dosageForm) {
    return medicinesDB.find(med => 
      med.composition.toLowerCase() === composition.toLowerCase() &&
      med.strength.toLowerCase() === strength.toLowerCase() &&
      med.dosage_form.toLowerCase() === dosageForm.toLowerCase()
    );
  }

  findAlternatives(composition, strength, dosageForm, excludeBrandName = null) {
    const exact = medicinesDB.filter(med => 
      med.composition.toLowerCase() === composition.toLowerCase() &&
      med.strength.toLowerCase() === strength.toLowerCase() &&
      med.dosage_form.toLowerCase() === dosageForm.toLowerCase() &&
      (!excludeBrandName || med.brand_name.toLowerCase() !== excludeBrandName.toLowerCase())
    );

    if (exact.length > 0) return exact.sort((a, b) => a.price - b.price);

    const sameComp = medicinesDB.filter(med => 
      med.composition.toLowerCase() === composition.toLowerCase() &&
      med.dosage_form.toLowerCase() === dosageForm.toLowerCase() &&
      (!excludeBrandName || med.brand_name.toLowerCase() !== excludeBrandName.toLowerCase())
    );

    if (sameComp.length > 0) {
      return sameComp.sort((a, b) => a.price - b.price);
    }

    const mainIngredient = composition.split(/[+,]/)[0].trim().toLowerCase();
    const similarComp = medicinesDB.filter(med => 
      med.composition.toLowerCase().includes(mainIngredient) &&
      med.dosage_form.toLowerCase() === dosageForm.toLowerCase() &&
      (!excludeBrandName || med.brand_name.toLowerCase() !== excludeBrandName.toLowerCase())
    );

    return similarComp.sort((a, b) => a.price - b.price);
  }
}

module.exports = PriceService;
