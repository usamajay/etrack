-- Step-by-Step Guide to Create an Alert Rule in PostgreSQL

-- STEP 1: Connect to your PostgreSQL database
-- Run this command in your terminal:
-- psql -h localhost -p 5433 -U postgres -d etrack

-- STEP 2: Check your user ID
-- Find your user ID (you'll need this for the alert rule)
SELECT id, email, name FROM users;

-- STEP 3: Check your geofences
-- Find the geofence IDs you want to monitor
SELECT id, name, type FROM geofences;

-- STEP 4: Check your devices
-- Find the device IDs you want to monitor
SELECT id, name, unique_id FROM devices;

-- STEP 5: Create an alert rule
-- Replace the values in <brackets> with your actual values from steps 2-4

INSERT INTO alert_rules (
    id,
    name,
    type,
    "userId",
    notification_channels,
    notification_config,
    enabled,
    conditions,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    'My Geofence Entry Alert',                    -- Name of your alert
    'geofence_enter',                             -- Event type: geofence_enter, geofence_exit, speeding, etc.
    <YOUR_USER_ID>,                               -- Replace with your user ID from STEP 2
    ARRAY['email', 'sms'],                        -- Notification channels
    '{"email": ["your@email.com"], "sms": ["+1234567890"]}',  -- Replace with your email/phone
    true,                                         -- Enabled
    '{}',                                         -- Additional conditions (empty for now)
    NOW(),
    NOW()
);

-- STEP 6: Link the alert rule to specific geofences (optional)
-- If you want the alert to trigger only for specific geofences, run this:
-- First, get the alert rule ID you just created:
SELECT id, name FROM alert_rules ORDER BY created_at DESC LIMIT 1;

-- Then link it to a geofence:
INSERT INTO alert_rules_geofences_geofences ("alertRuleId", "geofenceId")
VALUES (
    '<ALERT_RULE_ID>',    -- From the query above
    '<GEOFENCE_ID>'       -- From STEP 3
);

-- STEP 7: Link the alert rule to specific devices (optional)
-- If you want the alert to trigger only for specific devices:
INSERT INTO alert_rules_devices_devices ("alertRuleId", "deviceId")
VALUES (
    '<ALERT_RULE_ID>',    -- From STEP 6
    '<DEVICE_ID>'         -- From STEP 4
);

-- STEP 8: Verify your alert rule
SELECT 
    ar.id,
    ar.name,
    ar.type,
    ar.enabled,
    ar.notification_channels,
    ar.notification_config,
    u.email as user_email
FROM alert_rules ar
JOIN users u ON ar."userId" = u.id
ORDER BY ar.created_at DESC;

-- NOTES:
-- - If you don't link to specific geofences (STEP 6), the alert will trigger for ALL geofences
-- - If you don't link to specific devices (STEP 7), the alert will trigger for ALL devices
-- - Event types available: 'geofence_enter', 'geofence_exit', 'speeding', 'device_offline', 'device_online', 'custom'
