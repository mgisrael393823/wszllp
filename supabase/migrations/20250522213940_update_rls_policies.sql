-- Drop existing policies
DROP POLICY IF EXISTS "Authenticated users can view all cases" ON public.cases;
DROP POLICY IF EXISTS "Authenticated users can insert cases" ON public.cases;
DROP POLICY IF EXISTS "Authenticated users can update cases" ON public.cases;
DROP POLICY IF EXISTS "Authenticated users can delete cases" ON public.cases;

DROP POLICY IF EXISTS "Authenticated users can view all hearings" ON public.hearings;
DROP POLICY IF EXISTS "Authenticated users can insert hearings" ON public.hearings;
DROP POLICY IF EXISTS "Authenticated users can update hearings" ON public.hearings;
DROP POLICY IF EXISTS "Authenticated users can delete hearings" ON public.hearings;

-- Create policy for users to see all cases
CREATE POLICY "Users can view all cases" 
ON public.cases FOR SELECT 
TO authenticated, anon
USING (true);

-- Create policy for users to insert cases
CREATE POLICY "Users can insert cases" 
ON public.cases FOR INSERT 
TO authenticated, anon
WITH CHECK (true);

-- Create policy for users to update cases
CREATE POLICY "Users can update cases" 
ON public.cases FOR UPDATE 
TO authenticated, anon
USING (true);

-- Create policy for users to delete cases
CREATE POLICY "Users can delete cases" 
ON public.cases FOR DELETE 
TO authenticated, anon
USING (true);

-- Create policy for users to see all hearings
CREATE POLICY "Users can view all hearings" 
ON public.hearings FOR SELECT 
TO authenticated, anon
USING (true);

-- Create policy for users to insert hearings
CREATE POLICY "Users can insert hearings" 
ON public.hearings FOR INSERT 
TO authenticated, anon
WITH CHECK (true);

-- Create policy for users to update hearings
CREATE POLICY "Users can update hearings" 
ON public.hearings FOR UPDATE 
TO authenticated, anon
USING (true);

-- Create policy for users to delete hearings
CREATE POLICY "Users can delete hearings" 
ON public.hearings FOR DELETE 
TO authenticated, anon
USING (true);