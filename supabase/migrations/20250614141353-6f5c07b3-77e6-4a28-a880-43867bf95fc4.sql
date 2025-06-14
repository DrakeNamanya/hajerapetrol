
-- Drop existing problematic policies
DROP POLICY IF EXISTS "Directors can manage invitations" ON public.team_invitations;
DROP POLICY IF EXISTS "Users can view their own invitations" ON public.team_invitations;

-- Create new working policies for team_invitations
CREATE POLICY "Directors can manage all invitations" 
  ON public.team_invitations FOR ALL
  TO authenticated
  USING (get_user_role(auth.uid()) = 'director');

CREATE POLICY "Users can view invitations by email" 
  ON public.team_invitations FOR SELECT
  TO authenticated
  USING (
    email = (
      SELECT email 
      FROM public.profiles 
      WHERE id = auth.uid()
    )
  );
