/**
 * Input Schema Validator
 * Validates execution input data against workflow's inputSchema definition.
 */

/**
 * Validate input data against the workflow's input schema.
 * @param {Object} inputSchema - Workflow schema definition
 * @param {Object} data - User-provided execution data
 * @returns {{ valid: boolean, errors: string[] }}
 */
const validateInput = (inputSchema, data) => {
  const errors = [];

  if (!inputSchema || Object.keys(inputSchema).length === 0) {
    return { valid: true, errors: [] };
  }

  for (const [field, rules] of Object.entries(inputSchema)) {
    const value = data[field];

    // Check required fields
    if (rules.required && (value === undefined || value === null || value === '')) {
      errors.push(`Field '${field}' is required`);
      continue;
    }

    // Skip validation if field is not provided and not required
    if (value === undefined || value === null) continue;

    // Type validation
    if (rules.type) {
      const actualType = typeof value;
      const expectedType = rules.type.toLowerCase();

      if (expectedType === 'string' && actualType !== 'string') {
        errors.push(`Field '${field}' must be a string`);
      } else if (expectedType === 'number' && actualType !== 'number') {
        errors.push(`Field '${field}' must be a number`);
      } else if (expectedType === 'boolean' && actualType !== 'boolean') {
        errors.push(`Field '${field}' must be a boolean`);
      }
    }

    // Allowed values validation
    if (rules.allowed_values && Array.isArray(rules.allowed_values)) {
      if (!rules.allowed_values.includes(value)) {
        errors.push(
          `Field '${field}' must be one of: ${rules.allowed_values.join(', ')}`
        );
      }
    }

    // Min length
    if (rules.min_length && typeof value === 'string' && value.length < rules.min_length) {
      errors.push(`Field '${field}' must be at least ${rules.min_length} characters`);
    }

    // Max length
    if (rules.max_length && typeof value === 'string' && value.length > rules.max_length) {
      errors.push(`Field '${field}' cannot exceed ${rules.max_length} characters`);
    }
  }

  return { valid: errors.length === 0, errors };
};

module.exports = { validateInput };
