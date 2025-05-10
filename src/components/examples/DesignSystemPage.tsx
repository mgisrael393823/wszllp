import React from 'react';
import DesignSystemShowcase from './DesignSystemShowcase';
import { ArrowLeft } from 'lucide-react';
import Button from '../ui/Button';
import Typography from '../ui/Typography';

const DesignSystemPage: React.FC = () => {
  return (
    <div className="bg-neutral-50 min-h-screen">
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-20">
        <div className="container-custom py-4 flex justify-between items-center">
          <div className="flex items-center">
            <Button 
              variant="text" 
              size="sm" 
              icon={<ArrowLeft size={16} />}
              className="mr-4"
              onClick={() => window.history.back()}
            >
              Back
            </Button>
            <Typography variant="h4" className="m-0">Design System Showcase</Typography>
          </div>
          <div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.open('/README_DESIGN_SYSTEM.md', '_blank')}
            >
              View Documentation
            </Button>
          </div>
        </div>
      </header>
      
      <main>
        <DesignSystemShowcase />
      </main>
      
      <footer className="bg-white border-t border-neutral-200 py-8 mt-16">
        <div className="container-custom">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <Typography variant="h6" className="mb-4">WSZLLP Design System</Typography>
              <Typography variant="body2" color="light">
                A comprehensive design system built for legal case management applications.
                This showcase demonstrates the components and patterns in a realistic application context.
              </Typography>
            </div>
            <div>
              <Typography variant="subtitle2" className="mb-4">Components Showcased</Typography>
              <ul className="text-sm text-neutral-600 space-y-1">
                <li>• Typography</li>
                <li>• Button</li>
                <li>• Card</li>
                <li>• Input</li>
                <li>• Select</li>
                <li>• Modal</li>
                <li>• Table</li>
              </ul>
            </div>
            <div>
              <Typography variant="subtitle2" className="mb-4">Design Tokens</Typography>
              <ul className="text-sm text-neutral-600 space-y-1">
                <li>• Color System</li>
                <li>• Typography Scale</li>
                <li>• Spacing System</li>
                <li>• Elevation & Shadows</li>
                <li>• Border Radius</li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-neutral-200 text-center">
            <Typography variant="caption" color="light">
              WSZLLP Design System • Version 1.0.0 • {new Date().getFullYear()}
            </Typography>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default DesignSystemPage;