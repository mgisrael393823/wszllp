import * as fs from 'fs/promises';
import * as path from 'path';
import { glob } from 'glob';
import { AgentTask, AgentResult, FileEdit } from '../types';

interface DesignTokens {
  colors: {
    primary: string[];
    secondary: string[];
    neutral: string[];
    semantic: {
      success: string[];
      warning: string[];
      error: string[];
      info: string[];
    };
  };
  typography: {
    fontFamily: {
      heading: string;
      body: string;
      mono: string;
    };
    fontSize: {
      xs: string;
      sm: string;
      base: string;
      lg: string;
      xl: string;
      '2xl': string;
      '3xl': string;
      '4xl': string;
    };
    fontWeight: {
      normal: string;
      medium: string;
      semibold: string;
      bold: string;
    };
    lineHeight: {
      tight: string;
      normal: string;
      relaxed: string;
    };
  };
  spacing: {
    0: string;
    1: string;
    2: string;
    3: string;
    4: string;
    5: string;
    6: string;
    8: string;
    10: string;
    12: string;
    16: string;
    20: string;
    24: string;
    32: string;
  };
  borderRadius: {
    none: string;
    sm: string;
    base: string;
    md: string;
    lg: string;
    xl: string;
    full: string;
  };
  shadows: {
    sm: string;
    base: string;
    md: string;
    lg: string;
    xl: string;
  };
}

export class ThemeExtractionAgent {
  async execute(task: AgentTask): Promise<AgentResult> {
    const startTime = Date.now();
    
    try {
      // Extract current design values
      const extractedValues = await this.extractDesignValues(task.files);
      
      // Generate design tokens
      const tokens = this.generateDesignTokens(extractedValues);
      
      // Create theme file
      const themeEdit = this.createThemeFile(tokens);
      
      // Create CSS variables file
      const cssVariablesEdit = this.createCSSVariables(tokens);
      
      return {
        agentId: task.id,
        agentType: 'theme-extraction',
        status: 'success',
        edits: [themeEdit, cssVariablesEdit],
        analysis: {
          extractedTokens: tokens,
          summary: this.generateSummary(tokens),
        },
        metrics: {
          filesAnalyzed: task.files.length,
          filesModified: 2,
          linesAdded: themeEdit.additions.length + cssVariablesEdit.additions.length,
          linesRemoved: 0,
          duration: Date.now() - startTime,
        },
      };
    } catch (error) {
      return {
        agentId: task.id,
        agentType: 'theme-extraction',
        status: 'failed',
        edits: [],
        errors: [error instanceof Error ? error.message : 'Theme extraction failed'],
      };
    }
  }

  private async extractDesignValues(files: string[]): Promise<any> {
    const values = {
      colors: new Map<string, number>(),
      fontFamilies: new Map<string, number>(),
      fontSizes: new Map<string, number>(),
      fontWeights: new Map<string, number>(),
      margins: new Map<string, number>(),
      paddings: new Map<string, number>(),
      borderRadii: new Map<string, number>(),
      shadows: new Map<string, number>(),
    };

    for (const file of files) {
      const content = await fs.readFile(file, 'utf-8');
      const ext = path.extname(file);
      
      if (['.css', '.scss'].includes(ext)) {
        this.extractFromCSS(content, values);
      } else if (['.tsx', '.jsx'].includes(ext)) {
        this.extractFromJSX(content, values);
      }
    }

    return values;
  }

