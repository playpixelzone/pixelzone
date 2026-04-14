-- ══════════════════════════════════════════════════════════
--  PIXEL PHONE — Multiplayer (Gartic-Phone-Stil)
-- ══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.pixel_phone_rooms (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code              TEXT NOT NULL UNIQUE,
  host_user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status            TEXT NOT NULL DEFAULT 'lobby'
    CHECK (status IN ('lobby', 'playing', 'reveal', 'closed')),
  draw_seconds      INTEGER NOT NULL DEFAULT 60 CHECK (draw_seconds IN (30, 60, 90, 120)),
  write_seconds     INTEGER NOT NULL DEFAULT 60 CHECK (write_seconds = 60),
  player_count      INTEGER NOT NULL DEFAULT 0 CHECK (player_count >= 0 AND player_count <= 12),
  current_round     INTEGER NOT NULL DEFAULT 0,
  round_kind        TEXT CHECK (round_kind IN ('write', 'draw')),
  deadline_at       TIMESTAMPTZ,
  reveal_owner_idx  INTEGER NOT NULL DEFAULT 0,
  reveal_step       INTEGER NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pixel_phone_rooms_code ON public.pixel_phone_rooms(code);

CREATE TABLE IF NOT EXISTS public.pixel_phone_players (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id     UUID NOT NULL REFERENCES public.pixel_phone_rooms(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  username    TEXT NOT NULL,
  seat_index  INTEGER,
  joined_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (room_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_pixel_phone_players_room ON public.pixel_phone_players(room_id);

CREATE TABLE IF NOT EXISTS public.pixel_phone_submissions (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id              UUID NOT NULL REFERENCES public.pixel_phone_rooms(id) ON DELETE CASCADE,
  round_number         INTEGER NOT NULL CHECK (round_number >= 1),
  booklet_owner_index  INTEGER NOT NULL,
  author_user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind                 TEXT NOT NULL CHECK (kind IN ('text', 'drawing')),
  content              TEXT NOT NULL,
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (room_id, round_number, author_user_id)
);

CREATE INDEX IF NOT EXISTS idx_pixel_phone_submissions_room_round
  ON public.pixel_phone_submissions(room_id, round_number);

CREATE TABLE IF NOT EXISTS public.pixel_phone_ready (
  room_id      UUID NOT NULL REFERENCES public.pixel_phone_rooms(id) ON DELETE CASCADE,
  round_number INTEGER NOT NULL,
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ready        BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at   TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (room_id, round_number, user_id)
);

-- ─── RLS ─────────────────────────────────────────────────
ALTER TABLE public.pixel_phone_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pixel_phone_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pixel_phone_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pixel_phone_ready ENABLE ROW LEVEL SECURITY;

-- Eingeloggte Nutzer dürfen Räume sehen (Lobby-Join per Code)
CREATE POLICY "pp_rooms_select_auth"
  ON public.pixel_phone_rooms FOR SELECT TO authenticated USING (true);

CREATE POLICY "pp_rooms_insert_host"
  ON public.pixel_phone_rooms FOR INSERT TO authenticated
  WITH CHECK (host_user_id = auth.uid());

CREATE POLICY "pp_rooms_update"
  ON public.pixel_phone_rooms FOR UPDATE TO authenticated
  USING (
    host_user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.pixel_phone_players p
      WHERE p.room_id = pixel_phone_rooms.id AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "pp_players_select"
  ON public.pixel_phone_players FOR SELECT TO authenticated USING (true);

CREATE POLICY "pp_players_insert_self"
  ON public.pixel_phone_players FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "pp_players_delete_self"
  ON public.pixel_phone_players FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- Host setzt Sitzplätze beim Start
CREATE POLICY "pp_players_update_host"
  ON public.pixel_phone_players FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.pixel_phone_rooms r
      WHERE r.id = pixel_phone_players.room_id AND r.host_user_id = auth.uid()
    )
  );

CREATE POLICY "pp_submissions_select"
  ON public.pixel_phone_submissions FOR SELECT TO authenticated USING (true);

CREATE POLICY "pp_submissions_insert_self"
  ON public.pixel_phone_submissions FOR INSERT TO authenticated
  WITH CHECK (author_user_id = auth.uid());

CREATE POLICY "pp_ready_select"
  ON public.pixel_phone_ready FOR SELECT TO authenticated USING (true);

CREATE POLICY "pp_ready_upsert_self"
  ON public.pixel_phone_ready FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "pp_ready_update_self"
  ON public.pixel_phone_ready FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "pp_ready_delete_self"
  ON public.pixel_phone_ready FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- Host löscht Ready-Zeilen beim Rundenwechsel
CREATE POLICY "pp_ready_delete_host"
  ON public.pixel_phone_ready FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.pixel_phone_rooms r
      WHERE r.id = pixel_phone_ready.room_id AND r.host_user_id = auth.uid()
    )
  );

-- Realtime
ALTER TABLE public.pixel_phone_rooms REPLICA IDENTITY FULL;
ALTER TABLE public.pixel_phone_players REPLICA IDENTITY FULL;
ALTER TABLE public.pixel_phone_submissions REPLICA IDENTITY FULL;
ALTER TABLE public.pixel_phone_ready REPLICA IDENTITY FULL;

ALTER PUBLICATION supabase_realtime ADD TABLE public.pixel_phone_rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.pixel_phone_players;
ALTER PUBLICATION supabase_realtime ADD TABLE public.pixel_phone_submissions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.pixel_phone_ready;

-- Trigger updated_at
CREATE TRIGGER trg_pixel_phone_rooms_updated
  BEFORE UPDATE ON public.pixel_phone_rooms
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
