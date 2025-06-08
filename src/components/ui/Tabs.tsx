import React, { ReactNode } from 'react';
import { Tabs as ShadcnTabs, TabsList, TabsTrigger, TabsContent } from './shadcn-tabs';
import { cn } from '@/lib/utils';

export interface TabItem {
  id: string;
  label: string;
  icon?: ReactNode;
  content: ReactNode;
}

interface TabsProps {
  tabs: TabItem[];
  defaultValue?: string;
  onChange?: (value: string) => void;
  variant?: 'default' | 'pills' | 'underline';
  className?: string;
}

/**
 * Tabs component that provides a consistent tabbed interface
 * Uses Radix UI Tabs underneath for accessibility and keyboard navigation
 */
const Tabs: React.FC<TabsProps> = ({
  tabs,
  defaultValue,
  onChange,
  variant = 'default',
  className
}) => {
  // Use the first tab id as default if none provided
  const defaultTab = defaultValue || (tabs.length > 0 ? tabs[0].id : '');

  // Variant styling
  const variantStyles = {
    default: {
      list: "border-b border-neutral-200 w-full",
      trigger: "border-b-2 text-sm font-medium py-4 px-3 -mb-px data-[state=active]:border-primary-500 data-[state=active]:text-primary-600 data-[state=inactive]:border-transparent data-[state=inactive]:text-neutral-500 data-[state=inactive]:hover:text-neutral-700 data-[state=inactive]:hover:border-neutral-300",
    },
    pills: {
      list: "bg-white p-1 rounded-lg",
      trigger: "rounded-md text-sm font-medium px-3 py-2 data-[state=active]:bg-primary-50 data-[state=active]:text-primary-600 data-[state=inactive]:text-neutral-500 data-[state=inactive]:hover:text-neutral-700",
    },
    underline: {
      list: "w-full border-b border-neutral-200",
      trigger: "border-b-2 text-sm font-medium py-3 px-3 -mb-px data-[state=active]:border-primary-500 data-[state=active]:text-primary-600 data-[state=inactive]:border-transparent data-[state=inactive]:text-neutral-500",
    },
  };

  // Handle mobile select view for small screens
  const MobileTabSelect = () => (
    <div className="sm:hidden p-4 border-b border-neutral-200">
      <select
        className="block w-full rounded-md border-neutral-300 py-2 pl-3 pr-10 text-base focus:border-primary-500 focus:outline-none focus:ring-primary-500"
        defaultValue={defaultTab}
        onChange={(e) => onChange?.(e.target.value)}
      >
        {tabs.map((tab) => (
          <option key={tab.id} value={tab.id}>
            {tab.label}
          </option>
        ))}
      </select>
    </div>
  );

  return (
    <div className={cn("w-full", className)}>
      <MobileTabSelect />
      
      <ShadcnTabs
        defaultValue={defaultTab}
        onValueChange={onChange}
        className="w-full"
      >
        <div className="hidden sm:block">
          <TabsList className={cn("bg-transparent space-x-6 px-4", variantStyles[variant].list)}>
            {tabs.map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className={cn(
                  "flex items-center gap-2 transition-colors",
                  variantStyles[variant].trigger
                )}
              >
                {tab.icon && <span className="text-current">{tab.icon}</span>}
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
        
        {/* Tab content */}
        {tabs.map((tab) => (
          <TabsContent key={tab.id} value={tab.id} className="p-4">
            {tab.content}
          </TabsContent>
        ))}
      </ShadcnTabs>
    </div>
  );
};

export default Tabs;