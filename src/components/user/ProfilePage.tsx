import React, { useEffect, useState } from 'react';
import { User as UserIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  role?: string;
}

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    role: '',
  });

  useEffect(() => {
    async function loadUserProfile() {
      try {
        setIsLoading(true);
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          navigate('/login');
          return;
        }

        // Get profile data from a profiles table if you have one
        // This is an example - adjust according to your actual database schema
        const { data: profileData, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching profile:', error);
          // If no profile found, use basic user data
          setProfile({
            id: user.id,
            email: user.email || '',
            full_name: user.user_metadata?.full_name || '',
            avatar_url: user.user_metadata?.avatar_url,
            role: user.user_metadata?.role || 'User',
          });
        } else {
          setProfile(profileData || {
            id: user.id,
            email: user.email || '',
            full_name: user.user_metadata?.full_name || '',
            avatar_url: user.user_metadata?.avatar_url,
            role: user.user_metadata?.role || 'User',
          });
        }
        
        // Set form data from profile
        setFormData({
          full_name: profileData?.full_name || user.user_metadata?.full_name || '',
          email: user.email || '',
          role: profileData?.role || user.user_metadata?.role || 'User',
        });
      } catch (error) {
        console.error('Error loading profile:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadUserProfile();
    
    // Set up listener for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        navigate('/login');
      } else if (event === 'SIGNED_IN' && session) {
        loadUserProfile();
      }
    });
    
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    
    setIsLoading(true);
    
    try {
      // Check if the profiles table exists and create it if it doesn't
      const { error: tableError } = await supabase
        .from('profiles')
        .select('id')
        .limit(1);
      
      // If the table doesn't exist or there's another issue, update user metadata instead
      if (tableError) {
        console.warn('Error accessing profiles table, updating user metadata instead:', tableError);
        
        // Update user metadata as fallback
        const { error: updateError } = await supabase.auth.updateUser({
          data: {
            full_name: formData.full_name,
            role: formData.role,
          }
        });
        
        if (updateError) throw updateError;
      } else {
        // Update profile in Supabase profiles table
        const { error } = await supabase
          .from('profiles')
          .upsert({
            id: profile.id,
            full_name: formData.full_name,
            role: formData.role,
            updated_at: new Date(),
          });
          
        if (error) throw error;
      }
      
      // Update local state
      setProfile(prev => ({
        ...prev!,
        full_name: formData.full_name,
        role: formData.role,
      }));
      
      // Exit edit mode
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">User Profile</h1>
      </div>
      
      <Card className="max-w-3xl mx-auto">
        <div className="p-6">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-pulse text-neutral-500">Loading profile...</div>
            </div>
          ) : profile ? (
            <>
              <div className="flex items-center mb-6">
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.full_name || 'User avatar'}
                    className="w-20 h-20 rounded-full object-cover mr-4"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center mr-4">
                    <UserIcon size={32} />
                  </div>
                )}
                <div>
                  <h2 className="text-xl font-medium">
                    {profile.full_name || 'No Name'}
                  </h2>
                  <p className="text-neutral-600">{profile.role || 'User'}</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} role="form">
                <div className="space-y-4">
                  <div className="mb-4">
                    <label htmlFor="full_name" className="block text-sm font-medium text-neutral-700 mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      id="full_name"
                      name="full_name"
                      value={formData.full_name}
                      onChange={handleChange}
                      disabled={false}
                      required
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50"
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label htmlFor="email" className="block text-sm font-medium text-neutral-700 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      disabled={true}
                      required
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50"
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label htmlFor="role" className="block text-sm font-medium text-neutral-700 mb-1">
                      Role
                    </label>
                    <input
                      type="text"
                      id="role"
                      name="role"
                      value={formData.role}
                      onChange={handleChange}
                      disabled={false}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50"
                    />
                  </div>
                </div>

                <div className="mt-8 flex justify-end space-x-4">
                  {isEditing ? (
                    <>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsEditing(false)}
                        disabled={isLoading}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        variant="primary"
                        loading={isLoading}
                      >
                        Save Changes
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => navigate('/settings')}
                      >
                        Settings
                      </Button>
                      <Button
                        type="button"
                        variant="primary"
                        onClick={() => setIsEditing(true)}
                      >
                        Edit Profile
                      </Button>
                    </>
                  )}
                </div>
              </form>
            </>
          ) : (
            <div className="text-center p-8">
              <p className="text-neutral-600">No profile found. Please log in.</p>
              <Button 
                variant="primary" 
                className="mt-4" 
                onClick={() => navigate('/login')}
              >
                Go to Login
              </Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default ProfilePage;