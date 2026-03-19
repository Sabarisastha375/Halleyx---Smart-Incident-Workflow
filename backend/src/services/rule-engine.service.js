/**
 * Rule Engine Service
 * Evaluates conditions dynamically against execution data
 */

class RuleEngine {
  /**
   * Evaluate a single condition string against provided data
   */
  evaluate(condition, data) {
    if (!condition || condition.trim().toUpperCase() === 'DEFAULT') {
      return { result: true, error: null };
    }

    try {
      const transformed = this._transformCondition(condition);
      const func = new Function(...Object.keys(data), `return (${transformed});`);
      const result = func(...Object.values(data));
      return { result: Boolean(result), error: null };
    } catch (err) {
      return { result: false, error: `Evaluation error: ${err.message}` };
    }
  }

  /**
   * Transform custom syntax to JS-evaluable expression
   */
  _transformCondition(condition) {
    let transformed = condition;

    // contains(field, "value") → field.includes("value")
    transformed = transformed.replace(
      /contains\((\w+),\s*['"](.+?)['"]\)/g,
      '(String($1).toLowerCase().includes("$2".toLowerCase()))'
    );

    // startsWith(field, "value") → field.startsWith("value")
    transformed = transformed.replace(
      /startsWith\((\w+),\s*['"](.+?)['"]\)/g,
      '(String($1).startsWith("$2"))'
    );

    // endsWith(field, "value") → field.endsWith("value")
    transformed = transformed.replace(
      /endsWith\((\w+),\s*['"](.+?)['"]\)/g,
      '(String($1).endsWith("$2"))'
    );

    // && → && , || → || (already valid JS)
    // == comparisons — wrap string values
    transformed = transformed.replace(/(\w+)\s*==\s*'([^']*)'/g, '(String($1) === "$2")');
    transformed = transformed.replace(/(\w+)\s*!=\s*'([^']*)'/g, '(String($1) !== "$2")');
    transformed = transformed.replace(/(\w+)\s*==\s*"([^"]*)"/g, '(String($1) === "$2")');
    transformed = transformed.replace(/(\w+)\s*!=\s*"([^"]*)"/g, '(String($1) !== "$2")');

    return transformed;
  }

  /**
   * Validate a condition string (check syntax without executing)
   */
  validate(condition) {
    if (!condition || condition.trim().toUpperCase() === 'DEFAULT') {
      return { valid: true, error: null };
    }

    // Mock data for validation
    const mockData = { amount: 100, severity: 'P1', region: 'US', status: 'open', priority: 'High' };

    try {
      const transformed = this._transformCondition(condition);
      new Function(...Object.keys(mockData), `return (${transformed});`);
      return { valid: true, error: null };
    } catch (err) {
      return { valid: false, error: err.message };
    }
  }

  /**
   * Evaluate all rules for a step and return the first matching rule
   */
  evaluateRules(rules, data) {
    const evaluations = [];
    let selectedRule = null;
    let defaultRule = null;

    // Sort by priority ascending
    const sorted = [...rules].sort((a, b) => a.priority - b.priority);

    for (const rule of sorted) {
      const isDefault = rule.condition.trim().toUpperCase() === 'DEFAULT' || rule.is_default;

      if (isDefault) {
        defaultRule = rule;
        evaluations.push({
          rule_id: rule._id?.toString(),
          condition: rule.condition,
          result: false, // will be set if selected
          error: null
        });
        continue;
      }

      const { result, error } = this.evaluate(rule.condition, data);
      evaluations.push({
        rule_id: rule._id?.toString(),
        condition: rule.condition,
        result,
        error
      });

      if (result && !selectedRule) {
        selectedRule = rule;
      }
    }

    // Use default if nothing matched
    if (!selectedRule && defaultRule) {
      selectedRule = defaultRule;
      const defEval = evaluations.find(e => e.condition === defaultRule.condition);
      if (defEval) defEval.result = true;
    }

    return { evaluations, selectedRule };
  }
}

module.exports = new RuleEngine();
