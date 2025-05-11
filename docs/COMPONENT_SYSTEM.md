# WSZLLP Component System Guidelines

This document outlines our comprehensive approach to component design, development, and maintenance for the WSZLLP legal case management system.

## Table of Contents

1. [Component Audit Strategy](#component-audit-strategy)
2. [Component API Standardization](#component-api-standardization)
3. [Component System Extensions](#component-system-extensions)
4. [Component Documentation Framework](#component-documentation-framework)
5. [Implementation Process](#implementation-process)

---

## Component Audit Strategy

### Automated Analysis Tools

We use a combination of automated tools to identify inconsistencies:

```bash
# Install required packages
npm install eslint-plugin-react typescript-react-component-analyzer axe-core tailwind-analyzer

# Run component structure analysis
npx typescript-react-component-analyzer --src ./src/components --output ./reports/component-analysis.json

# Run accessibility checks
npx axe --include "./src/components/**/*.tsx" --output ./reports/a11y-report.json

# Run Tailwind class usage analysis
npx tailwind-analyzer --src "./src/components/**/*.tsx" --output ./reports/tailwind-usage.json
```

### Component Inventory

Maintain a comprehensive component inventory using the following structure:

| Component | Version | Variants | Sizes | A11y Level | Props Consistency | Usage Count |
|-----------|---------|----------|-------|------------|-------------------|-------------|
| Button    | 1.2.0   | ✅ 6/6   | ✅ 4/4 | AA         | 95%               | 247         |
| Card      | 1.1.0   | ✅ 5/6   | ✅ 3/4 | AA         | 90%               | 186         |
| Modal     | 1.0.1   | ✅ 4/6   | ✅ 3/4 | A          | 85%               | 42          |

### Manual Review Process

**Monthly Component Review**

1. **Visual Consistency Check**
   - Review each component against design system specs
   - Document style deviations in the component inventory
   - Create tickets for required visual updates

2. **Behavioral Consistency Check**
   - Review interaction patterns across similar components
   - Document inconsistent behaviors
   - Prioritize harmonization of interaction patterns

3. **Prop Interface Review**
   - Review prop interfaces across component families
   - Document naming inconsistencies
   - Create tickets for prop interface harmonization

### Usage Pattern Analysis

Track component usage with custom ESLint rules:

```javascript
// .eslintrc.js example rule
{
  "rules": {
    "wszllp/consistent-component-usage": ["warn", {
      "Button": {
        "requiredProps": ["variant", "size"],
        "deprecatedProps": ["color"]
      }
    }]
  }
}
```

Analyze component usage patterns quarterly:
- Components with low usage (candidates for removal)
- Components with duplicate functionality
- Components that frequently have many custom overrides

---

## Component API Standardization

### Prop Naming Conventions

All components should follow these consistent prop naming patterns:

#### Core Props

| Concept               | Prop Name          | Type                                                  | Description                                     |
|-----------------------|--------------------|---------------------------------------------------------|--------------------------------------------------|
| Visual style          | `variant`          | String enum                                           | Primary visual style (`primary`, `secondary`, etc.) |
| Component size        | `size`             | String enum                                           | Component size (`xs`, `sm`, `md`, `lg`, `xl`)   |
| Full width display    | `fullWidth`        | Boolean                                               | Whether component takes full width of parent    |
| Disabled state        | `disabled`         | Boolean                                               | Whether component is disabled                   |
| Loading state         | `loading`          | Boolean                                               | Whether component is in loading state           |
| Required field        | `required`         | Boolean                                               | Whether input is required in form               |
| Custom styling        | `className`        | String                                                | Custom CSS classes to apply                     |
| Child elements        | `children`         | React.ReactNode                                       | Child elements                                  |
| HTML attributes       | `...rest`          | HTMLAttributes                                        | Spread remaining HTML attributes                |

#### Common Event Handler Props

| Event Handler            | Prop Name                  | Signature                                          |
|--------------------------|----------------------------|---------------------------------------------------|
| Click handler            | `onClick`                  | `(event: React.MouseEvent) => void`               |
| Change handler           | `onChange`                 | `(value: T, event?: React.ChangeEvent) => void`   |
| Focus handler            | `onFocus`                  | `(event: React.FocusEvent) => void`               |
| Blur handler             | `onBlur`                   | `(event: React.FocusEvent) => void`               |
| Submit handler           | `onSubmit`                 | `(event: React.FormEvent) => void`                |
| Key press handler        | `onKeyPress`               | `(event: React.KeyboardEvent) => void`            |

#### Component-Specific Props

| Component Type          | Specific Props                                               |
|-------------------------|--------------------------------------------------------------|
| Form components         | `label`, `error`, `hint`, `success`, `warning`               |
| Container components    | `header`, `footer`, `title`, `subtitle`                      |
| Interactive components  | `icon`, `leftIcon`, `rightIcon`, `onClick`, `onHover`        |
| Data display components | `data`, `columns`, `keyField`, `isLoading`, `emptyMessage`   |

### Component Variant Strategy

#### Size Variants

All components should support a consistent set of sizes:

```typescript
type ComponentSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
```

Size implementation guidelines:
- `xs`: Compact, minimal padding (e.g., px-2 py-1, text-xs)
- `sm`: Small, reduced padding (e.g., px-3 py-1.5, text-sm)
- `md`: Default size (e.g., px-4 py-2, text-sm/text-base)
- `lg`: Large, increased padding (e.g., px-6 py-3, text-base)
- `xl`: Extra large (e.g., px-8 py-4, text-lg)

#### Style Variants

Components should support consistent style variants:

```typescript
type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'text' | 'danger' | 'success';
type CardVariant = 'default' | 'primary' | 'secondary' | 'outline' | 'accent';
type AlertVariant = 'info' | 'success' | 'warning' | 'error';
```

Variant implementation guidelines:
- `primary`: Main brand color, high emphasis
- `secondary`: Secondary brand color, medium emphasis
- `outline`: Bordered style, lower emphasis
- `text`: Text-only style, lowest emphasis
- `danger`/`error`: Destructive actions, error states
- `success`: Positive feedback, success states
- `warning`: Cautionary feedback, warning states
- `info`: Informational, neutral feedback

#### State Variants

All interactive components should handle these states consistently:

1. **Default state**: Normal appearance
2. **Hover state**: Visual feedback on hover
3. **Active/Pressed state**: Visual feedback when pressed
4. **Focus state**: Visual indication when focused with keyboard
5. **Disabled state**: Visually muted, non-interactive
6. **Loading state**: Shows loading indicator, prevents interaction
7. **Error state**: Indicates validation errors
8. **Success state**: Indicates successful validation

### Accessibility Requirements

#### Global Requirements

All components must satisfy these baseline requirements:

1. **Keyboard accessibility**
   - All interactive elements must be focusable and operable with keyboard
   - Focus order must follow logical document flow
   - Custom keyboard shortcuts should be documented

2. **Screen reader support**
   - Meaningful text alternatives for non-text content
   - Proper semantic structure using appropriate HTML elements
   - ARIA attributes when native semantics are insufficient

3. **Visual design**
   - Minimum 4.5:1 color contrast ratio for text (WCAG AA)
   - Visual information not conveyed through color alone
   - Text resizable up to 200% without loss of content/functionality

#### Component-Specific Requirements

| Component Type | Accessibility Requirements |
|----------------|----------------------------|
| Buttons | - Use native `<button>` element<br>- Add `aria-pressed` for toggle buttons<br>- Add `aria-disabled` when visually disabled<br>- Provide text for icon-only buttons with `aria-label` |
| Form Inputs | - Associate with label via `id`/`for`<br>- Include validation feedback with `aria-describedby`<br>- Use `aria-invalid` for error states<br>- Group related inputs with `fieldset`/`legend` |
| Modal Dialogs | - Use `role="dialog"`<br>- Set `aria-modal="true"`<br>- Trap focus within modal<br>- Return focus on close<br>- Close on Escape key |
| Tables | - Use proper table structure (`<table>`, `<th>`, `<td>`)<br>- Include captions<br>- Mark headers with `scope`<br>- Complex tables need `headers`/`id` |
| Tabs | - Use `role="tablist"`, `role="tab"`, `role="tabpanel"`<br>- Connect panels to tabs with `aria-controls`<br>- Indicate state with `aria-selected`<br>- Handle arrow key navigation |

---

## Component System Extensions

### New Atomic Components

#### Visual Elements

| Component | Purpose | Variants | Key Props |
|-----------|---------|----------|-----------|
| Avatar | Display user/entity | image, initials, icon | `src`, `alt`, `size`, `shape` |
| Badge | Status indicators | primary, success, warning, error | `variant`, `count`, `dot` |
| Divider | Visual separation | horizontal, vertical | `orientation`, `thickness`, `color` |
| Icon | Visual communication | outlined, filled, tonal | `name`, `size`, `color` |
| Tooltip | Contextual information | dark, light, info | `content`, `position`, `delay` |

#### Form Inputs

| Component | Purpose | Variants | Key Props |
|-----------|---------|----------|-----------|
| Checkbox | Boolean selection | default, card, switch | `checked`, `onChange`, `indeterminate` |
| DatePicker | Date selection | single, range, inline | `value`, `onChange`, `format`, `minDate` |
| FileUpload | File selection | drag-drop, button, multi | `accept`, `multiple`, `maxSize`, `onUpload` |
| RadioGroup | Single selection | default, card, button | `options`, `value`, `onChange` |
| Slider | Range selection | single, range, marks | `min`, `max`, `step`, `value` |
| TextArea | Multiline text input | resizable, fixed, auto | `rows`, `minRows`, `maxRows`, `resize` |
| TimePicker | Time selection | 12h, 24h, with seconds | `value`, `format`, `step`, `onChange` |

#### Data Display

| Component | Purpose | Variants | Key Props |
|-----------|---------|----------|-----------|
| Code | Source code display | inline, block, with theme | `language`, `theme`, `showLineNumbers` |
| CountBadge | Numeric indicators | primary, secondary, rounded | `count`, `max`, `color` |
| Kbd | Keyboard key display | default, small, large | `keys`, `separator` |
| Tag | Category indicators | removable, interactive | `label`, `onRemove`, `color` |
| ToggleGroup | Button group selection | single, multiple | `options`, `value`, `onChange` |

### Composite Components

#### Navigation Components

| Component | Purpose | Key Props |
|-----------|---------|-----------|
| Breadcrumbs | Hierarchical navigation | `items`, `separator`, `maxItems` |
| Menu | Dropdown options | `items`, `trigger`, `placement` |
| Pagination | Navigate through pages | `total`, `current`, `pageSize`, `onChange` |
| Stepper | Multi-step process | `steps`, `current`, `orientation` |
| Tabs | Content organization | `tabs`, `activeTab`, `onChange` |

#### Content Components

| Component | Purpose | Key Props |
|-----------|---------|-----------|
| AlertBanner | System notification | `title`, `description`, `variant`, `onClose` |
| EmptyState | No-content display | `icon`, `title`, `description`, `action` |
| ErrorBoundary | Error handling | `fallback`, `onError`, `resetKeys` |
| LoadingState | Loading indicator | `text`, `variant`, `size` |
| Skeleton | Content loading | `variant`, `width`, `height`, `animated` |

#### Legal-Specific Components

| Component | Purpose | Key Props |
|-----------|---------|-----------|
| CaseCard | Case summary | `caseNumber`, `title`, `status`, `client`, `priority` |
| CaseTimeline | Case event history | `events`, `currentEvent`, `orientation` |
| DocumentCard | Document preview | `documentName`, `type`, `uploadDate`, `author` |
| HearingCard | Hearing details | `date`, `time`, `court`, `judge`, `status` |
| StatusTracker | Case progress | `stages`, `currentStage`, `completedStages` |

### Data Visualization Components

#### Chart Components

| Component | Purpose | Variants | Key Props |
|-----------|---------|----------|-----------|
| AreaChart | Volume visualization | stacked, line, gradient | `data`, `xAxis`, `yAxis`, `colors` |
| BarChart | Comparison | vertical, horizontal, grouped | `data`, `keys`, `indexBy`, `colors` |
| LineChart | Trend visualization | single, multi, area | `data`, `series`, `xScale`, `yScale` |
| PieChart | Distribution | pie, donut, semi-circle | `data`, `valueKey`, `labelKey`, `colors` |
| ScatterPlot | Correlation | dots, bubbles | `data`, `xKey`, `yKey`, `sizeKey` |

#### Data Display Components

| Component | Purpose | Key Props |
|-----------|---------|-----------|
| DataCard | Key metric display | `title`, `value`, `change`, `changeType`, `icon` |
| HeatMap | Density visualization | `data`, `xLabels`, `yLabels`, `colorScale` |
| KPICard | Performance indicator | `title`, `value`, `target`, `trend`, `period` |
| MetricComparison | Before/after | `title`, `before`, `after`, `change`, `unit` |
| ProgressBar | Completion visualization | `value`, `max`, `showPercentage`, `variant` |

#### Styling Guidelines

Each data visualization component should follow these styling principles:

1. **Color Usage**
   - Use design system colors for consistency
   - Ensure 3:1 minimum contrast for data visualization elements
   - Include patterns with colors for colorblind accessibility

2. **Typography**
   - Use smaller text (`sm` or `xs`) for labels and annotations
   - Use larger text (`lg` or above) for key metrics
   - Maintain consistent font family throughout

3. **Spacing**
   - Consistent padding within components (typically `p-4` to `p-6`)
   - Adequate spacing between data points
   - Proper margin between chart elements

4. **Responsiveness**
   - Responsive sizing with min/max constraints
   - Mobile-friendly touch targets
   - Appropriate legend placement for different screens

5. **Interactions**
   - Consistent hover states for data points
   - Tooltips for additional information
   - Keyboard accessible interactions

---

## Component Documentation Framework

### Documentation Structure

Each component should have a dedicated documentation page with the following sections:

1. **Overview**
   - Purpose and typical use cases
   - When to use this component vs. alternatives
   - Key features and capabilities

2. **Live Examples**
   - Basic implementation example
   - Examples of each variant
   - Interactive playground for prop manipulation

3. **Implementation Details**
   - Prop API reference
   - Code examples for common use cases
   - Integration examples with other components

4. **Accessibility**
   - WCAG compliance level
   - Keyboard interaction description
   - Screen reader behavior
   - Specific accessibility considerations

5. **Design Guidelines**
   - Spacing recommendations
   - Usage restrictions
   - Responsive behavior
   - Common customizations

### Usage Examples Format

```tsx
/**
 * Basic usage of the Button component.
 */
export const BasicExample = () => {
  return <Button>Click me</Button>;
};

/**
 * Button variants to show different emphasis levels.
 */
export const VariantsExample = () => {
  return (
    <Stack direction="row" spacing={4}>
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="text">Text</Button>
    </Stack>
  );
};

/**
 * Button sizes from smallest to largest.
 */
export const SizesExample = () => {
  return (
    <Stack direction="row" align="center" spacing={4}>
      <Button size="xs">Extra Small</Button>
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
      <Button size="lg">Large</Button>
      <Button size="xl">Extra Large</Button>
    </Stack>
  );
};

/**
 * Buttons in different states.
 */
export const StatesExample = () => {
  return (
    <Stack direction="row" spacing={4}>
      <Button>Default</Button>
      <Button disabled>Disabled</Button>
      <Button loading>Loading</Button>
    </Stack>
  );
};
```

### Prop Documentation Format

Each component's props should be documented in a table format:

```markdown
## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'primary' \| 'secondary' \| 'outline' \| 'text'` | `'primary'` | The visual style variant of the button |
| `size` | `'xs' \| 'sm' \| 'md' \| 'lg' \| 'xl'` | `'md'` | The size of the button |
| `disabled` | `boolean` | `false` | Whether the button is disabled |
| `loading` | `boolean` | `false` | Whether the button is in a loading state |
| `fullWidth` | `boolean` | `false` | Whether the button should take the full width of its container |
| `leftIcon` | `React.ReactNode` | `undefined` | Icon to display at the left side of the button text |
| `rightIcon` | `React.ReactNode` | `undefined` | Icon to display at the right side of the button text |
| `onClick` | `(event: React.MouseEvent) => void` | `undefined` | Function called when the button is clicked |
| `type` | `'button' \| 'submit' \| 'reset'` | `'button'` | The type attribute of the button |
| `className` | `string` | `''` | Additional CSS classes to apply |
```

For complex prop structures, include extended documentation:

```typescript
/**
 * Column configuration for the Table component
 */
export interface Column<T> {
  /**
   * Header text for the column
   */
  header: string;
  
  /**
   * Property from the data object to display, or function to transform the data
   */
  accessor: keyof T | ((item: T) => React.ReactNode);
  
  /**
   * Whether the column is sortable
   * @default false
   */
  sortable?: boolean;
  
  /**
   * Custom CSS class to apply to the column
   */
  className?: string;
  
  /**
   * Custom width for the column (CSS value)
   * @example "200px", "10%"
   */
  width?: string;
  
  /**
   * Custom cell renderer
   */
  renderCell?: (value: any, row: T, index: number) => React.ReactNode;
}
```

### Accessibility Documentation

Each component's accessibility section should include:

```markdown
## Accessibility

### WCAG Compliance
- Meets WCAG 2.1 AA standards
- Color contrast ratio: 4.5:1 (text), 3:1 (UI components)

### Keyboard Navigation
- Tab: Focuses the button
- Space/Enter: Activates the button
- Escape: Cancels operation (for certain modal buttons)

### Screen Reader Support
- Uses native `<button>` element for proper semantics
- Icon-only buttons include `aria-label` for screen reader users
- Loading state announced via `aria-busy` and status text

### Focus Management
- Visible focus indicator matching design system
- Focus indicator meets 3:1 contrast ratio
- Focus not trapped except in modal contexts

### States
- Disabled state conveyed via `aria-disabled` and visual styling
- Loading state indicated via `aria-busy` and visual indicator
- Error states linked to error messages via `aria-describedby`
```

---

## Implementation Process

### Component Development Workflow

1. **Specification Phase**
   - Define component purpose and requirements
   - Create detailed prop interface
   - Establish behavior specifications
   - Document accessibility requirements

2. **Design Review**
   - Validate against design system
   - Confirm responsive behavior
   - Verify accessibility compliance
   - Approve final design

3. **Implementation**
   - Create component skeleton
   - Implement core functionality
   - Add variants and states
   - Write unit and integration tests

4. **Documentation**
   - Write usage documentation
   - Create example implementations
   - Document accessibility features
   - Add to component gallery

5. **Review & Iteration**
   - Code review
   - Accessibility audit
   - UX testing
   - Performance testing

### Component Quality Checklist

- [ ] Follows prop naming conventions
- [ ] Implements all standard variants
- [ ] Supports all required sizes
- [ ] Handles all expected states
- [ ] Meets accessibility requirements
- [ ] Has comprehensive tests
- [ ] Includes complete documentation
- [ ] Responsive on all supported screen sizes
- [ ] Follows performance best practices

### Deprecation Strategy

1. **Mark as Deprecated**
   - Add `@deprecated` JSDoc tag
   - Add console warning in development mode
   - Update documentation

2. **Provide Migration Path**
   - Document alternative component
   - Create migration examples
   - Provide automated codemod if possible

3. **Maintain Support**
   - Continue bug fixes during deprecation period
   - Set timeline for removal (minimum 3 months)

4. **Remove Component**
   - Remove after deprecation period
   - Update all documentation
   - Make major version release