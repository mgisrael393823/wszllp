# Design System Documentation

This document outlines the design system for the legal case management application. It serves as a reference for developers and designers to ensure consistent application of design tokens and components.

## Table of Contents

1. [Design Tokens](#design-tokens)
   - [Colors](#colors)
   - [Typography](#typography)
   - [Spacing](#spacing)
   - [Shadows and Elevation](#shadows-and-elevation)
   - [Border Radius](#border-radius)
   - [Z-Index](#z-index)
   
2. [Component Guidelines](#component-guidelines)
   - [Button](#button)
   - [Card](#card)
   - [Input](#input)
   - [Select](#select)
   - [Typography](#typography-component)

3. [Best Practices](#best-practices)
   - [Color Usage](#color-usage)
   - [Typography Hierarchy](#typography-hierarchy)
   - [Spacing Consistency](#spacing-consistency)
   - [Accessibility](#accessibility)
   - [Responsive Design](#responsive-design)

## Design Tokens

The design system is built on a foundation of design tokens, which are defined in the `tailwind.config.js` file.

### Colors

Our color system is built around semantic color palettes, each with a range of shades (50-950):

**Base Colors**

- **Primary (Blue)** - Professional, trustworthy, used for primary actions and branding
- **Secondary (Teal)** - Complementary accent, used for secondary actions and supporting elements
- **Accent (Amber)** - Highlighting important information, used for notifications and badges
- **Neutral (Gray)** - Used for text, backgrounds, borders, and dividers

**Semantic Colors**

- **Success (Green)** - Positive outcomes, completion, confirmation
- **Warning (Amber)** - Caution states, pending items, attention needed
- **Error (Red)** - Critical information, errors, destructive actions

#### Usage Guidelines:

- Use `primary-600` for primary buttons and active states
- Use `secondary-600` for secondary buttons and alternative actions
- Use `accent-500` sparingly for highlighting important elements
- Use `neutral-800` for main text, `neutral-600` for secondary text, and `neutral-400` for disabled or hint text
- Use semantic colors consistently for their intended purposes across the application

### Typography

Our typography system is built around a consistent scale with semantic sizing and weight variants:

**Font Sizes**

- `xs`: 0.75rem (12px) - Fine print, footnotes, metadata
- `sm`: 0.875rem (14px) - Secondary text, captions
- `base`: 1rem (16px) - Body text, form labels, form inputs
- `lg`: 1.125rem (18px) - Large body text, subheadings
- `xl`: 1.25rem (20px) - Section headings
- `2xl`: 1.5rem (24px) - Page headings
- `3xl`: 1.875rem (30px) - Major section titles
- `4xl`: 2.25rem (36px) - Dashboard main titles

**Font Weights**

- `light`: 300 - Decorative text
- `normal`: 400 - Body text
- `medium`: 500 - Emphasis, subheadings
- `semibold`: 600 - Section headings
- `bold`: 700 - Important elements
- `extrabold`: 800 - Main titles

**Line Heights**

- `none`: 1 - Headings, single-line elements
- `tight`: 1.25 - Dense information displays
- `snug`: 1.375 - Compact displays
- `normal`: 1.5 - Body text
- `relaxed`: 1.625 - Long-form content
- `loose`: 2 - Spacious content

#### Usage Guidelines:

- Use appropriate semantic text styles for content hierarchy
- Maintain a consistent type scale throughout the application
- Use the Typography component for consistent text styling
- Ensure proper contrast ratios between text and background (4.5:1 minimum)
- Keep body text at `base` size (16px) or larger for readability

### Spacing

Our spacing system uses a consistent scale based on 4px increments:

- `0`: 0
- `px`: 1px
- `0.5`: 0.125rem (2px)
- `1`: 0.25rem (4px)
- `1.5`: 0.375rem (6px)
- `2`: 0.5rem (8px)
- `2.5`: 0.625rem (10px)
- `3`: 0.75rem (12px)
- `3.5`: 0.875rem (14px)
- `4`: 1rem (16px)
- `5`: 1.25rem (20px)
- `6`: 1.5rem (24px)
- `8`: 2rem (32px)
- `10`: 2.5rem (40px)
- `12`: 3rem (48px)
- `16`: 4rem (64px)
- `20`: 5rem (80px)
- `24`: 6rem (96px)

#### Semantic Spacing:

- **Content spacing**: `contentCompact` (16px), `contentNormal` (24px), `contentRelaxed` (32px)
- **Layout spacing**: `layoutCompact` (24px), `layoutNormal` (32px), `layoutRelaxed` (48px)
- **Component spacing**: `componentTight` (8px), `componentNormal` (16px), `componentRelaxed` (24px)
- **Form spacing**: `formFieldGap` (24px), `formGroupGap` (32px), `formSectionGap` (48px)

#### Usage Guidelines:

- Use consistent spacing between related elements (8px/16px/24px)
- Maintain consistent padding within components (16px/24px)
- Use larger spacing (32px/48px) between major sections
- Double spacing between unrelated groups of content

### Shadows and Elevation

Our shadow system establishes a clear visual hierarchy through elevation:

**Shadow Tokens**

- `shadow-xs`: 0 1px 2px rgba(0, 0, 0, 0.05) - Subtle elements
- `shadow-sm`: 0 1px 3px rgba(0, 0, 0, 0.1) - Cards, panels
- `shadow-md`: 0 4px 6px rgba(0, 0, 0, 0.1) - Elevated elements
- `shadow-lg`: 0 10px 15px rgba(0, 0, 0, 0.1) - Modals, popovers
- `shadow-xl`: 0 20px 25px rgba(0, 0, 0, 0.1) - Dropdowns, tooltips
- `shadow-2xl`: 0 25px 50px rgba(0, 0, 0, 0.25) - Highest elevation

**Elevation System**

- `base`: Base document level (z-index: 0)
- `raised`: Cards, panels (z-index: 10)
- `sticky`: Sticky headers (z-index: 20)
- `floating`: Floating elements (z-index: 30)
- `overlay`: Modal backgrounds (z-index: 50)
- `modal`: Modal dialogs (z-index: 60)
- `notification`: Toasts, notifications (z-index: 70)

#### Usage Guidelines:

- Use shadows to indicate interactive elements
- Increase shadow depth for higher stacking context
- Apply shadows consistently based on elevation hierarchy
- Avoid conflicting shadows in adjacent elements

### Border Radius

Our border radius system provides consistent rounding:

- `none`: 0 - No rounding
- `sm`: 0.125rem (2px) - Subtle rounding
- `DEFAULT`: 0.25rem (4px) - Default rounding for most elements
- `md`: 0.375rem (6px) - Medium rounding
- `lg`: 0.5rem (8px) - Large rounding for buttons, cards
- `xl`: 0.75rem (12px) - Extra large rounding
- `2xl`: 1rem (16px) - Very pronounced rounding
- `3xl`: 1.5rem (24px) - Extreme rounding
- `full`: 9999px - Circular or pill shapes

#### Usage Guidelines:

- Use consistent border radius across similar components
- Use larger radiuses for floating elements (cards, modals)
- Use smaller radiuses for inline elements (buttons, inputs)
- Consider using pill shapes (`full`) for tags and badges

### Z-Index

Our z-index system establishes clear layering:

- `0`: Base document (base content)
- `10`: Cards, panels (raised elements)
- `20`: Sticky headers (sticky navigation)
- `30`: Floating elements (tooltips, popovers)
- `40`: Dropdowns
- `50`: Modal backgrounds (overlays)
- `60`: Modals (dialogs)
- `70`: Toasts, notifications (alerts)

#### Usage Guidelines:

- Follow the established z-index hierarchy
- Avoid creating custom z-index values
- Use the appropriate z-index based on the element's purpose
- Consider component stacking when developing new features

## Component Guidelines

Our design system includes consistent patterns for common components:

### Button

The Button component supports multiple variants, sizes, and states:

**Variants**

- `primary`: Main actions (blue)
- `secondary`: Alternative actions (teal)
- `accent`: Highlighted actions (amber)
- `outline`: Secondary actions with low emphasis
- `danger`: Destructive actions (red)
- `success`: Positive actions (green)
- `text`: Minimal emphasis actions

**Sizes**

- `xs`: Extra small buttons for tight spaces
- `sm`: Small buttons for secondary actions
- `md`: Standard button size (default)
- `lg`: Large buttons for primary page actions

**Elevation**

- `none`: No shadow (default)
- `low`: Subtle shadow
- `medium`: Moderate shadow
- `high`: Pronounced shadow

**States**

- Default
- Hover
- Active
- Disabled
- Loading

**Usage Guidelines**

- Use `primary` for the main action on a page or in a section
- Limit primary buttons to one per logical section
- Use `secondary` or `outline` for alternative actions
- Use `text` buttons for low-emphasis actions
- Use consistent sizing within button groups
- Include icons to enhance clarity when appropriate
- Always provide a visual loading state for async actions

### Card

The Card component provides a flexible container with consistent styling:

**Variants**

- `default`: Standard white card
- `primary`: Primary-colored highlight card
- `secondary`: Secondary-colored highlight card
- `accent`: Accent-colored highlight card
- `success`: Success-colored highlight card
- `error`: Error-colored highlight card
- `warning`: Warning-colored highlight card

**Elevation**

- `flat`: No shadow
- `low`: Subtle shadow (default)
- `medium`: Moderate shadow
- `high`: Pronounced shadow

**Border Styles**

- `none`: No border
- `light`: Light border (default)
- `normal`: Standard border
- `accent`: Accent-colored border

**Usage Guidelines**

- Use cards to group related content
- Maintain consistent padding within cards
- Use appropriate elevation for the card's purpose
- Consider making cards interactive with the `onClick` prop when appropriate
- Use semantic variants to indicate the nature of the content

### Input

The Input component provides flexible form controls with consistent styling:

**Variants**

- `default`: Standard input with border (default)
- `filled`: Input with background fill
- `outlined`: Input with thicker outline
- `unstyled`: Minimal styling for custom layouts

**Sizes**

- `sm`: Small inputs for compact forms
- `md`: Standard input size (default)
- `lg`: Large inputs for emphasis or touch targets

**States**

- Default
- Focus
- Error
- Success
- Warning
- Disabled

**Usage Guidelines**

- Always provide clear labels for inputs
- Use consistent input sizing within form groups
- Always show clear error messages for validation failures
- Consider using icons to enhance clarity
- Group related inputs using consistent spacing
- Use appropriate validation states (error, success, warning)

### Select

The Select component provides consistent dropdown styling:

**Variants**

- `default`: Standard select with border (default)
- `filled`: Select with background fill
- `outlined`: Select with thicker outline
- `unstyled`: Minimal styling for custom layouts

**Sizes**

- `sm`: Small select for compact forms
- `md`: Standard select size (default)
- `lg`: Large select for emphasis or touch targets

**States**

- Default
- Focus
- Error
- Success
- Warning
- Disabled

**Usage Guidelines**

- Always provide clear labels for select dropdowns
- Consider using option groups for long option lists
- Provide a meaningful placeholder
- Maintain consistent width with other inputs in the form
- Consider using custom select components for enhanced functionality

### Typography Component

The Typography component ensures consistent text styling:

**Variants**

- `h1`, `h2`, `h3`, `h4`, `h5`, `h6`: Heading levels
- `subtitle1`, `subtitle2`: Supporting headings
- `body1`, `body2`: Body text
- `caption`: Small utility text
- `overline`: All-caps label text
- `legal`: Legal text and fine print

**Text Alignment**

- `left`: Left-aligned text (default)
- `center`: Center-aligned text
- `right`: Right-aligned text
- `justify`: Justified text for long content

**Text Colors**

- `default`: Standard text color (dark gray)
- `primary`, `secondary`, `accent`: Brand colors
- `success`, `error`, `warning`: Semantic colors
- `light`, `medium`, `dark`: Gray variations

**Usage Guidelines**

- Use appropriate heading levels for content hierarchy
- Maintain consistent text styles for similar content
- Use semantic variants rather than custom styling
- Consider text color for appropriate contrast
- Use the Typography component for all text to ensure consistency

## Best Practices

### Color Usage

- Use primary colors for main UI elements and actions
- Use secondary colors for supporting elements and alternative actions
- Use accent colors sparingly for emphasis
- Use neutral colors for most UI elements (text, backgrounds, borders)
- Use semantic colors (success/warning/error) consistently for their intended purposes
- Ensure color combinations meet WCAG 2.1 AA contrast requirements (4.5:1 for normal text)
- Don't rely on color alone to convey meaning; use icons, labels, or patterns

### Typography Hierarchy

- Use the type scale to establish a clear visual hierarchy
- Keep body text at 16px (1rem) for optimal readability
- Use weight and size variations to create contrast between elements
- Use consistent text styling for similar elements across the application
- Limit the number of font sizes on a single page
- Use the Typography component for consistent text styling

### Spacing Consistency

- Use the spacing scale consistently throughout the application
- Maintain consistent spacing within component types
- Use larger spacing to separate distinct sections
- Ensure appropriate spacing for touch targets (minimum 44x44px)
- Use consistent form field spacing for better alignment
- Create rhythm through consistent spacing patterns

### Accessibility

- Ensure sufficient color contrast (4.5:1 for normal text, 3:1 for large text)
- Provide focus indicators for keyboard navigation
- Use semantic HTML elements via appropriate component props
- Ensure form elements have proper labels
- Test with screen readers and keyboard navigation
- Follow WCAG 2.1 AA standards throughout the application

### Responsive Design

- Use the built-in breakpoints for consistent responsive behavior
- Design mobile-first, then enhance for larger screens
- Consider touch targets on mobile (minimum 44x44px)
- Test layouts at each breakpoint
- Adjust typography and spacing appropriately for different screen sizes
- Use flexbox and grid layout for responsive components