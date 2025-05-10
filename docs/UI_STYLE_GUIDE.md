# WSZLLP UI Style Guide

This comprehensive style guide defines standards for spacing, grid layout, page templates, and navigation patterns in the WSZLLP legal case management application.

## 1. Spacing System

### Principles for Consistent Spacing

Our spacing system is built on an 8px (0.5rem) baseline grid, using multiples to create a harmonious visual rhythm.

#### Primary Spacing Scale

- `space-0`: 0px - No space
- `space-1`: 4px (0.25rem) - Micro spacing (icon padding, tight elements)
- `space-2`: 8px (0.5rem) - Small spacing (between related elements)
- `space-3`: 12px (0.75rem) - Medium-small spacing
- `space-4`: 16px (1rem) - Default spacing (component padding)
- `space-6`: 24px (1.5rem) - Medium spacing (between sections)
- `space-8`: 32px (2rem) - Large spacing (between major sections)
- `space-12`: 48px (3rem) - Extra large spacing (page sections)
- `space-16`: 64px (4rem) - Ultra large spacing (page breaks)

#### Contextual Spacing

- **Content Spacing**: Elements within content blocks should use 16px (1rem) spacing
- **Component Spacing**: Components should be spaced 24px (1.5rem) apart
- **Section Spacing**: Major page sections should use 32px-48px (2-3rem) spacing
- **Inset Spacing**: Padding within components should be consistent (16px or 24px)

### Responsive Spacing Strategy

- **Small screens** (< 640px): Reduce spacing by 25%
  - Content spacing: 12px
  - Component spacing: 16px
  - Section spacing: 24px
- **Medium screens** (640px-1024px): Use standard spacing
- **Large screens** (> 1024px): Increase critical spacing by 25%
  - Section spacing: 40px-60px
  - Page margins: 24px-48px

### Common Spacing Patterns

**Container Padding**
- Mobile: 16px (1rem)
- Tablet: 24px (1.5rem)
- Desktop: 32px (2rem)

**Card Component**
- Padding: 16px (1rem)
- Between cards: 24px (1.5rem)

**Form Components**
- Between form fields: 16px (1rem)
- Between form groups: 32px (2rem)

**Button Spacing**
- Internal padding: 8px 16px (0.5rem 1rem)
- Between buttons: 8px (0.5rem)

## 2. Grid System

### Breakpoint Strategy

Our application uses these breakpoints for responsive design:

- **Small (sm)**: 640px
  - Single column layout
  - Full-width components
  - Stacked navigation
  - Collapsed sidebar
- **Medium (md)**: 768px 
  - Two column layout
  - Persistent sidebar
  - Expanded navigation
- **Large (lg)**: 1024px
  - Full desktop layout
  - Multi-column grids
  - Expanded UI elements
- **Extra Large (xl)**: 1280px
  - Optimized for larger screens
  - Wider content areas
  - Enhanced information density
- **2XL**: 1536px
  - Maximized for large displays
  - Potential for multi-panel interfaces

### Container Widths and Margins

**Container Max Widths**
- Small: 100% width with 16px margin
- Medium: 100% width with 24px margin
- Large: 100% width with 32px margin
- Extra Large: 1280px max-width, centered
- 2XL: 1536px max-width, centered

**Standard Container Class**
- `.container-custom`: Auto margin with responsive padding

**Container Variations**
- `.container-narrow`: 768px max-width for focused content
- `.container-medium`: 1024px max-width for standard content
- `.container-full`: 100% width with padding for full-width sections

### Content Area Proportions

**Standard Layout Ratios**
- Sidebar: 256px fixed width (md and above)
- Content area: Flexible, remaining width

**Grid Column Structure**
- Mobile: 4-column grid (gap: 16px)
- Tablet: 8-column grid (gap: 24px)
- Desktop: 12-column grid (gap: 32px)

**Typical Proportions**
- Full width sections: 12/12 columns
- Standard content: 8/12 columns
- Sidebar content: 4/12 columns
- Card grids: 12/12 divided into 1, 2, 3, or 4 cards per row (responsive)

## 3. Page Template Standardization

### Core Templates

