# Page Templates

This directory contains standardized page templates for WSZLLP's legal case management application. These templates provide consistent layouts and user experiences across different parts of the application.

## Available Templates

1. **DashboardTemplate**
   - Purpose: Main dashboard pages with data overview and multiple card sections
   - Props:
     - `title`: Page title
     - `description`: Optional page description
     - `children`: Dashboard content (typically cards, charts, etc.)

2. **ListTemplate**
   - Purpose: Displaying lists or tables of items with search and filtering
   - Props:
     - `title`: Page title 
     - `description`: Optional page description
     - `searchPlaceholder`: Custom placeholder for search input
     - `onSearch`: Handler for search submissions
     - `actionLabel`: Label for primary action button
     - `onAction`: Handler for primary action
     - `children`: List content (typically a table component)

3. **DetailTemplate**
   - Purpose: Showing detailed information about a single item
   - Props:
     - `title`: Page title
     - `subtitle`: Optional subtitle (e.g., item ID or status)
     - `backLink`: URL to return to the list view
     - `onEdit`: Handler for edit action
     - `onDelete`: Handler for delete action
     - `children`: Detail content
     
4. **FormTemplate**
   - Purpose: Data entry forms with multiple sections
   - Props:
     - `title`: Page title
     - `subtitle`: Optional subtitle
     - `backLink`: URL to return to previous page
     - `onSubmit`: Form submission handler
     - `onCancel`: Cancel action handler
     - `isSubmitting`: Loading state for submission
     - `children`: Form fields and sections

5. **SettingsTemplate**
   - Purpose: Categorized settings pages
   - Props:
     - `title`: Page title
     - `description`: Optional page description
     - `categories`: Array of setting categories
     - `activeCategory`: Currently selected category ID
     - `onCategoryChange`: Handler for category changes
     - `children`: Settings content for active category

## Usage Examples

### Dashboard Template:

```jsx
<DashboardTemplate 
  title="Case Dashboard" 
  description="Overview of your active cases and recent activity"
>
  <div className="grid-cols-responsive">
    {/* Dashboard cards */}
    <Card title="Active Cases">...</Card>
    <Card title="Upcoming Hearings">...</Card>
    <Card title="Recent Documents">...</Card>
    <Card title="Case Statistics">...</Card>
  </div>
  
  <div className="content-area mt-8">
    <Typography variant="h3">Recent Activity</Typography>
    <ActivityList activities={activities} />
  </div>
</DashboardTemplate>
```

### List Template:

```jsx
<ListTemplate
  title="Cases"
  description="Manage all your legal cases"
  searchPlaceholder="Search by case number, client, or title..."
  onSearch={handleSearch}
  actionLabel="New Case"
  onAction={handleCreateCase}
>
  <Table
    data={cases}
    columns={caseColumns}
    keyField="id"
    onRowClick={handleCaseClick}
  />
</ListTemplate>
```

### Detail Template:

```jsx
<DetailTemplate
  title={case.title}
  subtitle={`Case ID: ${case.caseNumber}`}
  backLink="/cases"
  onEdit={handleEditCase}
  onDelete={handleDeleteCase}
>
  <div className="vr-lg">
    <section>
      <Typography variant="h4">Case Information</Typography>
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Typography variant="caption" color="light">Case Type</Typography>
          <Typography>{case.type}</Typography>
        </div>
        {/* More case details */}
      </div>
    </section>
    
    <section>
      <Typography variant="h4">Parties</Typography>
      {/* Parties details */}
    </section>
  </div>
</DetailTemplate>
```

## Best Practices

1. **Consistency**: Always use the appropriate template for each page type to maintain a consistent user experience.

2. **Page Hierarchy**: Clearly establish the page hierarchy with proper heading levels within each template.

3. **Responsive Design**: Templates handle basic responsive behavior, but ensure your content also adapts well to different screen sizes.

4. **Accessibility**: Maintain good accessibility practices within your content by using semantic HTML and proper labels.

5. **Content Organization**: Group related information into clear sections with adequate spacing between them.