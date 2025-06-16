import * as fs from 'fs/promises';
import * as path from 'path';
import { glob } from 'glob';
import { AgentTask, AgentResult, FileEdit } from '../types';

interface DesignReview {
  currentState: {
    strengths: string[];
    weaknesses: string[];
    inconsistencies: string[];
  };
  recommendations: {
    layout: LayoutRecommendation[];
    colorScheme: ColorRecommendation[];
    typography: TypographyRecommendation[];
    spacing: SpacingRecommendation[];
    components: ComponentRecommendation[];
    overall: string[];
  };
  implementationRoadmap: {
    phase: string;
    description: string;
    tasks: string[];
    priority: 'high' | 'medium' | 'low';
  }[];
  trustworthinessFactors: {
    factor: string;
    currentScore: number; // 1-10
    targetScore: number;
    improvements: string[];
  }[];
}

interface LayoutRecommendation {
  component: string;
  issue: string;
  suggestion: string;
  example?: string;
}

interface ColorRecommendation {
  current: string;
  suggested: string;
  usage: string;
  rationale: string;
}

interface TypographyRecommendation {
  element: string;
  current: string;
  suggested: string;
  rationale: string;
}

interface SpacingRecommendation {
  area: string;
  current: string;
  suggested: string;
  impact: string;
}

interface ComponentRecommendation {
  component: string;
  enhancement: string;
  priority: 'high' | 'medium' | 'low';
}

export class DesignReviewAgent {
  async execute(task: AgentTask): Promise<AgentResult> {
    const startTime = Date.now();
    
    try {
      // Analyze current design state
      const currentState = await this.analyzeCurrentDesign(task.files);
      
      // Generate recommendations based on analysis
      const recommendations = await this.generateRecommendations(currentState, task);
      
      // Create implementation roadmap
      const roadmap = this.createImplementationRoadmap(recommendations);
      
      // Assess trustworthiness factors
      const trustFactors = this.assessTrustworthiness(currentState);
      
      const review: DesignReview = {
        currentState,
        recommendations,
        implementationRoadmap: roadmap,
        trustworthinessFactors: trustFactors,
      };
      
      // Generate documentation file with the review
      const reviewEdit = this.createReviewDocument(review);
      
      return {
        agentId: task.id,
        agentType: 'design-review',
        status: 'success',
        edits: [reviewEdit], // Only creates documentation, no actual changes
        analysis: review,
        metrics: {
          filesAnalyzed: task.files.length,
          filesModified: 1, // Only the review document
          linesAdded: reviewEdit.additions.length,
          linesRemoved: 0,
          duration: Date.now() - startTime,
        },
      };
    } catch (error) {
      return {
        agentId: task.id,
        agentType: 'design-review',
        status: 'failed',
        edits: [],
        errors: [error instanceof Error ? error.message : 'Design review failed'],
      };
    }
  }

  private async analyzeCurrentDesign(files: string[]): Promise<DesignReview['currentState']> {
    const state: DesignReview['currentState'] = {
      strengths: [],
      weaknesses: [],
      inconsistencies: [],
    };

    // Analyze CSS and component files
    for (const file of files) {
      const content = await fs.readFile(file, 'utf-8');
      const ext = path.extname(file);
      
      if (['.css', '.scss'].includes(ext)) {
        this.analyzeCSSDesign(content, file, state);
      } else if (['.tsx', '.jsx'].includes(ext)) {
        this.analyzeComponentDesign(content, file, state);
      }
    }

    // Add high-level observations
    if (state.strengths.length === 0) {
      state.strengths.push('Modular component structure');
      state.strengths.push('Consistent file organization');
    }

    return state;
  }

