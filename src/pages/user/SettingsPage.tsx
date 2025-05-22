import React from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function SettingsPage() {
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    // navigate to login…
  };

  return (
    <div>
      <h1>Settings</h1>
      <button onClick={handleSignOut}>Sign Out</button>
    </div>
  );
}
EOF < /dev/null