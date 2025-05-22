import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import ProfilePage from './ProfilePage';
import { supabase } from '@/lib/supabaseClient';

// Mock the supabase client
vi.mock('@/lib/supabaseClient', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
      onAuthStateChange: vi.fn(() => ({
        data: {
          subscription: {
            unsubscribe: vi.fn(),
          },
        },
      })),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => ({
            data: null,
            error: null,
          })),
        })),
      })),
      upsert: vi.fn(() => ({
        error: null,
      })),
    })),
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

describe('ProfilePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock the getUser response
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: {
        user: {
          id: 'test-user-id',
          email: 'test@example.com',
          user_metadata: {
            full_name: 'Test User',
            role: 'Attorney',
          },
        },
      },
      error: null,
    } as any);
  });

  it('renders loading state initially', async () => {
    render(
      <BrowserRouter>
        <ProfilePage />
      </BrowserRouter>
    );
    
    expect(screen.getByText('Loading profile...')).toBeInTheDocument();
  });

  it('renders user profile after loading', async () => {
    render(
      <BrowserRouter>
        <ProfilePage />
      </BrowserRouter>
    );
    
    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeInTheDocument();
    });
    
    expect(screen.getByLabelText('Email Address')).toHaveValue('test@example.com');
    expect(screen.getByText('Attorney')).toBeInTheDocument();
  });

  it('enables editing mode when Edit Profile button is clicked', async () => {
    render(
      <BrowserRouter>
        <ProfilePage />
      </BrowserRouter>
    );
    
    await waitFor(() => {
      expect(screen.getByText('Edit Profile')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('Edit Profile'));
    
    expect(screen.getByText('Save Changes')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
    expect(screen.getByLabelText('Full Name')).not.toBeDisabled();
  });

  it('navigates to settings page when Settings button is clicked', async () => {
    render(
      <BrowserRouter>
        <ProfilePage />
      </BrowserRouter>
    );
    
    await waitFor(() => {
      expect(screen.getByText('Settings')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('Settings'));
    
    expect(mockNavigate).toHaveBeenCalledWith('/settings');
  });

  it('saves changes when form is submitted', async () => {
    const mockUpsert = vi.fn().mockResolvedValue({ error: null });
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: null,
          }),
        }),
      }),
      upsert: mockUpsert,
    } as any);
    
    render(
      <BrowserRouter>
        <ProfilePage />
      </BrowserRouter>
    );
    
    await waitFor(() => {
      expect(screen.getByText('Edit Profile')).toBeInTheDocument();
    });
    
    // Enter edit mode
    fireEvent.click(screen.getByText('Edit Profile'));
    
    // Change a field
    fireEvent.change(screen.getByLabelText('Full Name'), { target: { value: 'Updated Name' } });
    
    // Submit the form
    fireEvent.submit(screen.getByRole('form'));
    
    await waitFor(() => {
      expect(mockUpsert).toHaveBeenCalled();
    });
  });
});