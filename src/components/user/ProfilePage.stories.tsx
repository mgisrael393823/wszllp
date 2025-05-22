import type { Meta, StoryObj } from '@storybook/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import ProfilePage from './ProfilePage';
import { supabase } from '@/lib/supabaseClient';

// Mock the supabase client for Storybook
vi.mock('@/lib/supabaseClient', () => ({
  supabase: {
    auth: {
      getUser: () => Promise.resolve({
        data: {
          user: {
            id: 'test-user-id',
            email: 'test@example.com',
            user_metadata: {
              full_name: 'Jane Doe',
              role: 'Attorney',
              avatar_url: null,
            },
          },
        },
        error: null,
      }),
      onAuthStateChange: () => ({
        data: {
          subscription: {
            unsubscribe: () => {},
          },
        },
      }),
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({
            data: null,
            error: null,
          }),
        }),
      }),
      upsert: () => Promise.resolve({ error: null }),
    }),
  },
}));

const meta: Meta<typeof ProfilePage> = {
  title: 'User/ProfilePage',
  component: ProfilePage,
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

type Story = StoryObj<typeof ProfilePage>;

export const Default: Story = {};