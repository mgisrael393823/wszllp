import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function ProfilePage() {
  const [user, setUser] = useState(supabase.auth.user());

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });
    return () => listener?.unsubscribe();
  }, []);

  if (\!user) return <p>Loading profile…</p>;
  return (
    <div>
      <h1>{user.user_metadata.full_name}</h1>
      <p>Email: {user.email}</p>
    </div>
  );
}
EOF < /dev/null