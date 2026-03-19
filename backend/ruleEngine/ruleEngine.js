/**
 * Rule Engine
 * Evaluates conditions against execution data and selects the next step.
 * Supports operators: ==, !=, >, <, >=, <=, &&, ||
 * Supports functions: contains(), startsWith(), endsWith()
 */

/**
 * Safely evaluate a condition string against provided data.
 * @param {string} condition - The condition expression string
 * @param {Object} data - The execution data object
 * @returns {boolean} - Result of the condition evaluation
 */
const evaluateCondition = (condition, data) => {
  if (!condition || condition.trim().toUpperCase() === 'DEFAULT') {
    return true; // DEFAULT rule always matches
  }

  try {
    // Replace contains(field, value) function calls
    let processedCondition = condition.replace(
      /contains\(([^,]+),\s*([^)]+)\)/g,
      (match, field, value) => {
        const fieldValue = getFieldValue(field.trim(), data);
        const searchValue = value.trim().replace(/['"]/g, '');
        return `"${String(fieldValue || '')}".toLowerCase().includes("${searchValue.toLowerCase()}")`;
      }
    );

    // Replace startsWith(field, value)
    processedCondition = processedCondition.replace(
      /startsWith\(([^,]+),\s*([^)]+)\)/g,
      (match, field, value) => {
        const fieldValue = getFieldValue(field.trim(), data);
        const searchValue = value.trim().replace(/['"]/g, '');
        return `"${String(fieldValue || '')}".toLowerCase().startsWith("${searchValue.toLowerCase()}")`;
      }
    );

    // Replace endsWith(field, value)
    processedCondition = processedCondition.replace(
      /endsWith\(([^,]+),\s*([^)]+)\)/g,
      (match, field, value) => {
        const fieldValue = getFieldValue(field.trim(), data);
        const searchValue = value.trim().replace(/['"]/g, '');
        return `"${String(fieldValue || '')}".toLowerCase().endsWith("${searchValue.toLowerCase()}")`;
      }
    );

    // Replace field references with their actual values
    processedCondition = processedCondition.replace(
      /\b([a-zA-Z_][a-zA-Z0-9_.]*)\b(?!\s*\()/g,
      (match) => {
        // Skip JavaScript keywords and boolean literals
        const keywords = [
          'true', 'false', 'null', 'undefined', 'and', 'or', 'not',
          'includes', 'startsWith', 'endsWith', 'toLowerCase',
        ];
        if (keywords.includes(match)) return match;

        const value = getFieldValue(match, data);
        if (value === undefined) return `undefined`;
        if (typeof value === 'string') return `"${value}"`;
        return String(value);
      }
    );

    // Evaluate the processed expression safely
    // eslint-disable-next-line no-new-func
    const result = new Function(`return (${processedCondition})`)();
    return Boolean(result);
  } catch (error) {
    console.error(`Rule evaluation error for condition "${condition}":`, error.message);
    return false;
  }
};

/**
 * Get nested field value from data object using dot notation.
 * @param {string} fieldPath - e.g., 'severity' or 'metadata.severity'
 * @param {Object} data - The execution data
 * @returns {*} - The field value
 */
const getFieldValue = (fieldPath, data) => {
  const parts = fieldPath.split('.');
  let current = data;
  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    current = current[part];
  }
  return current;
};

/**
 * Evaluate all rules for a step and return the matched rule.
 * Rules are evaluated in ascending priority order.
 * The first matching rule wins.
 * @param {Array} rules - Array of Rule documents sorted by priority
 * @param {Object} data - Execution data
 * @returns {{ matchedRule: Object|null, evaluationResults: Array }}
 */
const evaluateRules = (rules, data) => {
  const evaluationResults = [];
  let matchedRule = null;
  let defaultRule = null;

  // Sort by priority ascending
  const sortedRules = [...rules].sort((a, b) => a.priority - b.priority);

  for (const rule of sortedRules) {
    const isDefault = rule.isDefault || rule.condition.trim().toUpperCase() === 'DEFAULT';

    if (isDefault) {
      defaultRule = rule;
      evaluationResults.push({
        ruleId: rule._id,
        condition: rule.condition,
        priority: rule.priority,
        result: false, // Will set to true only if selected
        isDefault: true,
      });
      continue;
    }

    const result = evaluateCondition(rule.condition, data);
    evaluationResults.push({
      ruleId: rule._id,
      condition: rule.condition,
      priority: rule.priority,
      result,
      isDefault: false,
    });

    if (result && !matchedRule) {
      matchedRule = rule;
    }
  }

  // If no rule matched, fall back to DEFAULT
  if (!matchedRule && defaultRule) {
    matchedRule = defaultRule;
    // Update the evaluation result for default to show it was selected
    const defaultResult = evaluationResults.find((r) => r.isDefault);
    if (defaultResult) defaultResult.result = true;
  }

  return { matchedRule, evaluationResults };
};

module.exports = { evaluateCondition, evaluateRules, getFieldValue };