1. **Dashboard Template**
   - Header: Standard application header
   - Sidebar: Full navigation
   - Content: Main dashboard with cards and widgets
   - Layout: Sidebar + Main content area

2. **List/Index Template**
   - Header: Standard application header
   - Sidebar: Full navigation
   - Content: Filterable table/list with actions
   - Layout: Sidebar + Main content area

3. **Detail Template**
   - Header: Standard application header
   - Sidebar: Full navigation
   - Content: Detail view with sections + related data
   - Layout: Sidebar + Main content with tabs/sections

4. **Form Template**
   - Header: Standard application header
   - Sidebar: Full navigation
   - Content: Multi-section form with navigation
   - Layout: Sidebar + Main form with stepper

5. **Settings Template**
   - Header: Standard application header
   - Sidebar: Full navigation
   - Content: Settings categories with sections
   - Layout: Sidebar + 2-column settings layout

### Header, Sidebar, and Content Recommendations

**Header**
- Fixed height: 64px (16 * 4px)
- Standard elements: Logo, navigation toggle, user menu
- Optional elements: Search, notifications, system status
- Shadow: Subtle drop shadow for elevation
- Z-index: 20 for proper stacking

**Sidebar**
- Fixed width: 256px (64 * 4px)
- Mobile behavior: Hidden with toggle/overlay
- Z-index: 20 (same as header for proper stacking)
- Sections: Main navigation, collapsible groups
- Status: Support/info section at bottom
- Visual treatment: Subtle background/border

**Content Area**
- Padding: Responsive (16px - 32px)
- Max-width: 1280px or 100% minus sidebar
- Sections: Clearly defined with spacing
- Background: Neutral light background

### Consistency Principles for Page Layouts

1. **Visual Hierarchy**
   - Page title consistently at top
   - Primary actions consistently positioned
   - Progressive disclosure of details

2. **Component Consistency**
   - Same component, same appearance and behavior
   - Consistent spacing between components
   - Predictable patterns for primary/secondary content

3. **Repetitive Layouts**
   - Same type of data presented in same way
   - Similar pages have similar structures
   - Reusable template blocks

4. **Navigation Consistency**
   - Main navigation always in same location
   - Page-specific navigation consistent (tabs, breadcrumbs)
   - Clear indication of current location

## 4. Navigation Patterns & Best Practices

### Primary, Secondary, and Tertiary Navigation

**Primary Navigation (Sidebar)**
- Purpose: Main application sections
- Treatment: Vertical sidebar with icons + text
- Behavior: Persistent on tablet/desktop, overlay on mobile

**Secondary Navigation (Groups + Submenus)**
- Purpose: Subsections within primary sections
- Treatment: Collapsible groups within sidebar
- Behavior: Toggle expansion/collapse, highlight active section

**Tertiary Navigation (Page-Level)**
- Purpose: Navigation within a section
- Treatment: Tabs, pills, or segmented controls
- Behavior: Switch between related views without leaving context

### Mobile Navigation Considerations

**Small Screen Adaptations**
- Sidebar: Toggleable overlay with larger touch targets
- Header: Simplified with essential elements only
- Menus: Collapsible by default with clear expansion
- Touch targets: Minimum 44px height for tappable elements

**Mobile Navigation Patterns**
- Bottom navigation: Consider for highest-use sections
- Hamburger menu: For access to full sidebar
- Gestures: Support for swipe/pull to access common options
- Back button: Consistent placement and behavior

### Enhancements to Current Navigation Structure

**Navigation Grouping Improvements**
- Group similar items more logically
- Limit primary navigation to 5-7 key sections
- Move less-used items to secondary groupings
- Add visual dividers between functional groups

**Visual Hierarchy**
- Make active items more visually distinct
- Add subtle visual cues for navigation depth
- Consider using color coding for major sections
- Improve hover/focus states for better feedback

**Functionality Additions**
- Add collapsible sidebar option for more screen space
- Consider "favorites" function for personalized navigation
- Add breadcrumbs for deep navigation structures
- Implement keyboard shortcuts for power users

**Navigation Context**
- Show clear visual indicators of current location
- Add count badges for items needing attention
- Provide subtle animations for state changes
- Consider mini tutorials for complex navigation paths