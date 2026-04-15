-- ══════════════════════════════════════════════════════════
--  PONG — Online Multiplayer
-- ══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.pong_rooms (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code           TEXT NOT NULL UNIQUE,
  host_user_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  guest_user_id  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status         TEXT NOT NULL DEFAULT 'lobby'
    CHECK (status IN ('lobby', 'playing', 'finished', 'closed')),
  host_ready     BOOLEAN NOT NULL DEFAULT FALSE,
  guest_ready    BOOLEAN NOT NULL DEFAULT FALSE,
  host_score     INTEGER NOT NULL DEFAULT 0 CHECK (host_score >= 0),
  guest_score    INTEGER NOT NULL DEFAULT 0 CHECK (guest_score >= 0),
  host_paddle_y  DOUBLE PRECISION NOT NULL DEFAULT 192,
  guest_paddle_y DOUBLE PRECISION NOT NULL DEFAULT 192,
  ball_x         DOUBLE PRECISION NOT NULL DEFAULT 393,
  ball_y         DOUBLE PRECISION NOT NULL DEFAULT 233,
  ball_vx        DOUBLE PRECISION NOT NULL DEFAULT 300,
  ball_vy        DOUBLE PRECISION NOT NULL DEFAULT 120,
  winner_side    TEXT CHECK (winner_side IN ('left', 'right')),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pong_rooms_code ON public.pong_rooms(code);

ALTER TABLE public.pong_rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pong_rooms_select_auth"
  ON public.pong_rooms FOR SELECT TO authenticated USING (true);

CREATE POLICY "pong_rooms_insert_host"
  ON public.pong_rooms FOR INSERT TO authenticated
  WITH CHECK (host_user_id = auth.uid());

CREATE POLICY "pong_rooms_update_members"
  ON public.pong_rooms FOR UPDATE TO authenticated
  USING (
    host_user_id = auth.uid()
    OR guest_user_id = auth.uid()
  );

ALTER TABLE public.pong_rooms REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.pong_rooms;

DROP TRIGGER IF EXISTS trg_pong_rooms_updated ON public.pong_rooms;
CREATE TRIGGER trg_pong_rooms_updated
  BEFORE UPDATE ON public.pong_rooms
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