  private extractFromCSS(content: string, values: any): void {
    // Colors
    const colorRegex = /(#[0-9a-fA-F]{3,8}|rgb\([^)]+\)|rgba\([^)]+\)|hsl\([^)]+\)|hsla\([^)]+\))/g;
    let match;
    while ((match = colorRegex.exec(content)) !== null) {
      const color = this.normalizeColor(match[1]);
      values.colors.set(color, (values.colors.get(color) || 0) + 1);
    }

    // Font properties
    const fontFamilyRegex = /font-family:\s*([^;]+);/g;
    while ((match = fontFamilyRegex.exec(content)) !== null) {
      const family = match[1].trim().replace(/['"]/g, '');
      values.fontFamilies.set(family, (values.fontFamilies.get(family) || 0) + 1);
    }

    const fontSizeRegex = /font-size:\s*([^;]+);/g;
    while ((match = fontSizeRegex.exec(content)) !== null) {
      const size = match[1].trim();
      values.fontSizes.set(size, (values.fontSizes.get(size) || 0) + 1);
    }

    // Spacing
    const spacingRegex = /(margin|padding)(?:-(?:top|right|bottom|left))?:\s*([^;]+);/g;
    while ((match = spacingRegex.exec(content)) !== null) {
      const prop = match[1];
      const value = match[2].trim();
      const map = prop === 'margin' ? values.margins : values.paddings;
      map.set(value, (map.get(value) || 0) + 1);
    }

    // Border radius
    const borderRadiusRegex = /border-radius:\s*([^;]+);/g;
    while ((match = borderRadiusRegex.exec(content)) !== null) {
      const radius = match[1].trim();
      values.borderRadii.set(radius, (values.borderRadii.get(radius) || 0) + 1);
    }

    // Box shadow
    const shadowRegex = /box-shadow:\s*([^;]+);/g;
    while ((match = shadowRegex.exec(content)) !== null) {
      const shadow = match[1].trim();
      values.shadows.set(shadow, (values.shadows.get(shadow) || 0) + 1);
    }
  }

  private extractFromJSX(content: string, values: any): void {
    // Extract Tailwind classes
    const classNameRegex = /className\s*=\s*["']([^"']+)["']/g;
    let match;
    while ((match = classNameRegex.exec(content)) !== null) {
      const classes = match[1].split(' ');
      classes.forEach(cls => {
        // Colors
        if (cls.match(/^(text|bg|border)-(.*)/)) {
          const colorMatch = cls.match(/^(text|bg|border)-(.*)/)!;
          const color = colorMatch[2];
          values.colors.set(color, (values.colors.get(color) || 0) + 1);
        }
        
        // Font size
        if (cls.match(/^text-(xs|sm|base|lg|xl|2xl|3xl|4xl|5xl)/)) {
          const size = cls.replace('text-', '');
          values.fontSizes.set(size, (values.fontSizes.get(size) || 0) + 1);
        }
        
        // Spacing
        if (cls.match(/^[mp][tlrbxy]?-\d+$/)) {
          const spacingMatch = cls.match(/^([mp])[tlrbxy]?-(\d+)$/)!;
          const type = spacingMatch[1] === 'm' ? 'margins' : 'paddings';
          const value = spacingMatch[2];
          values[type].set(value, (values[type].get(value) || 0) + 1);
        }
      });
    }

    // Extract inline styles
    const styleRegex = /style\s*=\s*\{\{([^}]+)\}\}/g;
    while ((match = styleRegex.exec(content)) !== null) {
      const styleContent = match[1];
      
      // Extract color values
      const colorProps = styleContent.match(/(color|backgroundColor|borderColor):\s*['"]([^'"]+)['"]/g);
      if (colorProps) {
        colorProps.forEach(prop => {
          const colorMatch = prop.match(/:\s*['"]([^'"]+)['"]/);
          if (colorMatch) {
            const color = this.normalizeColor(colorMatch[1]);
            values.colors.set(color, (values.colors.get(color) || 0) + 1);
          }
        });
      }
    }
  }

  private normalizeColor(color: string): string {
    // Normalize color format for consistency
    color = color.trim().toLowerCase();
    
    // Convert hex shorthand to full
    if (color.match(/^#[0-9a-f]{3}$/)) {
      color = '#' + color[1] + color[1] + color[2] + color[2] + color[3] + color[3];
    }
    
    return color;
  }

  private generateDesignTokens(extractedValues: any): DesignTokens {
    // Analyze and categorize extracted values
    const colors = this.categorizeColors(extractedValues.colors);
    const typography = this.generateTypographyTokens(extractedValues);
    const spacing = this.generateSpacingTokens(extractedValues);
    const borderRadius = this.generateBorderRadiusTokens(extractedValues.borderRadii);
    const shadows = this.generateShadowTokens(extractedValues.shadows);

    return {
      colors,
      typography,
      spacing,
      borderRadius,
      shadows,
    };
  }

  private categorizeColors(colorMap: Map<string, number>): DesignTokens['colors'] {
    const colors: DesignTokens['colors'] = {
      primary: [],
      secondary: [],
      neutral: [],
      semantic: {
        success: [],
        warning: [],
        error: [],
        info: [],
      },
    };

    // Sort colors by usage frequency
    const sortedColors = Array.from(colorMap.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([color]) => color);

    // Simple categorization based on color values
    sortedColors.forEach(color => {
      if (color.includes('gray') || color.includes('grey') || this.isGrayScale(color)) {
        colors.neutral.push(color);
      } else if (color.includes('red') || this.isReddish(color)) {
        colors.semantic.error.push(color);
      } else if (color.includes('green') || this.isGreenish(color)) {
        colors.semantic.success.push(color);
      } else if (color.includes('yellow') || color.includes('amber') || this.isYellowish(color)) {
        colors.semantic.warning.push(color);
      } else if (color.includes('blue') || this.isBlueish(color)) {
        if (colors.primary.length === 0) {
          colors.primary.push(color);
        } else {
          colors.semantic.info.push(color);
        }
      } else {
        colors.secondary.push(color);
      }
    });

    return colors;
  }

  private isGrayScale(color: string): boolean {
    if (color.startsWith('#')) {
      const r = parseInt(color.slice(1, 3), 16);
      const g = parseInt(color.slice(3, 5), 16);
      const b = parseInt(color.slice(5, 7), 16);
      return Math.abs(r - g) < 10 && Math.abs(g - b) < 10;
    }
    return false;
  }

  private isReddish(color: string): boolean {
    if (color.startsWith('#')) {
      const r = parseInt(color.slice(1, 3), 16);
      const g = parseInt(color.slice(3, 5), 16);
      const b = parseInt(color.slice(5, 7), 16);
      return r > g + 50 && r > b + 50;
    }
    return false;
  }

  private isGreenish(color: string): boolean {
    if (color.startsWith('#')) {
      const r = parseInt(color.slice(1, 3), 16);
      const g = parseInt(color.slice(3, 5), 16);
      const b = parseInt(color.slice(5, 7), 16);
      return g > r + 50 && g > b + 50;
    }
    return false;
  }

  private isBlueish(color: string): boolean {
    if (color.startsWith('#')) {
      const r = parseInt(color.slice(1, 3), 16);
      const g = parseInt(color.slice(3, 5), 16);
      const b = parseInt(color.slice(5, 7), 16);
      return b > r + 50 && b > g + 50;
    }
    return false;
  }

  private isYellowish(color: string): boolean {
    if (color.startsWith('#')) {
      const r = parseInt(color.slice(1, 3), 16);
      const g = parseInt(color.slice(3, 5), 16);
      const b = parseInt(color.slice(5, 7), 16);
      return r > 200 && g > 200 && b < 100;
    }
    return false;
  }

  private generateTypographyTokens(extractedValues: any): DesignTokens['typography'] {
    // Get most used font families
    const sortedFonts = Array.from(extractedValues.fontFamilies.entries())
      .sort((a, b) => b[1] - a[1]);

    return {
      fontFamily: {
        heading: sortedFonts[0]?.[0] || 'system-ui, -apple-system, sans-serif',
        body: sortedFonts[1]?.[0] || sortedFonts[0]?.[0] || 'system-ui, -apple-system, sans-serif',
        mono: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, monospace',
      },
      fontSize: {
        xs: '0.75rem',
        sm: '0.875rem',
        base: '1rem',
        lg: '1.125rem',
        xl: '1.25rem',
        '2xl': '1.5rem',
        '3xl': '1.875rem',
        '4xl': '2.25rem',
      },
      fontWeight: {
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
      },
      lineHeight: {
        tight: '1.25',
        normal: '1.5',
        relaxed: '1.75',
      },
    };
  }

  private generateSpacingTokens(extractedValues: any): DesignTokens['spacing'] {
    // Standard spacing scale
    return {
      0: '0',
      1: '0.25rem',
      2: '0.5rem',
      3: '0.75rem',
      4: '1rem',
      5: '1.25rem',
      6: '1.5rem',
      8: '2rem',
      10: '2.5rem',
      12: '3rem',
      16: '4rem',
      20: '5rem',
      24: '6rem',
      32: '8rem',
    };
  }

  private generateBorderRadiusTokens(borderRadii: Map<string, number>): DesignTokens['borderRadius'] {
    return {
      none: '0',
      sm: '0.125rem',
      base: '0.25rem',
      md: '0.375rem',
      lg: '0.5rem',
      xl: '0.75rem',
      full: '9999px',
    };
  }

  private generateShadowTokens(shadows: Map<string, number>): DesignTokens['shadows'] {
    return {
      sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
      md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    };
  }

  private createThemeFile(tokens: DesignTokens): FileEdit {
    const content = `// Auto-generated design tokens
export const theme = ${JSON.stringify(tokens, null, 2)};

export default theme;
`;

    return {
      file: 'src/styles/theme.ts',
      additions: content.split('\n').map((line, i) => ({
        line: i + 1,
        content: line,
      })),
      deletions: [],
    };
  }

  private createCSSVariables(tokens: DesignTokens): FileEdit {
    const cssVars: string[] = [':root {'];
    
    // Colors
    if (tokens.colors.primary.length > 0) {
      cssVars.push('  /* Primary Colors */');
      tokens.colors.primary.forEach((color, i) => {
        cssVars.push(`  --color-primary-${i * 100 + 500}: ${color};`);
      });
    }
    
    // Typography
    cssVars.push('  /* Typography */');
    Object.entries(tokens.typography.fontSize).forEach(([key, value]) => {
      cssVars.push(`  --font-size-${key}: ${value};`);
    });
    
    // Spacing
    cssVars.push('  /* Spacing */');
    Object.entries(tokens.spacing).forEach(([key, value]) => {
      cssVars.push(`  --spacing-${key}: ${value};`);
    });
    
    // Border radius
    cssVars.push('  /* Border Radius */');
    Object.entries(tokens.borderRadius).forEach(([key, value]) => {
      cssVars.push(`  --radius-${key}: ${value};`);
    });
    
    // Shadows
    cssVars.push('  /* Shadows */');
    Object.entries(tokens.shadows).forEach(([key, value]) => {
      cssVars.push(`  --shadow-${key}: ${value};`);
    });
    
    cssVars.push('}');

    return {
      file: 'src/styles/variables.css',
      additions: cssVars.map((line, i) => ({
        line: i + 1,
        content: line,
      })),
      deletions: [],
    };
  }

  private generateSummary(tokens: DesignTokens): string {
    const colorCount = Object.values(tokens.colors).flat().length + 
                      Object.values(tokens.colors.semantic).flat().length;
    
    return `Extracted ${colorCount} colors, ${Object.keys(tokens.typography.fontSize).length} font sizes, ` +
           `${Object.keys(tokens.spacing).length} spacing values, and generated a complete design token system.`;
  }
}