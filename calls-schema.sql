-- Create calls table for storing call records
CREATE TABLE IF NOT EXISTS calls (
  id TEXT PRIMARY KEY,
  from_user_id TEXT NOT NULL,
  to_user_id TEXT NOT NULL,
  call_type TEXT NOT NULL CHECK (call_type IN ('audio', 'video')),
  status TEXT NOT NULL CHECK (status IN ('calling', 'ringing', 'connected', 'ended', 'missed', 'declined')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  connected_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  duration INTEGER, -- duration in seconds
  FOREIGN KEY (from_user_id) REFERENCES profiles(id) ON DELETE CASCADE,
  FOREIGN KEY (to_user_id) REFERENCES profiles(id) ON DELETE CASCADE
);

-- Create call_signals table for real-time signaling
CREATE TABLE IF NOT EXISTS call_signals (
  id SERIAL PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('offer', 'answer', 'ice-candidate', 'end-call', 'mute', 'unmute', 'video-on', 'video-off')),
  data JSONB,
  from_user_id TEXT NOT NULL,
  to_user_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (from_user_id) REFERENCES profiles(id) ON DELETE CASCADE,
  FOREIGN KEY (to_user_id) REFERENCES profiles(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_calls_from_user ON calls(from_user_id);
CREATE INDEX IF NOT EXISTS idx_calls_to_user ON calls(to_user_id);
CREATE INDEX IF NOT EXISTS idx_calls_status ON calls(status);
CREATE INDEX IF NOT EXISTS idx_calls_created_at ON calls(created_at);

CREATE INDEX IF NOT EXISTS idx_signals_from_user ON call_signals(from_user_id);
CREATE INDEX IF NOT EXISTS idx_signals_to_user ON call_signals(to_user_id);
CREATE INDEX IF NOT EXISTS idx_signals_created_at ON call_signals(created_at);

-- Enable RLS (Row Level Security)
ALTER TABLE calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_signals ENABLE ROW LEVEL SECURITY;

-- RLS policies for calls table
CREATE POLICY "Users can view their own calls" ON calls
  FOR SELECT USING (
    auth.uid()::text = from_user_id OR 
    auth.uid()::text = to_user_id
  );

CREATE POLICY "Users can create calls" ON calls
  FOR INSERT WITH CHECK (
    auth.uid()::text = from_user_id
  );

CREATE POLICY "Users can update their calls" ON calls
  FOR UPDATE USING (
    auth.uid()::text = from_user_id OR 
    auth.uid()::text = to_user_id
  );

-- RLS policies for call_signals table
CREATE POLICY "Users can view their signals" ON call_signals
  FOR SELECT USING (
    auth.uid()::text = from_user_id OR 
    auth.uid()::text = to_user_id
  );

CREATE POLICY "Users can create signals" ON call_signals
  FOR INSERT WITH CHECK (
    auth.uid()::text = from_user_id
  );

-- Auto-delete old call signals (older than 1 hour)
-- This prevents the signals table from growing too large
CREATE OR REPLACE FUNCTION cleanup_old_signals()
RETURNS void AS $$
BEGIN
  DELETE FROM call_signals 
  WHERE created_at < NOW() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger to clean up old signals periodically
-- Note: In production, you'd want to use pg_cron or similar for this
CREATE OR REPLACE FUNCTION trigger_cleanup_signals()
RETURNS trigger AS $$
BEGIN
  -- Every 100 inserts, clean up old signals
  IF (NEW.id % 100 = 0) THEN
    PERFORM cleanup_old_signals();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER cleanup_signals_trigger
  AFTER INSERT ON call_signals
  FOR EACH ROW
  EXECUTE FUNCTION trigger_cleanup_signals();