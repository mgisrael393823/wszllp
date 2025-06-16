import * as fs from 'fs/promises';
import * as path from 'path';
import { glob } from 'glob';
import { AgentTask, AgentResult } from '../types';

interface DesignAnalysis {
  colorPalette: Map<string, number>;
  typography: {
    fontFamilies: Set<string>;
    fontSizes: Set<string>;
    fontWeights: Set<string>;
  };
  spacing: {
    margins: Set<string>;
    paddings: Set<string>;
    gaps: Set<string>;
  };
  components: {
    name: string;
    styles: string[];
    inconsistencies: string[];
  }[];
  designSystem: {
    hasThemeFile: boolean;
    hasDesignTokens: boolean;
    usingTailwind: boolean;
    usingCSSModules: boolean;
    usingStyledComponents: boolean;
    usingCSSinJS: boolean;
  };
  recommendations: string[];
}

export class DesignAnalysisAgent {
  async execute(task: AgentTask): Promise<AgentResult> {
    const startTime = Date.now();
    
    try {
      const analysis = await this.analyzeDesign(task.files);
      const recommendations = this.generateRecommendations(analysis);
      
      return {
        agentId: task.id,
        agentType: 'design-analysis',
        status: 'success',
        edits: [],
        analysis: {
          ...analysis,
          recommendations
        },
        metrics: {
          filesAnalyzed: task.files.length,
          filesModified: 0,
          linesAdded: 0,
          linesRemoved: 0,
          duration: Date.now() - startTime,
        },
      };
    } catch (error) {
      return {
        agentId: task.id,
        agentType: 'design-analysis',
        status: 'failed',
        edits: [],
        errors: [error instanceof Error ? error.message : 'Design analysis failed'],
      };
    }
  }

  private async analyzeDesign(files: string[]): Promise<DesignAnalysis> {
    const analysis: DesignAnalysis = {
      colorPalette: new Map(),
      typography: {
        fontFamilies: new Set(),
        fontSizes: new Set(),
        fontWeights: new Set(),
      },
      spacing: {
        margins: new Set(),
        paddings: new Set(),
        gaps: new Set(),
      },
      components: [],
      designSystem: {
        hasThemeFile: false,
        hasDesignTokens: false,
        usingTailwind: false,
        usingCSSModules: false,
        usingStyledComponents: false,
        usingCSSinJS: false,
      },
      recommendations: [],
    };

    // Check for design system files
    const themeFiles = await glob('**/theme*.{ts,js,json}', { 
      ignore: ['**/node_modules/**'] 
    });
    const tailwindConfig = await glob('**/tailwind.config.{js,ts}', { 
      ignore: ['**/node_modules/**'] 
    });
    
    analysis.designSystem.hasThemeFile = themeFiles.length > 0;
    analysis.designSystem.usingTailwind = tailwindConfig.length > 0;

    // Analyze each file
    for (const file of files) {
      const ext = path.extname(file);
      
      if (['.css', '.scss', '.less'].includes(ext)) {
        await this.analyzeCSSFile(file, analysis);
      } else if (['.tsx', '.jsx', '.ts', '.js'].includes(ext)) {
        await this.analyzeComponentFile(file, analysis);
      }
    }

    return analysis;
  }

  private async analyzeCSSFile(filePath: string, analysis: DesignAnalysis): Promise<void> {
    const content = await fs.readFile(filePath, 'utf-8');
    
    // Extract colors
    const colorRegex = /#[0-9a-fA-F]{3,8}|rgb\([^)]+\)|rgba\([^)]+\)|hsl\([^)]+\)|hsla\([^)]+\)/g;
    const colors = content.match(colorRegex) || [];
    colors.forEach(color => {
      const count = analysis.colorPalette.get(color) || 0;
      analysis.colorPalette.set(color, count + 1);
    });

    // Extract font properties
    const fontFamilyRegex = /font-family:\s*([^;]+);/g;
    const fontSizeRegex = /font-size:\s*([^;]+);/g;
    const fontWeightRegex = /font-weight:\s*([^;]+);/g;
    
    let match;
    while ((match = fontFamilyRegex.exec(content)) !== null) {
      analysis.typography.fontFamilies.add(match[1].trim());
    }
    while ((match = fontSizeRegex.exec(content)) !== null) {
      analysis.typography.fontSizes.add(match[1].trim());
    }
    while ((match = fontWeightRegex.exec(content)) !== null) {
      analysis.typography.fontWeights.add(match[1].trim());
    }

    // Extract spacing
    const marginRegex = /margin(?:-(?:top|right|bottom|left))?:\s*([^;]+);/g;
    const paddingRegex = /padding(?:-(?:top|right|bottom|left))?:\s*([^;]+);/g;
    const gapRegex = /gap:\s*([^;]+);/g;
    
    while ((match = marginRegex.exec(content)) !== null) {
      analysis.spacing.margins.add(match[1].trim());
    }
    while ((match = paddingRegex.exec(content)) !== null) {
      analysis.spacing.paddings.add(match[1].trim());
    }
    while ((match = gapRegex.exec(content)) !== null) {
      analysis.spacing.gaps.add(match[1].trim());
    }
  }

