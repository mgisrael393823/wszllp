#!/usr/bin/env node

/**
 * Accessibility Audit Tool
 * 
 * This script performs accessibility audits on React components in the project
 * to identify potential accessibility issues and provide recommendations.
 * 
 * Usage:
 *   node scripts/accessibility-audit.js
 * 
 * Options:
 *   --src       Source directory to analyze (default: src/components)
 *   --output    Output file for the report (default: reports/accessibility-audit.json)
 *   --html      Generate HTML report (default: reports/accessibility-audit.html)
 *   --verbose   Display detailed output during analysis
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const chalk = require('chalk');

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  src: 'src/components',
  output: 'reports/accessibility-audit.json',
  html: 'reports/accessibility-audit.html',
  verbose: false
};

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--src' && args[i + 1]) {
    options.src = args[i + 1];
    i++;
  } else if (args[i] === '--output' && args[i + 1]) {
    options.output = args[i + 1];
    i++;
  } else if (args[i] === '--html' && args[i + 1]) {
    options.html = args[i + 1];
    i++;
  } else if (args[i] === '--verbose') {
    options.verbose = true;
  }
}

// Accessibility rules to check
const accessibilityRules = {
  // Semantic HTML
  'semantic-element-usage': {
    description: 'Uses semantic HTML elements',
    severity: 'high',
    check: (code) => {
      // Check for common semantic elements
      const semanticElements = [
        'button', 'a', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'main', 'nav', 'article', 'section', 'header', 'footer',
        'aside', 'figure', 'figcaption', 'time', 'address'
      ];
      
      const usedSemanticElements = semanticElements.filter(element => 
        new RegExp(`<${element}[\\s>]`).test(code)
      );
      
      return {
        pass: usedSemanticElements.length > 0,
        elements: usedSemanticElements
      };
    }
  },
  
  // ARIA attributes
  'aria-usage': {
    description: 'Uses ARIA attributes correctly',
    severity: 'high',
    check: (code) => {
      const ariaAttributes = [
        'aria-label', 'aria-labelledby', 'aria-describedby',
        'aria-hidden', 'aria-expanded', 'aria-controls',
        'aria-selected', 'aria-checked', 'aria-pressed',
        'aria-current', 'aria-disabled', 'aria-invalid',
        'aria-required', 'aria-haspopup', 'aria-level',
        'aria-multiselectable', 'aria-orientation', 'aria-valuemax',
        'aria-valuemin', 'aria-valuenow', 'aria-valuetext',
        'aria-busy', 'aria-live', 'aria-atomic', 'aria-relevant'
      ];
      
      const usedAriaAttributes = ariaAttributes.filter(attr => 
        new RegExp(`${attr}[\\s=]`).test(code)
      );
      
      return {
        pass: usedAriaAttributes.length > 0,
        attributes: usedAriaAttributes
      };
    }
  },
  
  // Role attributes
  'role-usage': {
    description: 'Uses role attributes for custom elements',
    severity: 'medium',
    check: (code) => {
      const hasRoleAttribute = /role[\s]*=[\s]*["']([^"']*)["']/.test(code);
      const roles = code.match(/role[\s]*=[\s]*["']([^"']*)["']/g) || [];
      
      return {
        pass: hasRoleAttribute,
        roles: roles.map(role => {
          const match = role.match(/role[\s]*=[\s]*["']([^"']*)["']/);
          return match ? match[1] : '';
        }).filter(Boolean)
      };
    }
  },
  
  // Keyboard event handlers
  'keyboard-events': {
    description: 'Implements keyboard event handlers',
    severity: 'high',
    check: (code) => {
      const keyboardEvents = [
        'onKeyDown', 'onKeyUp', 'onKeyPress'
      ];
      
      const usedKeyboardEvents = keyboardEvents.filter(event => 
        new RegExp(event).test(code)
      );
      
      return {
        pass: usedKeyboardEvents.length > 0,
        events: usedKeyboardEvents
      };
    }
  },
  
  // Focus management
  'focus-management': {
    description: 'Manages focus state properly',
    severity: 'high',
    check: (code) => {
      const focusPatterns = [
        'focus', 'useRef', 'createRef', 'tabIndex', 'tabindex',
        'autoFocus', 'autofocus', 'getFocus', 'onFocus', 'onBlur'
      ];
      
      const matchedPatterns = focusPatterns.filter(pattern => 
        new RegExp(pattern).test(code)
      );
      
      return {
        pass: matchedPatterns.length > 0,
        patterns: matchedPatterns
      };
    }
  },
  
  // Image alt text
  'image-alt-text': {
    description: 'Provides alt text for images',
    severity: 'high',
    check: (code) => {
      const hasImageTags = /<img[^>]*>/.test(code);
      const hasAltAttributes = /<img[^>]*alt=["'][^"']*["'][^>]*>/.test(code);
      
      // Detect empty alt attributes
      const emptyAlt = /<img[^>]*alt=[""]["'][^>]*>/.test(code);
      
      return {
        pass: !hasImageTags || (hasAltAttributes && !emptyAlt),
        hasImages: hasImageTags,
        hasAltAttributes: hasAltAttributes,
        hasEmptyAlt: emptyAlt
      };
    }
  },
  
  // Color contrast checks
  'color-references': {
    description: 'Check for potential color contrast issues',
    severity: 'medium',
    check: (code) => {
      // Look for color-related classes that might have contrast issues
      const lowContrastPatterns = [
        'text-gray-300', 'text-gray-200', 'text-gray-100',
        'text-white bg-gray-100', 'text-white bg-gray-200',
        'text-black bg-gray-700', 'text-black bg-gray-800',
        'opacity-50', 'opacity-40', 'opacity-30'
      ];
      
      const potentialIssues = lowContrastPatterns.filter(pattern => 
        code.includes(pattern)
      );
      
      return {
        pass: potentialIssues.length === 0,
        issues: potentialIssues
      };
    }
  },
  
  // Color-only information
  'color-only-info': {
    description: 'Avoid information conveyed only through color',
    severity: 'medium',
    check: (code) => {
      // Look for patterns that might indicate color-only feedback
      const colorOnlyPatterns = [
        'isValid ? "text-green" : "text-red"',
        'isError ? "text-red" : ""',
        'isSuccess ? "text-green" : ""',
        'status === "error" ? "red" : status === "success" ? "green" : ""'
      ];
      
      const potentialIssues = colorOnlyPatterns.filter(pattern => 
        code.includes(pattern)
      );
      
      return {
        pass: potentialIssues.length === 0,
        issues: potentialIssues
      };
    }
  },
  
  // Form label associations
  'form-labels': {
    description: 'Form controls have associated labels',
    severity: 'high',
    check: (code) => {
      const hasFormControls = /(<input|<select|<textarea)/.test(code);
      const hasFormLabels = /<label/.test(code);
      const hasHtmlFor = /htmlFor=/.test(code);
      const hasForAttribute = /for=/.test(code);
      
      return {
        pass: !hasFormControls || (hasFormLabels && (hasHtmlFor || hasForAttribute)),
        hasFormControls: hasFormControls,
        hasFormLabels: hasFormLabels,
        hasForAssociation: hasHtmlFor || hasForAttribute
      };
    }
  },
  
  // Error announcement
  'error-announcement': {
    description: 'Errors are properly announced to screen readers',
    severity: 'high',
    check: (code) => {
      const errorPatterns = [
        'aria-invalid', 'aria-errormessage', 'aria-describedby',
        'role="alert"', 'error message', 'validation error'
      ];
      
      const matchedPatterns = errorPatterns.filter(pattern => 
        new RegExp(pattern, 'i').test(code)
      );
      
      return {
        pass: matchedPatterns.length > 0,
        patterns: matchedPatterns
      };
    }
  }
};

// Initialize results object
const results = {
  summary: {
    totalComponents: 0,
    componentsWithIssues: 0,
    issuesBySeverity: {
      high: 0,
      medium: 0,
      low: 0
    },
    ruleViolations: {}
  },
  components: []
};

// Initialize rule violations counts
Object.keys(accessibilityRules).forEach(rule => {
  results.summary.ruleViolations[rule] = {
    count: 0,
    description: accessibilityRules[rule].description,
    severity: accessibilityRules[rule].severity
  };
});

/**
 * Analyze a single component file for accessibility
 */
