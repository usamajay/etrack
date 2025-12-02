# How to Create Alert Rules - Step by Step Guide

## Quick Method (Recommended)

### Step 1: Run the Helper Script
```bash
cd backend
node scripts/create-alert-simple.js
```

This will automatically:
- Find your user account
- Create a "Geofence Entry Alert" 
- Configure it to send email notifications
- Show you the alert rule details

### Step 2: Test the Alert
```bash
node scripts/test-geofence-alert.js
```

### Step 3: Check Backend Logs
Look for:
- `🚨 Device [name] ENTERED geofence: [geofence name]`
- Email notification in a boxed format

---

## Manual Method (Using SQL)

If you prefer to create alert rules manually or customize them:

### Step 1: Connect to Database
You can use any PostgreSQL client or the helper scripts.

### Step 2: Find Your User ID
```sql
SELECT id, email, name FROM users;
```

### Step 3: Create Alert Rule
```sql
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
    'My Custom Alert',
    'geofence_enter',  -- or 'geofence_exit', 'speeding', etc.
    1,  -- Replace with your user ID
    '{email,sms}',  -- Notification channels
    '{"email": ["your@email.com"], "sms": ["+1234567890"]}',
    true,
    '{}',
    NOW(),
    NOW()
);
```

### Step 4: (Optional) Link to Specific Geofences
```sql
-- Get the alert rule ID you just created
SELECT id, name FROM alert_rules ORDER BY created_at DESC LIMIT 1;

-- Get your geofence IDs
SELECT id, name FROM geofences;

-- Link them
INSERT INTO alert_rules_geofences_geofences ("alertRuleId", "geofenceId")
VALUES ('your-alert-rule-id', 'your-geofence-id');
```

### Step 5: (Optional) Link to Specific Devices
```sql
-- Get your device IDs
SELECT id, name FROM devices;

-- Link them
INSERT INTO alert_rules_devices_devices ("alertRuleId", "deviceId")
VALUES ('your-alert-rule-id', 'your-device-id');
```

---

## Event Types Available

- `geofence_enter` - When a device enters a geofence
- `geofence_exit` - When a device exits a geofence
- `speeding` - When a device exceeds speed limit
- `device_offline` - When a device goes offline
- `device_online` - When a device comes online
- `custom` - Custom events

## Notification Channels

- `email` - Email notifications (currently logs to console)
- `sms` - SMS notifications (currently logs to console)
- `push` - Push notifications (currently logs to console)
- `webhook` - Webhook notifications (currently logs to console)

## Important Notes

1. **No Geofence/Device Links**: If you don't link to specific geofences or devices, the alert will trigger for ALL geofences and ALL devices
2. **Email Format**: Currently emails are logged to the console in a formatted box. To send real emails, you'll need to integrate with SendGrid or AWS SES
3. **State Tracking**: The system uses Redis to track which geofences devices are currently inside, so it can detect Enter/Exit events

## Troubleshooting

**Alert not triggering?**
1. Make sure you have a geofence created in the UI
2. Make sure your test device coordinates are INSIDE the geofence
3. Check that the alert rule is enabled (`enabled = true`)
4. Check the backend logs for any errors

**Can't run the script?**
1. Make sure you're in the `backend` directory
2. Make sure PostgreSQL is running (`docker-compose up -d`)
3. Make sure the `pg` package is installed (`npm install pg`)