  private analyzeCSSDesign(content: string, filePath: string, state: DesignReview['currentState']): void {
    // Check for CSS variables (good practice)
    if (content.includes('--')) {
      state.strengths.push('Uses CSS custom properties for theming');
    }

    // Check for hardcoded colors
    const hardcodedColors = content.match(/#[0-9a-fA-F]{3,6}|rgb\([^)]+\)/g) || [];
    if (hardcodedColors.length > 10) {
      state.weaknesses.push(`Many hardcoded colors (${hardcodedColors.length}) in ${path.basename(filePath)}`);
    }

    // Check for inconsistent spacing
    const margins = content.match(/margin:\s*([^;]+);/g) || [];
    const uniqueMargins = new Set(margins);
    if (uniqueMargins.size > 15) {
      state.inconsistencies.push('Inconsistent margin values across stylesheets');
    }

    // Check for proper responsive design
    if (!content.includes('@media')) {
      state.weaknesses.push(`No responsive breakpoints in ${path.basename(filePath)}`);
    }

    // Check for modern CSS features
    if (content.includes('display: grid') || content.includes('display: flex')) {
      state.strengths.push('Uses modern CSS layout features');
    }
  }

  private analyzeComponentDesign(content: string, filePath: string, state: DesignReview['currentState']): void {
    const fileName = path.basename(filePath);

    // Check for inline styles (bad practice)
    if (content.includes('style={{') || content.includes('style={')) {
      state.weaknesses.push(`Inline styles found in ${fileName}`);
    }

    // Check for consistent className usage
    if (content.includes('className=') && content.includes('class=')) {
      state.inconsistencies.push(`Mixed className/class usage in ${fileName}`);
    }

    // Check for accessibility
    if (!content.includes('aria-') && !content.includes('role=')) {
      state.weaknesses.push(`No accessibility attributes in ${fileName}`);
    }

    // Check for semantic HTML
    if (content.includes('<div>') && !content.includes('<main>') && !content.includes('<section>')) {
      state.weaknesses.push(`Limited semantic HTML in ${fileName}`);
    }

    // Check for loading states
    if (content.includes('loading') || content.includes('isLoading')) {
      state.strengths.push('Implements loading states');
    }

    // Check for error handling UI
    if (content.includes('error') && content.includes('Error')) {
      state.strengths.push('Has error handling UI');
    }
  }

  private generateRecommendations(
    currentState: DesignReview['currentState'],
    task: AgentTask
  ): DesignReview['recommendations'] {
    const isLegalPlatform = task.description.toLowerCase().includes('legal');
    
    return {
      layout: this.generateLayoutRecommendations(currentState, isLegalPlatform),
      colorScheme: this.generateColorRecommendations(isLegalPlatform),
      typography: this.generateTypographyRecommendations(isLegalPlatform),
      spacing: this.generateSpacingRecommendations(),
      components: this.generateComponentRecommendations(currentState),
      overall: this.generateOverallRecommendations(isLegalPlatform),
    };
  }

  private generateLayoutRecommendations(
    state: DesignReview['currentState'],
    isLegalPlatform: boolean
  ): LayoutRecommendation[] {
    const recommendations: LayoutRecommendation[] = [];

    if (isLegalPlatform) {
      recommendations.push({
        component: 'Header/Navigation',
        issue: 'Navigation may not convey professional authority',
        suggestion: 'Implement a fixed header with clear hierarchy, prominent logo placement, and professional navigation items',
        example: 'Fixed top bar with firm name, practice areas dropdown, client portal access',
      });

      recommendations.push({
        component: 'Case List/Dashboard',
        issue: 'Data presentation may appear cluttered',
        suggestion: 'Use card-based layouts with clear visual hierarchy, status indicators, and ample whitespace',
        example: 'Material Design cards with color-coded case status badges',
      });

      recommendations.push({
        component: 'Forms',
        issue: 'Forms may feel overwhelming',
        suggestion: 'Break long forms into steps/sections with progress indicators',
        example: 'Multi-step form wizard with clear section headers and validation',
      });
    }

    recommendations.push({
      component: 'Page Layout',
      issue: 'Inconsistent content width and alignment',
      suggestion: 'Establish a consistent max-width container (1200-1400px) with proper responsive breakpoints',
    });

    recommendations.push({
      component: 'Sidebar/Navigation',
      issue: 'Navigation hierarchy unclear',
      suggestion: 'Implement collapsible sidebar with icon + text, clear active states, and logical grouping',
    });

    return recommendations;
  }

  private generateColorRecommendations(isLegalPlatform: boolean): ColorRecommendation[] {
    if (isLegalPlatform) {
      return [
        {
          current: 'Various blues',
          suggested: '#1a365d', // Navy blue
          usage: 'Primary brand color for headers, CTAs',
          rationale: 'Navy conveys trust, stability, and professionalism in legal contexts',
        },
        {
          current: 'Gray variations',
          suggested: '#2d3748', // Charcoal
          usage: 'Primary text color',
          rationale: 'Softer than pure black, maintains readability while appearing refined',
        },
        {
          current: 'Accent colors',
          suggested: '#2b6cb0', // Professional blue
          usage: 'Links, active states, secondary actions',
          rationale: 'Complements navy while maintaining professional appearance',
        },
        {
          current: 'Success states',
          suggested: '#065f46', // Dark green
          usage: 'Success messages, completed statuses',
          rationale: 'Muted green maintains professionalism while indicating positive states',
        },
        {
          current: 'Background',
          suggested: '#f7fafc', // Off-white
          usage: 'Page background',
          rationale: 'Subtle warmth reduces eye strain while maintaining clean appearance',
        },
      ];
    }

    return [
      {
        current: 'Primary',
        suggested: '#3182ce',
        usage: 'Primary actions and brand',
        rationale: 'Modern, accessible blue that works well across contexts',
      },
    ];
  }

  private generateTypographyRecommendations(isLegalPlatform: boolean): TypographyRecommendation[] {
    if (isLegalPlatform) {
      return [
        {
          element: 'Headings',
          current: 'System default',
          suggested: 'Playfair Display or Merriweather for h1-h2, Inter for h3-h6',
          rationale: 'Serif for main headings adds gravitas, sans-serif for subheadings maintains readability',
        },
        {
          element: 'Body text',
          current: 'System default',
          suggested: 'Inter or Source Sans Pro',
          rationale: 'Professional sans-serif optimized for screen reading of legal documents',
        },
        {
          element: 'Font sizes',
          current: 'Default browser sizes',
          suggested: 'Base: 16px, H1: 32-40px, H2: 24-28px, H3: 20px, Body: 16px, Small: 14px',
          rationale: 'Larger sizes improve readability and establish clear hierarchy',
        },
        {
          element: 'Line height',
          current: 'Default',
          suggested: '1.6-1.8 for body text, 1.2-1.3 for headings',
          rationale: 'Increased line height improves readability for dense legal text',
        },
      ];
    }

    return [
      {
        element: 'Font family',
        current: 'System default',
        suggested: 'Inter or system-ui stack',
        rationale: 'Modern, highly readable, and performs well across devices',
      },
    ];
  }

  private generateSpacingRecommendations(): SpacingRecommendation[] {
    return [
      {
        area: 'Component padding',
        current: 'Inconsistent',
        suggested: 'Base unit of 8px: 8, 16, 24, 32, 48, 64px',
        impact: 'Creates visual rhythm and consistency',
      },
      {
        area: 'Section margins',
        current: 'Variable',
        suggested: '48-64px between major sections, 24-32px between subsections',
        impact: 'Improves content scanability and reduces cognitive load',
      },
      {
        area: 'Form fields',
        current: 'Tight spacing',
        suggested: '16px between fields, 24px between field groups',
        impact: 'Reduces form anxiety and improves completion rates',
      },
      {
        area: 'Card/Container padding',
        current: 'Minimal',
        suggested: '24-32px internal padding',
        impact: 'Creates breathing room and premium feel',
      },
    ];
  }

  private generateComponentRecommendations(
    state: DesignReview['currentState']
  ): ComponentRecommendation[] {
    const recommendations: ComponentRecommendation[] = [];

    if (state.weaknesses.some(w => w.includes('loading'))) {
      recommendations.push({
        component: 'Loading states',
        enhancement: 'Add skeleton screens instead of spinners for better perceived performance',
        priority: 'medium',
      });
    }

    recommendations.push({
      component: 'Buttons',
      enhancement: 'Implement consistent button hierarchy: primary, secondary, tertiary with clear hover/active states',
      priority: 'high',
    });

    recommendations.push({
      component: 'Tables/Lists',
      enhancement: 'Add zebra striping, hover states, and clear column headers with sort indicators',
      priority: 'medium',
    });

    recommendations.push({
      component: 'Forms',
      enhancement: 'Add floating labels or clear label positioning, inline validation, and helpful placeholder text',
      priority: 'high',
    });

    recommendations.push({
      component: 'Notifications',
      enhancement: 'Implement toast notifications for actions and banner alerts for system messages',
      priority: 'medium',
    });

    return recommendations;
  }

  private generateOverallRecommendations(isLegalPlatform: boolean): string[] {
    const recommendations = [
      'Implement a comprehensive design system with documented components and patterns',
      'Add subtle animations and transitions (200-300ms) for state changes',
      'Ensure all interactive elements have focus states for accessibility',
      'Implement consistent icon usage with a professional icon library',
      'Add breadcrumb navigation for complex workflows',
    ];

    if (isLegalPlatform) {
      recommendations.push(
        'Consider adding trust signals: security badges, client testimonials, certifications',
        'Implement professional data visualizations for case analytics',
        'Add document preview capabilities with professional PDF viewer',
        'Create a polished empty state design for lists and dashboards',
        'Implement professional print styles for legal documents'
      );
    }

    return recommendations;
  }

  private createImplementationRoadmap(
    recommendations: DesignReview['recommendations']
  ): DesignReview['implementationRoadmap'] {
    return [
      {
        phase: 'Foundation',
        description: 'Establish design system basics',
        tasks: [
          'Create design tokens for colors, typography, and spacing',
          'Set up CSS variables or theme configuration',
          'Document design principles and guidelines',
        ],
        priority: 'high',
      },
      {
        phase: 'Typography & Color',
        description: 'Implement professional typography and color scheme',
        tasks: [
          'Install and configure professional fonts',
          'Apply new color palette across components',
          'Update text hierarchy and sizing',
          'Ensure WCAG AA color contrast compliance',
        ],
        priority: 'high',
      },
      {
        phase: 'Layout & Spacing',
        description: 'Refine layout structure and spacing system',
        tasks: [
          'Implement consistent spacing scale',
          'Update component padding and margins',
          'Create responsive grid system',
          'Refine page layouts and content width',
        ],
        priority: 'high',
      },
      {
        phase: 'Component Enhancement',
        description: 'Upgrade individual components',
        tasks: [
          'Redesign buttons with clear hierarchy',
          'Enhance form fields and validation',
          'Improve tables and data displays',
          'Add loading and empty states',
        ],
        priority: 'medium',
      },
      {
        phase: 'Polish & Refinement',
        description: 'Add professional finishing touches',
        tasks: [
          'Implement subtle animations and transitions',
          'Add professional icons',
          'Create consistent hover and focus states',
          'Implement notification system',
        ],
        priority: 'medium',
      },
    ];
  }

  private assessTrustworthiness(
    state: DesignReview['currentState']
  ): DesignReview['trustworthinessFactors'] {
    return [
      {
        factor: 'Visual Consistency',
        currentScore: state.inconsistencies.length > 5 ? 4 : 6,
        targetScore: 9,
        improvements: [
          'Establish and enforce design system',
          'Use consistent spacing scale',
          'Standardize component patterns',
        ],
      },
      {
        factor: 'Professional Appearance',
        currentScore: 5,
        targetScore: 9,
        improvements: [
          'Implement sophisticated color palette',
          'Use professional typography',
          'Add subtle shadows and depth',
          'Remove amateur design elements',
        ],
      },
      {
        factor: 'Information Hierarchy',
        currentScore: 6,
        targetScore: 9,
        improvements: [
          'Clear visual hierarchy with typography',
          'Consistent use of headings',
          'Better content grouping and sections',
          'Clear primary actions on each page',
        ],
      },
      {
        factor: 'User Confidence',
        currentScore: 5,
        targetScore: 9,
        improvements: [
          'Add security indicators where appropriate',
          'Implement clear feedback for all actions',
          'Show system status and progress',
          'Provide clear error recovery paths',
        ],
      },
      {
        factor: 'Attention to Detail',
        currentScore: 6,
        targetScore: 10,
        improvements: [
          'Align all elements to grid',
          'Consistent border radius usage',
          'Proper text truncation handling',
          'Polished micro-interactions',
        ],
      },
    ];
  }

  private createReviewDocument(review: DesignReview): FileEdit {
    const content = this.formatReviewAsMarkdown(review);
    
    return {
      file: 'design-review.md',
      additions: content.split('\n').map((line, i) => ({
        line: i + 1,
        content: line,
      })),
      deletions: [],
      isNewFile: true,
    };
  }

  private formatReviewAsMarkdown(review: DesignReview): string {
    let md = '# UI/UX Design Review\n\n';
    
    md += '## Executive Summary\n\n';
    md += 'This review analyzes the current design state and provides recommendations ';
    md += 'to enhance the platform\'s professional appearance and trustworthiness.\n\n';
    
    md += '## Current State Analysis\n\n';
    
    md += '### Strengths\n';
    review.currentState.strengths.forEach(s => {
      md += `- ${s}\n`;
    });
    
    md += '\n### Areas for Improvement\n';
    review.currentState.weaknesses.forEach(w => {
      md += `- ${w}\n`;
    });
    
    md += '\n### Inconsistencies\n';
    review.currentState.inconsistencies.forEach(i => {
      md += `- ${i}\n`;
    });
    
    md += '\n## Recommendations\n\n';
    
    md += '### Layout Improvements\n';
    review.recommendations.layout.forEach(l => {
      md += `\n**${l.component}**\n`;
      md += `- Issue: ${l.issue}\n`;
      md += `- Recommendation: ${l.suggestion}\n`;
      if (l.example) {
        md += `- Example: ${l.example}\n`;
      }
    });
    
    md += '\n### Color Scheme\n';
    md += '| Usage | Current | Suggested | Rationale |\n';
    md += '|-------|---------|-----------|-----------||\n';
    review.recommendations.colorScheme.forEach(c => {
      md += `| ${c.usage} | ${c.current} | ${c.suggested} | ${c.rationale} |\n`;
    });
    
    md += '\n### Typography\n';
    review.recommendations.typography.forEach(t => {
      md += `\n**${t.element}**\n`;
      md += `- Current: ${t.current}\n`;
      md += `- Suggested: ${t.suggested}\n`;
      md += `- Rationale: ${t.rationale}\n`;
    });
    
    md += '\n### Spacing System\n';
    review.recommendations.spacing.forEach(s => {
      md += `\n**${s.area}**\n`;
      md += `- Current: ${s.current}\n`;
      md += `- Suggested: ${s.suggested}\n`;
      md += `- Impact: ${s.impact}\n`;
    });
    
    md += '\n### Component Enhancements\n';
    review.recommendations.components.forEach(c => {
      md += `- **${c.component}** (${c.priority} priority): ${c.enhancement}\n`;
    });
    
    md += '\n### Overall Recommendations\n';
    review.recommendations.overall.forEach((r, i) => {
      md += `${i + 1}. ${r}\n`;
    });
    
    md += '\n## Implementation Roadmap\n\n';
    review.implementationRoadmap.forEach((phase, i) => {
      md += `### Phase ${i + 1}: ${phase.phase} (${phase.priority} priority)\n`;
      md += `${phase.description}\n\n`;
      phase.tasks.forEach(task => {
        md += `- [ ] ${task}\n`;
      });
      md += '\n';
    });
    
    md += '## Trustworthiness Assessment\n\n';
    review.trustworthinessFactors.forEach(factor => {
      md += `### ${factor.factor}\n`;
      md += `- Current Score: ${factor.currentScore}/10\n`;
      md += `- Target Score: ${factor.targetScore}/10\n`;
      md += `- Improvements needed:\n`;
      factor.improvements.forEach(imp => {
        md += `  - ${imp}\n`;
      });
      md += '\n';
    });
    
    md += '## Next Steps\n\n';
    md += '1. Review and prioritize recommendations\n';
    md += '2. Create design mockups for key components\n';
    md += '3. Implement Phase 1 (Foundation) changes\n';
    md += '4. Gather user feedback and iterate\n';
    md += '5. Continue with subsequent phases\n';
    
    return md;
  }
}