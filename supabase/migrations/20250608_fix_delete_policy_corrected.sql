-- FIX DELETE POLICY: Remove incorrect WITH CHECK clause

-- PostgreSQL doesn't support WITH CHECK on DELETE policies
-- Only USING clause is needed for DELETE operations

DO $$
BEGIN
  RAISE NOTICE '=== CORRECTING DELETE POLICIES ===';
  RAISE NOTICE 'DELETE operations only use USING clause, not WITH CHECK';
END $$;

-- Drop and recreate DELETE policies with only USING clause

-- Cases
DROP POLICY IF EXISTS cases_delete_own ON public.cases;
CREATE POLICY cases_delete_own ON public.cases
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- Documents  
DROP POLICY IF EXISTS documents_delete_own ON public.documents;
CREATE POLICY documents_delete_own ON public.documents
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- Contacts
DROP POLICY IF EXISTS contacts_delete_own ON public.contacts;
CREATE POLICY contacts_delete_own ON public.contacts
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- Hearings
DROP POLICY IF EXISTS hearings_delete_own ON public.hearings;
CREATE POLICY hearings_delete_own ON public.hearings
  FOR DELETE TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.cases c
      WHERE c.id = hearings.case_id 
      AND c.user_id = auth.uid()
    )
  );

-- Verify the policies
SELECT 
  'CORRECTED POLICIES' as status,
  tablename,
  policyname,
  cmd,
  permissive,
  qual IS NOT NULL as has_using,
  with_check IS NOT NULL as has_with_check
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename IN ('cases', 'documents', 'contacts', 'hearings')
  AND cmd = 'DELETE'
ORDER BY tablename, policyname;

-- The real issue is likely in the JavaScript client
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== DELETE POLICIES CORRECTED ===';
  RAISE NOTICE 'If DELETE is still not working properly, the issue is likely:';
  RAISE NOTICE '1. JavaScript client using service role key (bypasses RLS)';
  RAISE NOTICE '2. JWT token not properly set in JavaScript client';
  RAISE NOTICE '3. Need to check the definitive RLS test results';
END $$;