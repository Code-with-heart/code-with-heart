-- Create feedback_likes junction table
CREATE TABLE IF NOT EXISTS feedback_likes (
  feedback_id UUID NOT NULL REFERENCES feedback(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (feedback_id, user_id)
);
