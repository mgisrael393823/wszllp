# WSZLLP Component System Documentation

This directory contains comprehensive documentation for the WSZLLP legal case management system component library.

## Documentation Structure

- **[COMPONENT_SYSTEM.md](./COMPONENT_SYSTEM.md)**: Overall component system architecture, standards, and guidelines
- **[COMPONENT_AUDIT_TEMPLATE.md](./COMPONENT_AUDIT_TEMPLATE.md)**: Template for component audits
- **[COMPONENT_DOCUMENTATION_TEMPLATE.md](./COMPONENT_DOCUMENTATION_TEMPLATE.md)**: Template for component documentation
- **[COMPONENT_DEVELOPMENT_CHECKLIST.md](./COMPONENT_DEVELOPMENT_CHECKLIST.md)**: Checklist for component development

## Automated Tools

The following scripts are available to help maintain component quality:

```bash
# Run component structure analysis
npm run audit:components

# Run accessibility audit
npm run audit:a11y

# Run both audits
npm run audit

# Generate component documentation
npm run docs:generate
```

## Component Development Process

1. **Planning & Specification**
   - Ensure component is necessary (not duplicating existing functionality)
   - Define component API following our standards
   - Create detailed specifications

2. **Implementation**
   - Follow the [Component Development Checklist](./COMPONENT_DEVELOPMENT_CHECKLIST.md)
   - Use design tokens from our design system
   - Implement all required variants and states
   - Add proper accessibility support

3. **Documentation**
   - Document the component using the [Component Documentation Template](./COMPONENT_DOCUMENTATION_TEMPLATE.md)
   - Include examples for all variants and common use cases
   - Document accessibility features

4. **Testing & Review**
   - Write comprehensive tests
   - Run component audit
   - Run accessibility audit
   - Conduct code review

## Component Standards

All components should follow these core principles:

### API Consistency

- Use the same prop names for similar concepts across components
- Follow variant/size naming conventions
- Handle events consistently

### Visual Consistency

- Use design tokens for colors, spacing, typography
- Maintain consistent variant styling
- Support responsive behavior

### Accessibility

- Keyboard navigable
- Screen reader friendly
- Color contrast compliant
- Focus management
- State announcements

For full details, see the [Component System Guidelines](./COMPONENT_SYSTEM.md).