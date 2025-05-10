#!/usr/bin/env node

/**
 * Component Analysis Tool
 * 
 * This script analyzes React components in the project to identify inconsistencies,
 * evaluate prop naming patterns, and generate reports on component usage.
 * 
 * Usage:
 *   node scripts/component-analysis.js
 * 
 * Options:
 *   --src       Source directory to analyze (default: src/components)
 *   --output    Output file for the report (default: reports/component-analysis.json)
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
  output: 'reports/component-analysis.json',
  verbose: false
};

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--src' && args[i + 1]) {
    options.src = args[i + 1];
    i++;
  } else if (args[i] === '--output' && args[i + 1]) {
    options.output = args[i + 1];
    i++;
  } else if (args[i] === '--verbose') {
    options.verbose = true;
  }
}

// Standard prop names to check for consistency
const standardPropNames = [
  'variant',
  'size',
  'color',
  'disabled',
  'loading',
  'fullWidth',
  'required',
  'className',
  'children',
  'leftIcon',
  'rightIcon',
  'onClick',
  'onChange',
  'onFocus',
  'onBlur'
];

// Component standards for component audit
const componentStandards = {
  variants: ['primary', 'secondary', 'outline', 'text', 'danger', 'success'],
  sizes: ['xs', 'sm', 'md', 'lg', 'xl'],
  states: ['default', 'hover', 'active', 'focus', 'disabled', 'loading', 'error']
};

// Initialize results object
const results = {
  summary: {
    totalComponents: 0,
    totalProps: 0,
    averagePropsPerComponent: 0,
    standardPropsUsage: {},
    commonNonStandardProps: [],
    inconsistentPropPatterns: [],
    missingStandardProps: []
  },
  components: []
};

// Initialize standard prop usage tracking
standardPropNames.forEach(prop => {
  results.summary.standardPropsUsage[prop] = {
    count: 0,
    percentage: 0
  };
});

/**
 * Analyze a single component file
 */
function analyzeComponentFile(filePath) {
  const relativePath = path.relative(process.cwd(), filePath);
  if (options.verbose) {
    console.log(chalk.blue(`Analyzing ${relativePath}...`));
  }

  try {
    const code = fs.readFileSync(filePath, 'utf8');
    const ast = parser.parse(code, {
      sourceType: 'module',
      plugins: ['jsx', 'typescript', 'decorators-legacy']
    });

    const componentInfo = {
      filePath: relativePath,
      name: path.basename(filePath, path.extname(filePath)),
      props: [],
      usesStandardProps: [],
      missingStandardProps: [],
      nonStandardProps: [],
      hasVariantProp: false,
      hasSizeProp: false,
      interfaces: [],
      componentType: 'unknown'
    };

    // Traverse the AST to find component definitions and prop interfaces
    traverse(ast, {
      // Find component function declarations
      FunctionDeclaration(path) {
        if (path.node.id && path.node.id.name) {
          if (isReactComponent(path.node)) {
            componentInfo.name = path.node.id.name;
            componentInfo.componentType = 'function';
            extractPropsFromParams(path.node.params, componentInfo);
          }
        }
      },
      
      // Find arrow function components
      VariableDeclarator(path) {
        if (path.node.id && path.node.id.name && path.node.init) {
          if (path.node.init.type === 'ArrowFunctionExpression' && isReactComponent(path.node.init)) {
            componentInfo.name = path.node.id.name;
            componentInfo.componentType = 'arrow';
            extractPropsFromParams(path.node.init.params, componentInfo);
          }
        }
      },
      
      // Find class components
      ClassDeclaration(path) {
        if (isReactClassComponent(path.node)) {
          componentInfo.name = path.node.id.name;
          componentInfo.componentType = 'class';
          // Extract props from class properties and render method
          extractPropsFromClass(path.node, componentInfo);
        }
      },
      
      // Find TypeScript interfaces (for props)
      TSInterfaceDeclaration(path) {
        const interfaceName = path.node.id.name;
        if (interfaceName.includes('Props')) {
          const interfaceInfo = {
            name: interfaceName,
            properties: []
          };
          
          path.node.body.body.forEach(property => {
            if (property.type === 'TSPropertySignature') {
              const propName = property.key.name;
              let propType = 'unknown';
              
              if (property.typeAnnotation) {
                propType = code.substring(
                  property.typeAnnotation.typeAnnotation.start,
                  property.typeAnnotation.typeAnnotation.end
                );
              }
              
              const isOptional = property.optional || false;
              
              interfaceInfo.properties.push({
                name: propName,
                type: propType,
                optional: isOptional
              });
              
              // Add to component props if not already there
              if (!componentInfo.props.includes(propName)) {
                componentInfo.props.push(propName);
                
                // Check if this is a standard prop
                if (standardPropNames.includes(propName)) {
                  componentInfo.usesStandardProps.push(propName);
                } else {
                  componentInfo.nonStandardProps.push(propName);
                }
                
                // Check for specific props
                if (propName === 'variant') componentInfo.hasVariantProp = true;
                if (propName === 'size') componentInfo.hasSizeProp = true;
              }
            }
          });
          
          componentInfo.interfaces.push(interfaceInfo);
        }
      }
    });
    
    // Find missing standard props
    componentInfo.missingStandardProps = standardPropNames.filter(
      prop => !componentInfo.usesStandardProps.includes(prop)
    );
    
    // Add to results if it's a valid component
    if (componentInfo.componentType !== 'unknown' && componentInfo.props.length > 0) {
      results.components.push(componentInfo);
      
      // Update summary
      results.summary.totalComponents++;
      results.summary.totalProps += componentInfo.props.length;
      
      // Update standard props usage
      componentInfo.usesStandardProps.forEach(prop => {
        results.summary.standardPropsUsage[prop].count++;
      });
    }
    
  } catch (error) {
    console.error(chalk.red(`Error analyzing ${relativePath}:`), error);
  }
}

