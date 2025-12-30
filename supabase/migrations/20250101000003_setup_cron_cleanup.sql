-- Enable pg_cron extension for scheduled jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Grant usage on cron schema
GRANT USAGE ON SCHEMA cron TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA cron TO postgres;

-- Schedule the cleanup job to run daily at 2 AM UTC
SELECT cron.schedule(
  'cleanup-old-messages-daily',
  '0 2 * * *', -- Run at 2:00 AM UTC every day
  $$SELECT run_message_cleanup();$$
);

-- Alternative: Run cleanup every 12 hours (at 2 AM and 2 PM)
-- Uncomment the line below and comment out the daily job above if you prefer more frequent cleanup
-- SELECT cron.schedule('cleanup-old-messages-12h', '0 2,14 * * *', $$SELECT run_message_cleanup();$$);

-- View scheduled jobs (for verification)
-- Run this query to see your scheduled jobs:
-- SELECT * FROM cron.job;

-- To manually run the cleanup (for testing):
-- SELECT run_message_cleanup();

-- To unschedule the job (if needed):
-- SELECT cron.unschedule('cleanup-old-messages-daily');

COMMENT ON EXTENSION pg_cron IS 'Job scheduler for PostgreSQL';
