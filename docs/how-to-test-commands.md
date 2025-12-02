# How to Test Commands

## Quick Test (Recommended)

### Step 1: Run the test script
```bash
cd backend
node scripts/test-command.js
```

This will:
1. Login automatically
2. Find your first device
3. Send a "request_location" command
4. Show the command status

---

## Manual Testing with PowerShell

If you want to test manually in PowerShell, use this format:

### Step 1: Login and get token
```powershell
$loginResponse = Invoke-RestMethod -Uri "http://localhost:3001/auth/login" -Method POST -Body (@{email="test@example.com"; password="password123"} | ConvertTo-Json) -ContentType "application/json"
$token = $loginResponse.access_token
```

### Step 2: Send command
```powershell
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

$body = @{
    type = "request_location"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3001/commands/device/1" -Method POST -Headers $headers -Body $body
```

---

## Available Commands

### 1. Request Location (Safest)
```javascript
{
  "type": "request_location"
}
```

### 2. Engine Cut (Safety check: speed < 5 km/h)
```javascript
{
  "type": "engine_cut"
}
```

### 3. Engine Resume
```javascript
{
  "type": "engine_resume"
}
```

### 4. Set Speed Limit
```javascript
{
  "type": "set_speed_limit",
  "parameters": {
    "speed": 80
  }
}
```

### 5. Reboot Device
```javascript
{
  "type": "reboot"
}
```

---

## What to Expect

### If device is connected:
```
✅ Command sent successfully!
Command Details:
  ID: abc-123-def
  Type: request_location
  Status: pending

📊 Command Status:
  Status: sent
  Sent at: 2025-12-02T14:45:00.000Z
```

### If device is NOT connected:
```
📊 Command Status:
  Status: failed
  Error: Device not connected
```

### If trying to cut engine while moving:
```
❌ Error: Cannot cut engine: vehicle is moving too fast (speed > 5 km/h). Please wait until vehicle stops.
```

---

## Check Backend Logs

After sending a command, check your backend terminal for:
```
[CommandsService] Command created: [ID] (request_location) for device [name]
[GpsGateway] Command sent to device [IMEI]: [hex data]
```

Or if device not connected:
```
[GpsGateway] Device [IMEI] not connected
[CommandsService] Command sent: [ID]
```
