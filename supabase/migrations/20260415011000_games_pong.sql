-- Pong in games-Verwaltung aufnehmen (Admin-Panel + PZ.pruefeSpielStatus)
INSERT INTO public.games (id, name, is_active, disabled_message)
VALUES ('pong', 'Pong', true, '')
ON CONFLICT (id) DO UPDATE
SET name = EXCLUDED.name;
