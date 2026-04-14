-- Erlaubt Upsert (ON CONFLICT DO UPDATE) für eigene Einreichungen
CREATE POLICY "pp_submissions_update_self"
  ON public.pixel_phone_submissions FOR UPDATE TO authenticated
  USING (author_user_id = auth.uid())
  WITH CHECK (author_user_id = auth.uid());
