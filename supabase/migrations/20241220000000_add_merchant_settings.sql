-- Add settings column to merchants table
-- This stores merchant-specific checkout extension configuration

ALTER TABLE merchants
ADD COLUMN settings JSONB DEFAULT '{
  "extensionEnabled": true,
  "searchRadius": 50,
  "maxInstallers": 3
}'::jsonb;

-- Add index for querying settings
CREATE INDEX idx_merchants_settings ON merchants USING gin(settings);