/**
 * Check if a node represents a React component
 */
function isReactComponent(node) {
  // Basic heuristic: function returns JSX or has props parameter
  if (node.params && node.params.length > 0) {
    const firstParam = node.params[0];
    if (firstParam.type === 'ObjectPattern') {
      return true; // Destructured props
    } else if (firstParam.name === 'props') {
      return true; // Props parameter
    }
  }
  return false;
}

/**
 * Check if a class declaration is a React component
 */
function isReactClassComponent(node) {
  if (node.superClass) {
    // Check if extends React.Component or Component
    const superClass = node.superClass;
    if (superClass.type === 'MemberExpression') {
      return (
        superClass.object.name === 'React' && 
        superClass.property.name === 'Component'
      );
    } else if (superClass.type === 'Identifier') {
      return superClass.name === 'Component';
    }
  }
  return false;
}

/**
 * Extract props from function parameters
 */
function extractPropsFromParams(params, componentInfo) {
  if (params.length === 0) return;
  
  const firstParam = params[0];
  if (firstParam.type === 'ObjectPattern') {
    // Destructured props
    firstParam.properties.forEach(prop => {
      if (prop.key && prop.key.name) {
        const propName = prop.key.name;
        componentInfo.props.push(propName);
        
        if (standardPropNames.includes(propName)) {
          componentInfo.usesStandardProps.push(propName);
        } else {
          componentInfo.nonStandardProps.push(propName);
        }
        
        // Check for specific props
        if (propName === 'variant') componentInfo.hasVariantProp = true;
        if (propName === 'size') componentInfo.hasSizeProp = true;
      }
    });
  }
}

/**
 * Extract props from class component
 */
function extractPropsFromClass(node, componentInfo) {
  // This would need to analyze the render method and class properties
  // For simplicity, we'll just check if the class has propTypes or defaultProps
  node.body.body.forEach(member => {
    if (member.type === 'ClassProperty') {
      if (member.key.name === 'propTypes' || member.key.name === 'defaultProps') {
        // This class has props defined
        componentInfo.componentType = 'class-with-props';
      }
    }
  });
}

/**
 * Main function to analyze all components
 */
