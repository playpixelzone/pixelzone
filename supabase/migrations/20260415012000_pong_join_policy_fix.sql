-- Pong: Gast soll Lobby-Raum beitreten koennen (RLS-Fix)
DROP POLICY IF EXISTS "pong_rooms_update_members" ON public.pong_rooms;

CREATE POLICY "pong_rooms_update_members"
  ON public.pong_rooms FOR UPDATE TO authenticated
  USING (
    host_user_id = auth.uid()
    OR guest_user_id = auth.uid()
    OR (guest_user_id IS NULL AND status = 'lobby')
  )
  WITH CHECK (
    host_user_id = auth.uid()
    OR guest_user_id = auth.uid()
  );
