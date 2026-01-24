-- ============================================
-- GAME SESSIONS SCHEMA
-- Real-time multiplayer game sessions
-- ============================================

-- Game Sessions Table
CREATE TABLE IF NOT EXISTS game_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    game_id TEXT NOT NULL, -- e.g., 'dual-axis'

    -- Players
    host_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    guest_id UUID REFERENCES profiles(id) ON DELETE CASCADE,

    -- Session state
    status TEXT DEFAULT 'waiting' CHECK (status IN ('waiting', 'playing', 'finished', 'abandoned')),

    -- Game state (JSON for flexibility)
    game_state JSONB DEFAULT '{}',

    -- Scores
    host_score INTEGER DEFAULT 0,
    guest_score INTEGER DEFAULT 0,
    winner_id UUID REFERENCES profiles(id) ON DELETE SET NULL,

    -- XP rewards
    host_xp_earned INTEGER DEFAULT 0,
    guest_xp_earned INTEGER DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    started_at TIMESTAMP WITH TIME ZONE,
    finished_at TIMESTAMP WITH TIME ZONE,

    -- Settings
    max_score INTEGER DEFAULT 11,
    is_private BOOLEAN DEFAULT false,
    invite_code TEXT UNIQUE
);

-- Game Moves Table (for real-time sync)
-- Stores only the moves/inputs, not full game state
CREATE TABLE IF NOT EXISTS game_moves (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID REFERENCES game_sessions(id) ON DELETE CASCADE NOT NULL,
    player_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,

    -- Move data
    move_type TEXT NOT NULL, -- 'paddle_move', 'ball_serve', etc.
    move_data JSONB NOT NULL, -- { y: 150, direction: 'up' }
    sequence_num INTEGER NOT NULL,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Game Invites Table (for friend invitations)
CREATE TABLE IF NOT EXISTS game_invites (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID REFERENCES game_sessions(id) ON DELETE CASCADE NOT NULL,
    inviter_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    invitee_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,

    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')),

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '5 minutes',

    UNIQUE(session_id, invitee_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_game_sessions_status ON game_sessions(status);
CREATE INDEX IF NOT EXISTS idx_game_sessions_host ON game_sessions(host_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_guest ON game_sessions(guest_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_game ON game_sessions(game_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_waiting ON game_sessions(status, game_id) WHERE status = 'waiting';
CREATE INDEX IF NOT EXISTS idx_game_moves_session ON game_moves(session_id, sequence_num);
CREATE INDEX IF NOT EXISTS idx_game_invites_invitee ON game_invites(invitee_id, status);

-- Enable Row Level Security
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_moves ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_invites ENABLE ROW LEVEL SECURITY;

-- RLS Policies for game_sessions
CREATE POLICY "Users can view sessions they're part of"
    ON game_sessions FOR SELECT
    USING (
        auth.uid() = host_id OR
        auth.uid() = guest_id OR
        (status = 'waiting' AND is_private = false)
    );

CREATE POLICY "Authenticated users can create sessions"
    ON game_sessions FOR INSERT
    WITH CHECK (auth.uid() = host_id);

CREATE POLICY "Players can update their sessions"
    ON game_sessions FOR UPDATE
    USING (auth.uid() = host_id OR auth.uid() = guest_id);

-- RLS Policies for game_moves
CREATE POLICY "Players can view moves in their sessions"
    ON game_moves FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM game_sessions
            WHERE game_sessions.id = game_moves.session_id
            AND (game_sessions.host_id = auth.uid() OR game_sessions.guest_id = auth.uid())
        )
    );

CREATE POLICY "Players can insert moves in their sessions"
    ON game_moves FOR INSERT
    WITH CHECK (
        auth.uid() = player_id AND
        EXISTS (
            SELECT 1 FROM game_sessions
            WHERE game_sessions.id = session_id
            AND (game_sessions.host_id = auth.uid() OR game_sessions.guest_id = auth.uid())
            AND game_sessions.status = 'playing'
        )
    );

-- RLS Policies for game_invites
CREATE POLICY "Users can view invites they sent or received"
    ON game_invites FOR SELECT
    USING (auth.uid() = inviter_id OR auth.uid() = invitee_id);

CREATE POLICY "Users can create invites for their sessions"
    ON game_invites FOR INSERT
    WITH CHECK (
        auth.uid() = inviter_id AND
        EXISTS (
            SELECT 1 FROM game_sessions
            WHERE game_sessions.id = session_id
            AND game_sessions.host_id = auth.uid()
        )
    );

CREATE POLICY "Invitees can update invite status"
    ON game_invites FOR UPDATE
    USING (auth.uid() = invitee_id);

-- Function to join a session
CREATE OR REPLACE FUNCTION join_game_session(p_session_id UUID)
RETURNS game_sessions AS $$
DECLARE
    v_session game_sessions;
BEGIN
    UPDATE game_sessions
    SET
        guest_id = auth.uid(),
        status = 'playing',
        started_at = NOW()
    WHERE id = p_session_id
    AND status = 'waiting'
    AND guest_id IS NULL
    AND host_id != auth.uid()
    RETURNING * INTO v_session;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Session not available or already full';
    END IF;

    RETURN v_session;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to finish a session and award XP
CREATE OR REPLACE FUNCTION finish_game_session(
    p_session_id UUID,
    p_host_score INTEGER,
    p_guest_score INTEGER
)
RETURNS game_sessions AS $$
DECLARE
    v_session game_sessions;
    v_winner_id UUID;
    v_host_xp INTEGER;
    v_guest_xp INTEGER;
BEGIN
    -- Determine winner
    IF p_host_score > p_guest_score THEN
        SELECT host_id INTO v_winner_id FROM game_sessions WHERE id = p_session_id;
        v_host_xp := 10 + p_host_score; -- Winner bonus + points
        v_guest_xp := 5 + p_guest_score; -- Participation + points
    ELSIF p_guest_score > p_host_score THEN
        SELECT guest_id INTO v_winner_id FROM game_sessions WHERE id = p_session_id;
        v_host_xp := 5 + p_host_score;
        v_guest_xp := 10 + p_guest_score;
    ELSE
        v_winner_id := NULL; -- Draw
        v_host_xp := 7 + p_host_score;
        v_guest_xp := 7 + p_guest_score;
    END IF;

    -- Update session
    UPDATE game_sessions
    SET
        status = 'finished',
        host_score = p_host_score,
        guest_score = p_guest_score,
        winner_id = v_winner_id,
        host_xp_earned = v_host_xp,
        guest_xp_earned = v_guest_xp,
        finished_at = NOW()
    WHERE id = p_session_id
    AND status = 'playing'
    AND (auth.uid() = host_id OR auth.uid() = guest_id)
    RETURNING * INTO v_session;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Session not found or not playing';
    END IF;

    -- Award XP to players
    UPDATE profiles SET xp = xp + v_host_xp WHERE id = v_session.host_id;
    UPDATE profiles SET xp = xp + v_guest_xp WHERE id = v_session.guest_id;

    RETURN v_session;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate unique invite code
CREATE OR REPLACE FUNCTION generate_invite_code()
RETURNS TEXT AS $$
DECLARE
    v_code TEXT;
    v_exists BOOLEAN;
BEGIN
    LOOP
        v_code := upper(substr(md5(random()::text), 1, 6));
        SELECT EXISTS(SELECT 1 FROM game_sessions WHERE invite_code = v_code) INTO v_exists;
        EXIT WHEN NOT v_exists;
    END LOOP;
    RETURN v_code;
END;
$$ LANGUAGE plpgsql;

-- Enable real-time for game_sessions and game_moves
-- Note: This requires running in Supabase dashboard or with appropriate permissions
-- ALTER PUBLICATION supabase_realtime ADD TABLE game_sessions;
-- ALTER PUBLICATION supabase_realtime ADD TABLE game_moves;

COMMENT ON TABLE game_sessions IS 'Real-time multiplayer game sessions';
COMMENT ON TABLE game_moves IS 'Game moves for real-time synchronization';
COMMENT ON TABLE game_invites IS 'Invitations to join game sessions';