function analyzeComponents() {
  console.log(chalk.blue('Starting component analysis...'));
  
  // Create output directory if it doesn't exist
  const outputDir = path.dirname(options.output);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
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
  
  // Calculate final statistics
  if (results.summary.totalComponents > 0) {
    results.summary.averagePropsPerComponent = (
      results.summary.totalProps / results.summary.totalComponents
    ).toFixed(2);
    
    // Calculate standard props usage percentages
    for (const prop in results.summary.standardPropsUsage) {
      results.summary.standardPropsUsage[prop].percentage = (
        (results.summary.standardPropsUsage[prop].count / results.summary.totalComponents) * 100
      ).toFixed(2);
    }
    
    // Find common non-standard props
    const nonStandardPropCounts = {};
    results.components.forEach(component => {
      component.nonStandardProps.forEach(prop => {
        nonStandardPropCounts[prop] = (nonStandardPropCounts[prop] || 0) + 1;
      });
    });
    
    // Sort and get top non-standard props
    results.summary.commonNonStandardProps = Object.entries(nonStandardPropCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([prop, count]) => ({
        prop,
        count,
        percentage: ((count / results.summary.totalComponents) * 100).toFixed(2)
      }));
    
    // Find inconsistent prop patterns
    findInconsistentPropPatterns();
    
    // Find commonly missing standard props
    const missingPropCounts = {};
    results.components.forEach(component => {
      component.missingStandardProps.forEach(prop => {
        missingPropCounts[prop] = (missingPropCounts[prop] || 0) + 1;
      });
    });
    
    results.summary.missingStandardProps = Object.entries(missingPropCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([prop, count]) => ({
        prop,
        count,
        percentage: ((count / results.summary.totalComponents) * 100).toFixed(2)
      }));
  }
  
  // Write results to file
  fs.writeFileSync(options.output, JSON.stringify(results, null, 2));
  
  console.log(chalk.green(`Analysis complete! Results saved to ${options.output}`));
  printSummary();
}

/**
 * Find inconsistent prop patterns across components
 */
function findInconsistentPropPatterns() {
  const patterns = {
    iconProps: { components: [] },
    sizeProps: { components: [] },
    styleProps: { components: [] },
    eventHandlerProps: { components: [] }
  };
  
  // Check components for inconsistent patterns
  results.components.forEach(component => {
    // Check icon prop patterns (icon vs. leftIcon/rightIcon)
    if (component.props.includes('icon') && 
       (component.props.includes('leftIcon') || component.props.includes('rightIcon'))) {
      patterns.iconProps.components.push(component.name);
    }
    
    // Check size prop patterns (size vs. width/height)
    if (component.props.includes('size') && 
       (component.props.includes('width') || component.props.includes('height'))) {
      patterns.sizeProps.components.push(component.name);
    }
    
    // Check style prop patterns (style vs. className)
    if (component.props.includes('style') && component.props.includes('className')) {
      patterns.styleProps.components.push(component.name);
    }
    
    // Check event handler naming (onClick vs. handleClick)
    const onEventProps = component.props.filter(prop => prop.startsWith('on'));
    const handleEventProps = component.props.filter(prop => prop.startsWith('handle'));
    if (onEventProps.length > 0 && handleEventProps.length > 0) {
      patterns.eventHandlerProps.components.push(component.name);
    }
  });
  
  // Add non-empty patterns to results
  for (const [patternName, pattern] of Object.entries(patterns)) {
    if (pattern.components.length > 0) {
      results.summary.inconsistentPropPatterns.push({
        pattern: patternName,
        components: pattern.components,
        count: pattern.components.length
      });
    }
  }
}

/**
 * Print summary of findings
 */
function printSummary() {
  console.log(chalk.yellow('\nComponent Analysis Summary:'));
  console.log(chalk.yellow('============================'));
  
  console.log(chalk.white(`Total components analyzed: ${results.summary.totalComponents}`));
  console.log(chalk.white(`Average props per component: ${results.summary.averagePropsPerComponent}`));
  
  console.log(chalk.yellow('\nStandard Props Usage:'));
  for (const prop in results.summary.standardPropsUsage) {
    const usage = results.summary.standardPropsUsage[prop];
    console.log(chalk.white(`  ${prop}: ${usage.count} components (${usage.percentage}%)`));
  }
  
  console.log(chalk.yellow('\nTop Non-Standard Props:'));
  results.summary.commonNonStandardProps.forEach(item => {
    console.log(chalk.white(`  ${item.prop}: ${item.count} components (${item.percentage}%)`));
  });
  
  console.log(chalk.yellow('\nInconsistent Prop Patterns:'));
  results.summary.inconsistentPropPatterns.forEach(pattern => {
    console.log(chalk.white(`  ${pattern.pattern}: ${pattern.count} components`));
  });
  
  console.log(chalk.yellow('\nCommonly Missing Standard Props:'));
  results.summary.missingStandardProps.forEach(item => {
    console.log(chalk.white(`  ${item.prop}: missing in ${item.count} components (${item.percentage}%)`));
  });
  
  console.log(chalk.green('\nFull results saved to ' + options.output));
}

// Run the analysis
analyzeComponents();