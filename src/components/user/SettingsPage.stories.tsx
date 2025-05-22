import type { Meta, StoryObj } from '@storybook/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import SettingsPage from './SettingsPage';
import { supabase } from '@/lib/supabaseClient';

// Mock the supabase client for Storybook
vi.mock('@/lib/supabaseClient', () => ({
  supabase: {
    auth: {
      signOut: () => Promise.resolve({ error: null }),
    },
  },
}));

const meta: Meta<typeof SettingsPage> = {
  title: 'User/SettingsPage',
  component: SettingsPage,
  decorators: [
    (Story) => (
      <BrowserRouter>
        <div className="p-6 max-w-screen-xl mx-auto">
          <Story />
        </div>
      </BrowserRouter>
    ),
  ],
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;

type Story = StoryObj<typeof SettingsPage>;

export const Default: Story = {};