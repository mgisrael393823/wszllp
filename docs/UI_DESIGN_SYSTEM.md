# WSZLLP Design System

This repository contains the design system for the WSZLLP legal case management application. The design system provides a consistent, accessible, and maintainable foundation for the application's user interface.

## Table of Contents

1. [Introduction](#introduction)
2. [Design Tokens](#design-tokens)
3. [Components](#components)
4. [Usage Guidelines](#usage-guidelines)
5. [Development](#development)
6. [Accessibility](#accessibility)

## Introduction

The WSZLLP Design System is built on top of Tailwind CSS and React, providing a flexible yet consistent approach to building user interfaces. It emphasizes:

- **Consistency**: Unified visual language across the application
- **Accessibility**: WCAG 2.1 AA compliant components and patterns
- **Efficiency**: Reusable components that speed up development
- **Scalability**: Easy to extend and maintain
- **Professionalism**: A clean, modern aesthetic appropriate for legal applications

## Design Tokens

Our design tokens are defined in the following locations:

- `tailwind.config.js`: Configuration for Tailwind CSS
- `src/styles/designTokens.ts`: JavaScript constants for programmatic access 
- `src/styles/DESIGN_SYSTEM.md`: Detailed documentation

### Core Design Tokens

1. **Colors**
   - Primary (Blue): Professional, trustworthy
   - Secondary (Teal): Complementary accent
   - Accent (Amber): Highlighting, attention
   - Neutral (Gray): Text, backgrounds, borders
   - Semantic: Success, Warning, Error

2. **Typography**
   - Font sizes from xs (12px) to 4xl (36px)
   - Font weights from light (300) to extrabold (800)
   - Line heights from none (1) to loose (2)

3. **Spacing**
   - Consistent 4px-based scale (4px, 8px, 16px, 32px, etc.)
   - Semantic spacing (content, layout, component, form)

4. **Shadows & Elevation**
   - Hierarchy of shadows from xs to 2xl
   - Z-index system from 0 to 70

5. **Border Radius**
   - Consistent roundness scale
   - From none to full (circular) 

## Components

Our component library provides the building blocks for the application interface:

### Basic Components

- **Button**: Action triggers with multiple variants, sizes, and states
- **Card**: Content containers with various styles and functionality
- **Typography**: Text components for consistent typography
- **Input**: Form inputs with validation states
- **Select**: Dropdown selection components
- **Modal**: Dialog overlays for focused interactions
- **Table**: Data display with sorting, filtering, and formatting

### Usage Examples

Button:
```jsx
<Button 
  variant="primary"
  size="md"
  elevation="low"
  loading={isSubmitting}
  onClick={handleSubmit}
>
  Submit Case
</Button>
```

Typography:
```jsx
<Typography 
  variant="h1" 
  color="primary"
  align="center"
>
  Case Management Dashboard
</Typography>

<Typography variant="body1">
  Regular body text for the application.
</Typography>
```

Card:
```jsx
<Card
  title="Case Summary"
  subtitle="Last updated: Yesterday"
  variant="default"
  elevation="medium"
  footer={<Button variant="text">View Details</Button>}
>
  Card content goes here
</Card>
```

## Usage Guidelines

### General Principles

1. **Consistency**: Use the same component patterns for similar functionality
2. **Hierarchy**: Establish clear visual hierarchy through typography, color, and spacing
3. **Feedback**: Provide clear visual feedback for user interactions
4. **Guidance**: Use appropriate messaging and indicators to guide users
5. **Efficiency**: Optimize layouts for task completion

### Component-Specific Guidelines

See the detailed guidelines in `src/styles/DESIGN_SYSTEM.md` for component-specific usage recommendations.

## Development

### Project Structure

The design system is organized as follows:

```
src/
├── components/
│   └── ui/              # Core UI components
│       ├── Button.tsx
│       ├── Card.tsx
│       ├── Input.tsx
│       ├── Modal.tsx
│       ├── Select.tsx
│       ├── Table.tsx
│       └── Typography.tsx
├── styles/
│   ├── DESIGN_SYSTEM.md   # Full documentation
│   └── designTokens.ts    # Token definitions
└── index.css             # Global styles
tailwind.config.js        # Tailwind configuration
```

### Adding New Components

When adding new components:

1. Follow existing patterns and naming conventions
2. Use design tokens for colors, spacing, etc.
3. Ensure accessibility compliance
4. Document the component properties and usage
5. Include appropriate storybook examples

## Accessibility

All components in the design system are designed to be accessible and comply with WCAG 2.1 AA guidelines. Key considerations include:

- **Color contrast**: Ensures text is readable (4.5:1 minimum contrast ratio)
- **Keyboard navigation**: All interactive elements are keyboard accessible
- **Screen reader support**: Proper ARIA attributes and semantic HTML
- **Focus management**: Clear focus indicators for keyboard users
- **Responsive design**: Works across devices and zoom levels

## License

This design system is proprietary and intended for use within WSZLLP applications only.