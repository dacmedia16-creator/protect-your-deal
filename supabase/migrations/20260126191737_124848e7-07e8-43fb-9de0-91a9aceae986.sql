-- Create unique partial index to ensure only one active session per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_sessions_one_active_per_user 
ON public.user_sessions (user_id) 
WHERE logout_at IS NULL;