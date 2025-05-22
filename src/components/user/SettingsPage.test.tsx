import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import SettingsPage from './SettingsPage';
import { supabase } from '@/lib/supabaseClient';

// Mock the supabase client
vi.mock('@/lib/supabaseClient', () => ({
  supabase: {
    auth: {
      signOut: vi.fn(),
    },
  },
}));

// Mock the navigate function
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('SettingsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(supabase.auth.signOut).mockResolvedValue({ error: null } as any);
  });

  it('renders settings sections correctly', () => {
    render(
      <BrowserRouter>
        <SettingsPage />
      </BrowserRouter>
    );
    
    expect(screen.getByText('Account Settings')).toBeInTheDocument();
    expect(screen.getByText('Security')).toBeInTheDocument();
    expect(screen.getByText('Notifications')).toBeInTheDocument();
    expect(screen.getByText('Privacy')).toBeInTheDocument();
    expect(screen.getByText('Appearance')).toBeInTheDocument();
    expect(screen.getByText('Sign Out')).toBeInTheDocument();
  });

  it('navigates to profile page when Account Settings is clicked', () => {
    render(
      <BrowserRouter>
        <SettingsPage />
      </BrowserRouter>
    );
    
    fireEvent.click(screen.getByText('Account Settings'));
    expect(mockNavigate).toHaveBeenCalledWith('/profile');
  });

  it('navigates to notifications page when Notifications is clicked', () => {
    render(
      <BrowserRouter>
        <SettingsPage />
      </BrowserRouter>
    );
    
    fireEvent.click(screen.getByText('Notifications'));
    expect(mockNavigate).toHaveBeenCalledWith('/notifications');
  });

  it('signs out user when Sign Out button is clicked', async () => {
    render(
      <BrowserRouter>
        <SettingsPage />
      </BrowserRouter>
    );
    
    fireEvent.click(screen.getByRole('button', { name: 'Sign Out' }));
    
    expect(supabase.auth.signOut).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });
});