import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import Button from '../ui/Button';
import Input from '../ui/Input';

const AcceptInvitationPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [verifyingToken, setVerifyingToken] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });

  // Get token from URL hash fragment (Supabase sends these in the hash)
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [type, setType] = useState<string | null>(null);

  // Parse hash fragment parameters
  useEffect(() => {
    const hash = window.location.hash.substring(1); // Remove the #
    const hashParams = new URLSearchParams(hash);
    
    setAccessToken(hashParams.get('access_token'));
    setRefreshToken(hashParams.get('refresh_token'));
    setType(hashParams.get('type'));
  }, []);

  useEffect(() => {
    const verifyInvitation = async () => {
      // Wait a bit for hash parameters to be parsed
      if (accessToken === null || refreshToken === null) {
        return; // Still parsing
      }

      // For Supabase invitations, we need access_token and refresh_token
      if (!accessToken || !refreshToken) {
        // Check if we're already authenticated (user might have clicked link while logged in)
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          // User is already authenticated, redirect to setup
          setTokenValid(true);
          setVerifyingToken(false);
          return;
        }
        
        setError('Invalid invitation link. Please request a new invitation.');
        setVerifyingToken(false);
        return;
      }

      try {
        // Set the session using the tokens from the URL
        const { data, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (error) throw error;
        
        // Verify this is actually an invitation (not just any auth link)
        if (type === 'invite' || type === 'signup') {
          setTokenValid(true);
        } else {
          // This might be a password reset or other type - still allow setup
          setTokenValid(true);
        }
      } catch (err) {
        console.error('Error verifying invitation:', err);
        setError('Invalid or expired invitation link.');
      } finally {
        setVerifyingToken(false);
      }
    };

    verifyInvitation();
  }, [accessToken, refreshToken, type]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError(null);
  };

  const validatePassword = (password: string): string[] => {
    const errors = [];
    if (password.length < 8) errors.push('At least 8 characters');
    if (!/(?=.*[a-z])/.test(password)) errors.push('One lowercase letter');
    if (!/(?=.*[A-Z])/.test(password)) errors.push('One uppercase letter');
    if (!/(?=.*\d)/.test(password)) errors.push('One number');
    if (!/(?=.*[@$!%*?&])/.test(password)) errors.push('One special character');
    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    // Validate password strength
    const passwordErrors = validatePassword(formData.password);
    if (passwordErrors.length > 0) {
      setError(`Password must contain: ${passwordErrors.join(', ')}`);
      setLoading(false);
      return;
    }

    try {
      // Update the user's password
      const { error } = await supabase.auth.updateUser({
        password: formData.password
      });

      if (error) throw error;

      setSuccess(true);
      
      // Redirect to dashboard after success
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);

    } catch (err: any) {
      console.error('Error setting up account:', err);
      setError(err.message || 'Failed to set up your account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (verifyingToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <img
              className="mx-auto h-16 w-auto"
              src="/wszmainlogo.webp"
              alt="WSZ Legal Logo"
            />
            <h2 className="mt-6 text-3xl font-extrabold text-neutral-900">
              Verifying Invitation
            </h2>
            <div className="mt-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
              <p className="mt-2 text-neutral-600">Please wait while we verify your invitation...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <img
              className="mx-auto h-16 w-auto"
              src="/wszmainlogo.webp"
              alt="WSZ Legal Logo"
            />
            <div className="mt-6">
              <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
              <h2 className="mt-4 text-3xl font-extrabold text-neutral-900">
                Invalid Invitation
              </h2>
              <p className="mt-2 text-neutral-600">
                {error || 'This invitation link is invalid or has expired.'}
              </p>
              <div className="mt-6">
                <Button
                  onClick={() => navigate('/login')}
                  className="w-full"
                >
                  Go to Login
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <img
              className="mx-auto h-16 w-auto"
              src="/wszmainlogo.webp"
              alt="WSZ Legal Logo"
            />
            <div className="mt-6">
              <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
              <h2 className="mt-4 text-3xl font-extrabold text-neutral-900">
                Account Setup Complete
              </h2>
              <p className="mt-2 text-neutral-600">
                Your password has been set successfully. Redirecting to dashboard...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const passwordErrors = validatePassword(formData.password);

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <img
            className="mx-auto h-16 w-auto"
            src="/wszmainlogo.webp"
            alt="WSZ Legal Logo"
          />
          <h2 className="mt-6 text-center text-3xl font-extrabold text-neutral-900">
            Complete Your Account Setup
          </h2>
          <p className="mt-2 text-center text-sm text-neutral-600">
            Set your password to access WSZ Legal Case Management
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-red-400" />
                <div className="ml-3">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-neutral-700">
                Password
              </label>
              <div className="mt-1 relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  className="appearance-none relative block w-full px-3 py-2 pr-10 border border-neutral-300 placeholder-gray-500 text-neutral-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-neutral-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-neutral-400" />
                  )}
                </button>
              </div>
              
              {/* Password Requirements */}
              <div className="mt-2 text-xs text-neutral-600">
                <p className="font-medium">Password must contain:</p>
                <ul className="mt-1 space-y-1">
                  {[
                    { check: formData.password.length >= 8, text: 'At least 8 characters' },
                    { check: /(?=.*[a-z])/.test(formData.password), text: 'One lowercase letter' },
                    { check: /(?=.*[A-Z])/.test(formData.password), text: 'One uppercase letter' },
                    { check: /(?=.*\d)/.test(formData.password), text: 'One number' },
                    { check: /(?=.*[@$!%*?&])/.test(formData.password), text: 'One special character (@$!%*?&)' },
                  ].map((req, index) => (
                    <li key={index} className={`flex items-center ${req.check ? 'text-green-600' : 'text-neutral-500'}`}>
                      <span className={`w-2 h-2 rounded-full mr-2 ${req.check ? 'bg-green-500' : 'bg-neutral-300'}`}></span>
                      {req.text}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-neutral-700">
                Confirm Password
              </label>
              <div className="mt-1 relative">
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="appearance-none relative block w-full px-3 py-2 pr-10 border border-neutral-300 placeholder-gray-500 text-neutral-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Confirm your password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5 text-neutral-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-neutral-400" />
                  )}
                </button>
              </div>
              {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">Passwords do not match</p>
              )}
            </div>
          </div>

          <div>
            <Button
              type="submit"
              loading={loading}
              disabled={loading || passwordErrors.length > 0 || formData.password !== formData.confirmPassword}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Setting up your account...' : 'Complete Setup'}
            </Button>
          </div>

          <div className="text-center">
            <p className="text-xs text-neutral-500">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="font-medium text-primary-600 hover:text-primary-500"
              >
                Sign in here
              </button>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AcceptInvitationPage;