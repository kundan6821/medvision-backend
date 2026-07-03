const validateMedicineName = (name) => {
  if (!name || typeof name !== 'string') {
    return { valid: false, error: 'Medicine name is required and must be a string' };
  }
  
  const trimmed = name.trim();
  if (trimmed.length === 0) {
    return { valid: false, error: 'Medicine name cannot be empty' };
  }
  
  if (trimmed.length > 100) {
    return { valid: false, error: 'Medicine name too long' };
  }
  
  return { valid: true, value: trimmed };
};

module.exports = { validateMedicineName };
