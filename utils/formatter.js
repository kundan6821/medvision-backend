const formatMedicineResponse = (result) => {
  if (result.clarificationRequired) {
    return {
      clarification_required: result.clarificationRequired,
      disclaimer: 'This system provides informational purposes only. It does not provide medical advice.'
    };
  }

  if (result.error) {
    return {
      error: result.error,
      data_source: result.dataSource,
      disclaimer: 'This system provides informational purposes only. It does not provide medical advice.'
    };
  }

  const response = {
    metadata: {
      data_source: result.dataSource,
      confidence_score: result.confidenceScore,
      confidence_level: getConfidenceLevel(result.confidenceScore)
    },
    allergy_alert: {
      warning: result.allergyWarning || false,
      details: result.allergyDetails || null
    },
    medicine_info: result.medicineInfo,
    usage_information: {
      uses: result.uses,
      side_effects: result.sideEffects,
      general_dosage_note: 'Dosage depends on age, condition, and doctor recommendation.'
    },
    pricing_information: {
      alternatives_sorted_by_price: result.alternatives,
      therapeutic_alternatives: result.therapeuticAlternatives || []
    },
    disclaimer: 'This system provides informational purposes only. It does not provide medical advice.'
  };

  if (result.priceNote) {
    response.pricing_information.price_note = result.priceNote;
  }

  return response;
};

const getConfidenceLevel = (score) => {
  if (score >= 0.80) return 'High';
  if (score >= 0.50) return 'Medium';
  return 'Low';
};

const formatErrorResponse = (message) => {
  return {
    error: true,
    message,
    disclaimer: 'This system provides informational purposes only. It does not provide medical advice.'
  };
};

module.exports = { formatMedicineResponse, formatErrorResponse, getConfidenceLevel };