function analyzeComponentFile(filePath) {
  const relativePath = path.relative(process.cwd(), filePath);
  if (options.verbose) {
    console.log(chalk.blue(`Analyzing ${relativePath}...`));
  }

  try {
    const code = fs.readFileSync(filePath, 'utf8');
    const componentName = path.basename(filePath, path.extname(filePath));
    
    const componentResult = {
      name: componentName,
      path: relativePath,
      issues: [],
      passedRules: [],
      score: 100
    };
    
    // Apply each accessibility rule
    for (const [ruleId, rule] of Object.entries(accessibilityRules)) {
      const result = rule.check(code);
      
      if (!result.pass) {
        componentResult.issues.push({
          rule: ruleId,
          description: rule.description,
          severity: rule.severity,
          details: result
        });
        
        // Update summary counts
        results.summary.ruleViolations[ruleId].count++;
        results.summary.issuesBySeverity[rule.severity]++;
      } else {
        componentResult.passedRules.push(ruleId);
      }
    }
    
    // Calculate accessibility score (very simplified)
    if (componentResult.issues.length > 0) {
      // Reduce score based on severity of issues
      const severityWeights = { high: 25, medium: 15, low: 5 };
      const totalPenalty = componentResult.issues.reduce((total, issue) => {
        return total + severityWeights[issue.severity];
      }, 0);
      
      componentResult.score = Math.max(0, 100 - totalPenalty);
      results.summary.componentsWithIssues++;
    }
    
    results.components.push(componentResult);
    results.summary.totalComponents++;
    
  } catch (error) {
    console.error(chalk.red(`Error analyzing ${relativePath}:`), error);
  }
}

