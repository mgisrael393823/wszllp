# Card Component Migration Guide

## Overview
We've created three focused card components to replace the overloaded Card component:
- `MetricCard` - For KPIs and statistics
- `StatusCard` - For entities with workflow states
- `ActionListCard` - For lists of clickable items

## Component Details

### MetricCard
```tsx
interface MetricCardProps {
  title: string;
  value: string | number;
  icon?: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  subtitle?: string;
  onClick?: () => void;
  className?: string;
}
```

### StatusCard
```tsx
interface StatusCardProps {
  title: string;
  status: 'active' | 'pending' | 'completed' | 'overdue' | 'draft';
  subtitle?: string;
  description?: string;
  icon?: LucideIcon;
  actions?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary' | 'outline';
  }[];
  metadata?: Array<{
    label: string;
    value: string;
  }>;
  className?: string;
}
```

### ActionListCard
```tsx
interface ActionListCardProps {
  title: string;
  description?: string;
  items: ActionListItem[];
  onActionClick?: (itemId: string) => void;
  className?: string;
  showDividers?: boolean;
}
```

## Migration Examples

### Before (EnhancedDashboardHome.tsx)
```tsx
<Card 
  key={kpi.id}
  variant="metric"
  elevation="low"
  interactive
  loading={isLoading}
  onClick={getKPINavigationHandler(kpi.id)}
  icon={iconMap[kpi.id]}
  title={kpi.title}
  badge={getBadge(kpi)}
  metricData={convertToMetricData(kpi)}
/>
```

### After
```tsx
<MetricCard
  key={kpi.id}
  title={kpi.title}
  value={kpi.value}
  trend={kpi.trend}
  icon={iconMap[kpi.id]}
  subtitle={kpi.subtitle}
  onClick={getKPINavigationHandler(kpi.id)}
/>
```

### Before (CaseDetail.tsx)
```tsx
<Card>
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    <div>
      <h3 className="text-lg font-medium text-neutral-900 mb-4">Case Information</h3>
      {/* ... complex nested content ... */}
    </div>
  </div>
</Card>
```

### After
```tsx
<StatusCard
  title={`Case #${caseData.caseId}`}
  status={caseData.status}
  subtitle={`${caseData.plaintiff} vs ${caseData.defendant}`}
  description={caseData.address}
  metadata={[
    { label: "Intake Date", value: format(caseData.intakeDate, 'MMM d, yyyy') },
    { label: "Case Age", value: `${caseAge} days` }
  ]}
  actions={[
    { label: "Edit", onClick: handleEdit, variant: "outline" },
    { label: "View Documents", onClick: handleViewDocs, variant: "primary" }
  ]}
/>
```

### Before (DocumentOverview.tsx)
```tsx
<Card className="p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/documents/list?type=Complaint')}>
  <div className="flex items-center">
    <div className="bg-primary-100 p-3 rounded-lg">
      <File className="h-6 w-6 text-primary-600" />
    </div>
    <div className="ml-4">
      {/* ... */}
    </div>
  </div>
</Card>
```

### After
```tsx
<ActionListCard
  title="Document Categories"
  items={[
    {
      id: 'complaint',
      icon: File,
      title: 'Complaints',
      value: documentCounts['Complaint'] || 0,
      onClick: () => navigate('/documents/list?type=Complaint')
    },
    {
      id: 'summons',
      icon: File,
      title: 'Summons',
      value: documentCounts['Summons'] || 0,
      onClick: () => navigate('/documents/list?type=Summons')
    }
  ]}
/>
```

## Key Benefits
1. **No more manual padding** - Components have sensible defaults
2. **Type-safe props** - Clear interfaces for each use case
3. **Consistent styling** - Built-in status colors and layouts
4. **Simpler composition** - No need for wrapper divs or complex className strings
5. **Better performance** - No animation libraries or unnecessary re-renders

## Assumptions Made
1. Using existing shadcn/ui Card components as base
2. Color system follows Tailwind defaults (blue, green, yellow, red, neutral)
3. Icons use Lucide React
4. Button component exists with variant prop
5. cn() utility exists for className merging

## Dashboard Logic Updates Needed
1. Replace `convertToMetricData()` with direct prop passing
2. Update `getBadge()` to return trend object instead
3. Simplify click handlers - no need for complex wrappers
4. Remove loading skeletons from individual cards (handle at page level)