  private async analyzeComponentFile(filePath: string, analysis: DesignAnalysis): Promise<void> {
    const content = await fs.readFile(filePath, 'utf-8');
    
    // Check for CSS modules
    if (content.includes('styles.') || content.includes('.module.css')) {
      analysis.designSystem.usingCSSModules = true;
    }
    
    // Check for styled-components
    if (content.includes('styled.') || content.includes('styled(')) {
      analysis.designSystem.usingStyledComponents = true;
    }
    
    // Check for CSS-in-JS
    if (content.includes('makeStyles') || content.includes('sx=') || content.includes('css=')) {
      analysis.designSystem.usingCSSinJS = true;
    }
    
    // Extract Tailwind classes
    if (analysis.designSystem.usingTailwind) {
      const classNameRegex = /className\s*=\s*["']([^"']+)["']/g;
      let match;
      while ((match = classNameRegex.exec(content)) !== null) {
        const classes = match[1].split(' ').filter(Boolean);
        // Analyze Tailwind classes for colors, spacing, etc.
        classes.forEach(className => {
          if (className.includes('text-') || className.includes('bg-') || className.includes('border-')) {
            // Track color usage
          }
          if (className.match(/^[mp][tlrbxy]?-\d+$/)) {
            // Track spacing usage
          }
        });
      }
    }
    
    // Analyze inline styles
    const inlineStyleRegex = /style\s*=\s*\{\{([^}]+)\}\}/g;
    while ((match = inlineStyleRegex.exec(content)) !== null) {
      // Parse inline styles for design inconsistencies
      const styles = match[1];
      const componentName = filePath.split('/').pop()?.replace(/\.(tsx?|jsx?)$/, '') || 'Unknown';
      
      const component = analysis.components.find(c => c.name === componentName) || {
        name: componentName,
        styles: [],
        inconsistencies: [],
      };
      
      if (styles.includes('color:') || styles.includes('backgroundColor:')) {
        component.inconsistencies.push('Inline color styles detected');
      }
      if (styles.includes('margin:') || styles.includes('padding:')) {
        component.inconsistencies.push('Inline spacing styles detected');
      }
      
      if (!analysis.components.find(c => c.name === componentName)) {
        analysis.components.push(component);
      }
    }
  }

  private generateRecommendations(analysis: DesignAnalysis): string[] {
    const recommendations: string[] = [];
    
    // Color palette recommendations
    if (analysis.colorPalette.size > 20) {
      recommendations.push('Consolidate color palette - found ' + analysis.colorPalette.size + ' unique colors');
    }
    
    // Typography recommendations
    if (analysis.typography.fontFamilies.size > 3) {
      recommendations.push('Reduce font families - using ' + analysis.typography.fontFamilies.size + ' different fonts');
    }
    if (analysis.typography.fontSizes.size > 10) {
      recommendations.push('Standardize font sizes - found ' + analysis.typography.fontSizes.size + ' unique sizes');
    }
    
    // Spacing recommendations
    const totalSpacingValues = analysis.spacing.margins.size + 
                              analysis.spacing.paddings.size + 
                              analysis.spacing.gaps.size;
    if (totalSpacingValues > 20) {
      recommendations.push('Create consistent spacing scale - using ' + totalSpacingValues + ' different spacing values');
    }
    
    // Design system recommendations
    if (!analysis.designSystem.hasThemeFile && !analysis.designSystem.hasDesignTokens) {
      recommendations.push('Implement design tokens or theme configuration');
    }
    
    // Component recommendations
    const componentsWithIssues = analysis.components.filter(c => c.inconsistencies.length > 0);
    if (componentsWithIssues.length > 0) {
      recommendations.push('Remove inline styles from ' + componentsWithIssues.length + ' components');
    }
    
    // Framework recommendations
    if (!analysis.designSystem.usingTailwind && !analysis.designSystem.usingCSSModules) {
      recommendations.push('Consider adopting a CSS framework or methodology (Tailwind, CSS Modules)');
    }
    
    return recommendations;
  }
}