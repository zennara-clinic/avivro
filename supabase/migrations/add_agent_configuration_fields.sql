-- Add custom_instructions and show_branding fields to agents table
ALTER TABLE agents
ADD COLUMN IF NOT EXISTS custom_instructions TEXT,
ADD COLUMN IF NOT EXISTS show_branding BOOLEAN DEFAULT true;

-- Update existing rows to have show_branding = true by default
UPDATE agents SET show_branding = true WHERE show_branding IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN agents.custom_instructions IS 'Custom instructions for agent behavior';
COMMENT ON COLUMN agents.show_branding IS 'Whether to show "Powered by Avivro" badge';
