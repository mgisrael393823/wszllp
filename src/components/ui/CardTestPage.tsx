import React from 'react';
import Card from './Card';
import { Calendar, FileText, Users, TrendingUp, Activity, AlertCircle } from 'lucide-react';

/**
 * Test page to verify Card component fixes
 * Tests all size variants and deprecation warnings
 */
const CardTestPage: React.FC = () => {
  // Test data for different card variants
  const metricData = {
    value: 1234,
    subtitle: 'Total Cases',
    progress: { current: 75, max: 100, variant: 'primary' as const },
    trend: { icon: <TrendingUp size={16} />, label: '+12% from last month', color: 'text-success-600' }
  };

  const actions = [
    { icon: <Calendar size={20} />, label: 'Schedule Hearing', onClick: () => console.log('Schedule'), variant: 'primary' as const },
    { icon: <FileText size={20} />, label: 'File Document', onClick: () => console.log('File'), variant: 'secondary' as const },
    { icon: <Users size={20} />, label: 'Add Party', onClick: () => console.log('Add'), variant: 'accent' as const },
  ];

  const activities = [
    { id: '1', icon: <Activity size={16} />, title: 'Case Updated', description: 'Status changed to Active', timestamp: '2 hours ago', variant: 'success' as const },
    { id: '2', icon: <FileText size={16} />, title: 'Document Filed', description: 'Motion to Dismiss filed', timestamp: '4 hours ago' },
    { id: '3', icon: <AlertCircle size={16} />, title: 'Deadline Approaching', description: 'Response due in 2 days', timestamp: '1 day ago', variant: 'warning' as const },
  ];

  const sizes: Array<'compact' | 'normal' | 'spacious' | 'featured'> = ['compact', 'normal', 'spacious', 'featured'];

  return (
    <div className="p-8 bg-neutral-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-12">
        <div>
          <h1 className="text-3xl font-bold mb-2">Professional Card Design Test</h1>
          <p className="text-neutral-600">Testing the new professional card design with proper spacing, icon treatment, and typography</p>
        </div>

        {/* Test Size Variants */}
        <section>
          <h2 className="text-2xl font-semibold mb-6">Size Variants - Typography & Icon Scaling</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {sizes.map(size => (
              <Card
                key={size}
                size={size}
                title={`${size.charAt(0).toUpperCase() + size.slice(1)} Size Card`}
                subtitle={`This card uses size="${size}"`}
                icon={<FileText className="text-primary-600" />}
                badge={<span className="text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded">New</span>}
              >
                <p className="text-neutral-600">
                  This content demonstrates the {size} size variant. Notice how:
                </p>
                <ul className="mt-2 space-y-1 text-sm text-neutral-600">
                  <li>• Header icons and title scale appropriately</li>
                  <li>• Body text uses size-specific typography</li>
                  <li>• Padding adjusts to the size variant</li>
                  <li>• Internal spacing follows the size scale</li>
                </ul>
                <div className="mt-4 p-4 bg-neutral-100 rounded">
                  <code className="text-sm">size="{size}"</code>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* Test Deprecated Compact Prop */}
        <section>
          <h2 className="text-2xl font-semibold mb-6">Deprecation Warning Test</h2>
          <p className="text-neutral-600 mb-4">This card uses the deprecated `compact` prop - check console for warning</p>
          <Card
            compact={true}
            title="Deprecated Compact Prop"
            subtitle="Should show console warning"
          >
            <p className="text-neutral-600">
              This card uses the deprecated boolean `compact` prop. 
              Check the browser console to see the deprecation warning.
            </p>
          </Card>
        </section>

        {/* Test Card Variants with Different Sizes */}
        <section>
          <h2 className="text-2xl font-semibold mb-6">Specialized Card Variants</h2>
          
          <div className="space-y-8">
            {/* Metric Cards */}
            <div>
              <h3 className="text-xl font-medium mb-4">Metric Cards - Different Sizes</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {sizes.slice(0, 3).map(size => (
                  <Card
                    key={`metric-${size}`}
                    size={size}
                    variant="metric"
                    title="Revenue"
                    icon={<TrendingUp className="text-primary-600" />}
                    metricData={metricData}
                  />
                ))}
              </div>
            </div>

            {/* Action List Cards */}
            <div>
              <h3 className="text-xl font-medium mb-4">Action List Cards - Different Sizes</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sizes.slice(0, 2).map(size => (
                  <Card
                    key={`actions-${size}`}
                    size={size}
                    variant="action-list"
                    title="Quick Actions"
                    subtitle={`Size: ${size}`}
                    actions={actions}
                  />
                ))}
              </div>
            </div>

            {/* Activity Feed Cards */}
            <div>
              <h3 className="text-xl font-medium mb-4">Activity Feed Cards - Different Sizes</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sizes.slice(0, 2).map(size => (
                  <Card
                    key={`activity-${size}`}
                    size={size}
                    variant="activity-feed"
                    title="Recent Activity"
                    subtitle={`Size: ${size}`}
                    activities={activities}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Test Interactive States */}
        <section>
          <h2 className="text-2xl font-semibold mb-6">Interactive & State Tests</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card
              size="normal"
              title="Interactive Card"
              interactive
              onClick={() => alert('Card clicked!')}
            >
              <p className="text-neutral-600">Click this card to test interaction</p>
            </Card>

            <Card
              size="normal"
              title="Loading State"
              loading
            >
              <p>This content won't show</p>
            </Card>

            <Card
              size="normal"
              title="Disabled State"
              disabled
              onClick={() => alert('Should not fire')}
            >
              <p className="text-neutral-600">This card is disabled</p>
            </Card>
          </div>
        </section>

        {/* Footer Test */}
        <section>
          <h2 className="text-2xl font-semibold mb-6">Card with Footer - Size Scaling</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {sizes.slice(0, 2).map(size => (
              <Card
                key={`footer-${size}`}
                size={size}
                title={`${size} Card with Footer`}
                footer={
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-neutral-600">Footer content</span>
                    <button className="text-sm text-primary-600 hover:text-primary-700">
                      Action
                    </button>
                  </div>
                }
              >
                <p className="text-neutral-600">
                  This card has a footer. The footer padding should scale with the size prop.
                </p>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default CardTestPage;