# Component Name

A clear, concise description of the component's purpose and when to use it.

## Overview

A more detailed explanation of the component functionality, including:
- Primary use cases
- Key features
- When to use this component vs. alternatives

---

## Basic Example

```tsx
<Component variant="primary" size="md">
  Basic Example
</Component>
```

## Component API

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'primary' \| 'secondary' \| 'outline' \| 'text'` | `'primary'` | Visual style variant |
| `size` | `'xs' \| 'sm' \| 'md' \| 'lg' \| 'xl'` | `'md'` | Size of the component |
| `disabled` | `boolean` | `false` | Whether the component is disabled |
| `loading` | `boolean` | `false` | Whether the component is in a loading state |
| `fullWidth` | `boolean` | `false` | Whether the component should take full width |
| `className` | `string` | `''` | Additional CSS classes |
| `children` | `React.ReactNode` | - | Content of the component |

### TypeScript Interface

```tsx
interface ComponentProps {
  /**
   * Visual style variant of the component
   * @default 'primary'
   */
  variant?: 'primary' | 'secondary' | 'outline' | 'text';
  
  /**
   * Size of the component
   * @default 'md'
   */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  
  /**
   * Whether the component is disabled
   * @default false
   */
  disabled?: boolean;
  
  /**
   * Whether the component is in a loading state
   * @default false
   */
  loading?: boolean;
  
  /**
   * Whether the component should take the full width of its container
   * @default false
   */
  fullWidth?: boolean;
  
  /**
   * Additional CSS classes
   */
  className?: string;
  
  /**
   * Content of the component
   */
  children: React.ReactNode;
}
```

---

## Variants

### Primary (Default)

The primary variant is the most prominent style, used for primary actions.

```tsx
<Component variant="primary">Primary Variant</Component>
```

### Secondary

The secondary variant is less prominent, used for secondary actions.

```tsx
<Component variant="secondary">Secondary Variant</Component>
```

### Outline

The outline variant has a transparent background with a border, used for less emphasized actions.

```tsx
<Component variant="outline">Outline Variant</Component>
```

### Text

The text variant has no background or border, appearing as text only.

```tsx
<Component variant="text">Text Variant</Component>
```

---

## Sizes

The component comes in multiple sizes to fit different UI contexts.

```tsx
<Stack direction="row" align="center" spacing={4}>
  <Component size="xs">XS Size</Component>
  <Component size="sm">SM Size</Component>
  <Component size="md">MD Size</Component>
  <Component size="lg">LG Size</Component>
  <Component size="xl">XL Size</Component>
</Stack>
```

---

## States

### Disabled State

The component can be disabled to indicate it's not interactive.

```tsx
<Component disabled>Disabled State</Component>
```

### Loading State

The component can show a loading indicator.

```tsx
<Component loading>Loading State</Component>
```

---

## Responsive Behavior

Describe how the component responds to different screen sizes:

- On mobile (< 640px): Takes full width by default
- On tablet (≥ 640px): Maintains intrinsic width
- Font size and padding adjust appropriately for touch targets

---

## Accessibility

### WCAG Compliance

- Meets WCAG 2.1 AA standards
- Color contrast ratio: 4.5:1 for text, 3:1 for UI components
- Focus indicator visible at 3:1 contrast ratio

### Keyboard Navigation

- Tab: Focuses the component
- Space/Enter: Activates the component
- Escape: [Specific behavior if applicable]

### Screen Reader Support

- Uses semantic HTML elements
- ARIA attributes used where necessary
- States announced appropriately

### Focus Management

- Focus visible indicator follows design system
- [Special focus handling details if applicable]

---

## Best Practices

### Do's

✅ Use primary variant for the main action in a section  
✅ Maintain consistent sizes within related components  
✅ Use loading state for async operations  
✅ Provide clear, concise labels  

### Don'ts

❌ Don't use too many prominent variants in one section  
❌ Don't override the default styles unless necessary  
❌ Don't disable without providing context on why  
❌ Don't use for navigation (use Link component instead)  

---

## Related Components

- **[RelatedComponent1]**: When to use this alternative
- **[RelatedComponent2]**: When to use this alternative

---

## Implementation Examples

### With Icon

```tsx
<Component leftIcon={<IconName />}>With Left Icon</Component>
<Component rightIcon={<IconName />}>With Right Icon</Component>
```

### Full Width

```tsx
<Component fullWidth>Full Width Component</Component>
```

### With Custom Styling

```tsx
<Component className="custom-class">Custom Styled Component</Component>
```

---

## Design Guidelines

### Spacing

- Maintain 16px (1rem) spacing between components in a row
- When stacking vertically, use 24px (1.5rem) spacing
- Within forms, align consistently with other form elements

### Composition

- When using with icons, maintain 8px spacing between icon and text
- In button groups, use 8px spacing between buttons
- Align with other elements in the interface for a cohesive look

### Theming

If the component supports theming beyond standard variants:

```tsx
// Example with theme customization if applicable
<ThemeProvider theme={customTheme}>
  <Component>Themed Component</Component>
</ThemeProvider>
```