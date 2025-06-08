import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

const DebugInvitationPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [hashParams, setHashParams] = useState<Record<string, string>>({});
  
  // Get all URL parameters (query string)
  const allParams: Record<string, string> = {};
  searchParams.forEach((value, key) => {
    allParams[key] = value;
  });

  // Get hash fragment parameters
  useEffect(() => {
    const hash = window.location.hash.substring(1); // Remove the #
    const hashSearchParams = new URLSearchParams(hash);
    const hashParamsObj: Record<string, string> = {};
    hashSearchParams.forEach((value, key) => {
      hashParamsObj[key] = value;
    });
    setHashParams(hashParamsObj);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 py-12 px-4">
      <div className="max-w-2xl w-full">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-2xl font-bold mb-6">Debug: Invitation URL Parameters</h1>
          
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold mb-2">Current URL:</h2>
              <p className="text-sm bg-neutral-100 p-2 rounded break-all">
                {window.location.href}
              </p>
            </div>
            
            <div>
              <h2 className="text-lg font-semibold mb-2">URL Query Parameters:</h2>
              {Object.keys(allParams).length > 0 ? (
                <div className="space-y-2">
                  {Object.entries(allParams).map(([key, value]) => (
                    <div key={key} className="bg-neutral-100 p-2 rounded">
                      <strong>{key}:</strong> <span className="break-all">{value}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-neutral-500 italic">No query parameters found</p>
              )}
            </div>

            <div>
              <h2 className="text-lg font-semibold mb-2">Hash Fragment Parameters:</h2>
              {Object.keys(hashParams).length > 0 ? (
                <div className="space-y-2">
                  {Object.entries(hashParams).map(([key, value]) => (
                    <div key={key} className="bg-blue-100 p-2 rounded">
                      <strong>{key}:</strong> <span className="break-all">{value}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-neutral-500 italic">No hash parameters found</p>
              )}
            </div>
            
            <div className="pt-4">
              <h2 className="text-lg font-semibold mb-2">Expected Parameters for Supabase:</h2>
              <ul className="text-sm text-neutral-600 space-y-1">
                <li>• <strong>access_token</strong> - Required for authentication</li>
                <li>• <strong>refresh_token</strong> - Required for session</li>
                <li>• <strong>type</strong> - Should be "invite" or "signup"</li>
                <li>• <strong>token_hash</strong> - Sometimes included</li>
              </ul>
            </div>
          </div>
          
          <div className="mt-6 pt-4 border-t">
            <button
              onClick={() => window.location.href = '/login'}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DebugInvitationPage;