/**
 * Generate HTML report
 */
function generateHtmlReport() {
  let html = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Accessibility Audit Report</title>
    <style>
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
        line-height: 1.6;
        color: #333;
        max-width: 1200px;
        margin: 0 auto;
        padding: 20px;
      }
      h1, h2, h3, h4 {
        color: #2563eb;
      }
      .summary {
        background-color: #f8fafc;
        border-radius: 8px;
        padding: 20px;
        margin-bottom: 30px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      }
      .metrics {
        display: flex;
        flex-wrap: wrap;
        gap: 20px;
        margin-bottom: 20px;
      }
      .metric {
        background-color: white;
        border-radius: 8px;
        padding: 15px;
        min-width: 150px;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
      }
      .metric-value {
        font-size: 24px;
        font-weight: 600;
        margin-bottom: 5px;
      }
      .metric-label {
        font-size: 14px;
        color: #64748b;
      }
      .rule-violation {
        margin-bottom: 10px;
      }
      .rule-violation h3 {
        margin-bottom: 5px;
      }
      .high {
        color: #dc2626;
      }
      .medium {
        color: #eab308;
      }
      .low {
        color: #3b82f6;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 30px;
      }
      th, td {
        padding: 10px;
        text-align: left;
        border-bottom: 1px solid #e2e8f0;
      }
      th {
        background-color: #f8fafc;
        font-weight: 600;
      }
      .component-row {
        cursor: pointer;
      }
      .component-row:hover {
        background-color: #f1f5f9;
      }
      .component-details {
        display: none;
        padding: 15px;
        background-color: #f8fafc;
        border-radius: 8px;
        margin-top: 10px;
        margin-bottom: 20px;
      }
      .show {
        display: block;
      }
      .badge {
        display: inline-block;
        padding: 2px 8px;
        border-radius: 50px;
        font-size: 12px;
        font-weight: 500;
      }
      .badge-high {
        background-color: #fee2e2;
        color: #b91c1c;
      }
      .badge-medium {
        background-color: #fef3c7;
        color: #92400e;
      }
      .badge-low {
        background-color: #dbeafe;
        color: #1e40af;
      }
      .badge-success {
        background-color: #dcfce7;
        color: #166534;
      }
      .score-container {
        width: 50px;
        height: 50px;
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .score-text {
        position: absolute;
        font-weight: 600;
        font-size: 14px;
      }
      .progress-circle {
        transform: rotate(-90deg);
      }
      .progress-circle-bg {
        fill: none;
        stroke: #e2e8f0;
        stroke-width: 3;
      }
      .progress-circle-fill {
        fill: none;
        stroke-width: 3;
        stroke-linecap: round;
        transition: stroke-dasharray 0.3s;
      }
    </style>
  </head>
  <body>
    <h1>Accessibility Audit Report</h1>
    <p>Generated on ${new Date().toLocaleString()}</p>
    
    <div class="summary">
      <h2>Summary</h2>
      <div class="metrics">
        <div class="metric">
          <div class="metric-value">${results.summary.totalComponents}</div>
          <div class="metric-label">Total Components</div>
        </div>
        <div class="metric">
          <div class="metric-value">${results.summary.componentsWithIssues}</div>
          <div class="metric-label">Components with Issues</div>
        </div>
        <div class="metric">
          <div class="metric-value">${results.summary.issuesBySeverity.high}</div>
          <div class="metric-label">High Severity Issues</div>
        </div>
        <div class="metric">
          <div class="metric-value">${results.summary.issuesBySeverity.medium}</div>
          <div class="metric-label">Medium Severity Issues</div>
        </div>
        <div class="metric">
          <div class="metric-value">${results.summary.issuesBySeverity.low}</div>
          <div class="metric-label">Low Severity Issues</div>
        </div>
        <div class="metric">
          <div class="metric-value">${Math.round(
            (results.summary.totalComponents - results.summary.componentsWithIssues) / 
            results.summary.totalComponents * 100
          )}%</div>
          <div class="metric-label">Components Without Issues</div>
        </div>
      </div>
      
      <h3>Rule Violations</h3>
      <div>
  `;
  
  // Add rule violations summary
  Object.entries(results.summary.ruleViolations)
    .sort((a, b) => b[1].count - a[1].count) // Sort by violation count
    .forEach(([ruleId, rule]) => {
      if (rule.count > 0) {
        html += `
        <div class="rule-violation">
          <h4 class="${rule.severity}">${rule.description} (${ruleId})</h4>
          <p>Violated in ${rule.count} components</p>
        </div>
        `;
      }
    });
  
  html += `
      </div>
    </div>
    
    <h2>Component Analysis</h2>
    <table>
      <thead>
        <tr>
          <th>Component</th>
          <th>Accessibility Score</th>
          <th>Issues</th>
          <th>Severity</th>
        </tr>
      </thead>
      <tbody>
  `;
  
  // Sort components by score (ascending) and then by issue count (descending)
  results.components
    .sort((a, b) => {
      if (a.score !== b.score) {
        return a.score - b.score; // Lower scores first
      }
      return b.issues.length - a.issues.length; // More issues first if same score
    })
    .forEach((component, index) => {
      // Get highest severity issue
      let highestSeverity = 'success';
      if (component.issues.length > 0) {
        if (component.issues.some(issue => issue.severity === 'high')) {
          highestSeverity = 'high';
        } else if (component.issues.some(issue => issue.severity === 'medium')) {
          highestSeverity = 'medium';
        } else {
          highestSeverity = 'low';
        }
      }
      
      html += `
        <tr class="component-row" onclick="toggleDetails(${index})">
          <td>${component.name}</td>
          <td>
            <div class="score-container">
              <svg width="50" height="50" class="progress-circle">
                <circle cx="25" cy="25" r="20" class="progress-circle-bg" />
                <circle 
                  cx="25" 
                  cy="25" 
                  r="20" 
                  class="progress-circle-fill" 
                  style="
                    stroke-dasharray: ${component.score * 1.256} 126; 
                    stroke: ${getScoreColor(component.score)}" 
                />
              </svg>
              <span class="score-text">${component.score}</span>
            </div>
          </td>
          <td>${component.issues.length}</td>
          <td>
            ${component.issues.length > 0 
              ? `<span class="badge badge-${highestSeverity}">${highestSeverity}</span>` 
              : `<span class="badge badge-success">Pass</span>`}
          </td>
        </tr>
        <tr>
          <td colspan="4">
            <div id="details-${index}" class="component-details">
              <h3>${component.name}</h3>
              <p>Path: ${component.path}</p>
              
              ${component.issues.length > 0 ? `
                <h4>Issues</h4>
                <ul>
                  ${component.issues.map(issue => `
                    <li>
                      <strong class="${issue.severity}">${issue.description}</strong> (${issue.rule})
                      <div>Severity: ${issue.severity}</div>
                      <div>Details: ${JSON.stringify(issue.details)}</div>
                    </li>
                  `).join('')}
                </ul>
              ` : `
                <p>No accessibility issues detected.</p>
              `}
              
              ${component.passedRules.length > 0 ? `
                <h4>Passed Rules</h4>
                <ul>
                  ${component.passedRules.map(rule => `
                    <li>${accessibilityRules[rule].description} (${rule})</li>
                  `).join('')}
                </ul>
              ` : ''}
            </div>
          </td>
        </tr>
      `;
    });
  
  html += `
      </tbody>
    </table>
    
    <script>
      function toggleDetails(index) {
        const detailsElement = document.getElementById('details-' + index);
        detailsElement.classList.toggle('show');
      }
      
      function getScoreColor(score) {
        if (score >= 90) return '#22c55e';
        if (score >= 70) return '#eab308';
        return '#ef4444';
      }
    </script>
  </body>
  </html>
  `;
  
  fs.writeFileSync(options.html, html);
}

/**
 * Main function to audit all components
 */
function auditComponents() {
  console.log(chalk.blue('Starting accessibility audit...'));
  
  // Create output directory if it doesn't exist
  const outputDir = path.dirname(options.output);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // Create HTML output directory if it doesn't exist
  const htmlOutputDir = path.dirname(options.html);
  if (!fs.existsSync(htmlOutputDir)) {
    fs.mkdirSync(htmlOutputDir, { recursive: true });
  }
  
  // Find all component files
  const componentFiles = glob.sync(`${options.src}/**/*.{js,jsx,ts,tsx}`);
  
  if (componentFiles.length === 0) {
    console.error(chalk.red(`No component files found in ${options.src}`));
    process.exit(1);
  }
  
  console.log(chalk.blue(`Found ${componentFiles.length} potential component files`));
  
  // Analyze each file
  componentFiles.forEach(analyzeComponentFile);
  
  // Write results to file
  fs.writeFileSync(options.output, JSON.stringify(results, null, 2));
  
  // Generate HTML report
  generateHtmlReport();
  
  console.log(chalk.green(`Audit complete! Results saved to ${options.output}`));
  console.log(chalk.green(`HTML report saved to ${options.html}`));
  printSummary();
}

/**
 * Print summary of findings
 */
function printSummary() {
  console.log(chalk.yellow('\nAccessibility Audit Summary:'));
  console.log(chalk.yellow('============================'));
  
  console.log(chalk.white(`Total components analyzed: ${results.summary.totalComponents}`));
  console.log(chalk.white(`Components with issues: ${results.summary.componentsWithIssues}`));
  
  console.log(chalk.yellow('\nIssues by Severity:'));
  console.log(chalk.red(`  High: ${results.summary.issuesBySeverity.high}`));
  console.log(chalk.yellow(`  Medium: ${results.summary.issuesBySeverity.medium}`));
  console.log(chalk.blue(`  Low: ${results.summary.issuesBySeverity.low}`));
  
  console.log(chalk.yellow('\nTop Rule Violations:'));
  Object.entries(results.summary.ruleViolations)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 5)
    .forEach(([ruleId, rule]) => {
      if (rule.count > 0) {
        const color = rule.severity === 'high' ? chalk.red :
                      rule.severity === 'medium' ? chalk.yellow : chalk.blue;
        
        console.log(color(`  ${rule.description} (${ruleId}): ${rule.count} components`));
      }
    });
  
  console.log(chalk.green('\nFull results saved to ' + options.output));
  console.log(chalk.green('HTML report saved to ' + options.html));
}

// Run the audit
auditComponents();