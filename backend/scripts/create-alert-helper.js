// Script to help create an alert rule in the database
// Run with: node scripts/create-alert-helper.js

const { Client } = require('pg');

async function main() {
    const client = new Client({
        host: 'localhost',
        port: 5433,
        user: 'postgres',
        password: 'postgres',
        database: 'etrack',
    });

    try {
        await client.connect();
        console.log('✅ Connected to database\n');

        // Step 1: Show users
        console.log('📋 STEP 1: Your Users');
        console.log('='.repeat(60));
        const usersResult = await client.query('SELECT id, email, name FROM users LIMIT 5');
        console.table(usersResult.rows);

        // Step 2: Show geofences
        console.log('\n📍 STEP 2: Your Geofences');
        console.log('='.repeat(60));
        const geofencesResult = await client.query('SELECT id, name, type FROM geofences LIMIT 10');
        if (geofencesResult.rows.length === 0) {
            console.log('⚠️  No geofences found! Please create a geofence in the UI first.');
        } else {
            console.table(geofencesResult.rows);
        }

        // Step 3: Show devices
        console.log('\n🚗 STEP 3: Your Devices');
        console.log('='.repeat(60));
        const devicesResult = await client.query('SELECT id, name, unique_id FROM devices LIMIT 10');
        if (devicesResult.rows.length === 0) {
            console.log('⚠️  No devices found! Please create a device in the UI first.');
        } else {
            console.table(devicesResult.rows);
        }

        // Step 4: Create example alert rule
        console.log('\n\n🔔 STEP 4: Create Alert Rule');
        console.log('='.repeat(60));

        if (usersResult.rows.length === 0) {
            console.log('❌ Cannot create alert rule: No users found!');
            return;
        }

        const userId = usersResult.rows[0].id;
        const userEmail = usersResult.rows[0].email;

        console.log(`Creating alert rule for user: ${userEmail} (ID: ${userId})`);

        const insertResult = await client.query(`
            INSERT INTO alert_rules (
                id,
                name,
                type,
                user_id,
                notification_channels,
                notification_config,
                enabled,
                conditions,
                created_at,
                updated_at
            ) VALUES (
                gen_random_uuid(),
                $1,
                $2,
                $3,
                $4,
                $5,
                $6,
                $7,
                NOW(),
                NOW()
            ) RETURNING id, name, type
        `, [
            'Geofence Entry Alert',                          // name
            'geofence_enter',                                // type
            userId,                                          // userId
            ['email'],                                       // notification_channels
            JSON.stringify({ email: [userEmail] }),         // notification_config
            true,                                            // enabled
            JSON.stringify({})                               // conditions
        ]);

        const alertRuleId = insertResult.rows[0].id;
        console.log('\n✅ Alert rule created successfully!');
        console.table(insertResult.rows);

        // Step 5: Link to geofences (if any exist)
        if (geofencesResult.rows.length > 0) {
            console.log('\n📍 STEP 5: Linking to Geofences');
            console.log('='.repeat(60));

            // Link to the first geofence as an example
            const geofenceId = geofencesResult.rows[0].id;
            await client.query(`
                INSERT INTO alert_rules_geofences_geofences ("alertRuleId", "geofenceId")
                VALUES ($1, $2)
            `, [alertRuleId, geofenceId]);

            console.log(`✅ Linked to geofence: ${geofencesResult.rows[0].name}`);
        }

        // Step 6: Link to devices (if any exist)
        if (devicesResult.rows.length > 0) {
            console.log('\n🚗 STEP 6: Linking to Devices');
            console.log('='.repeat(60));

            // Link to the first device as an example
            const deviceId = devicesResult.rows[0].id;
            await client.query(`
                INSERT INTO alert_rules_devices_devices ("alertRuleId", "deviceId")
                VALUES ($1, $2)
            `, [alertRuleId, deviceId]);

            console.log(`✅ Linked to device: ${devicesResult.rows[0].name}`);
        }

        // Step 7: Show final result
        console.log('\n\n📊 FINAL RESULT: Your Alert Rules');
        console.log('='.repeat(60));
        const finalResult = await client.query(`
            SELECT 
                ar.id,
                ar.name,
                ar.type,
                ar.enabled,
                ar.notification_channels,
                ar.notification_config,
                u.email as user_email
            FROM alert_rules ar
            JOIN users u ON ar.user_id = u.id
            ORDER BY ar.created_at DESC
        `);
        console.table(finalResult.rows);

        console.log('\n\n✅ All done! Your alert rule is ready.');
        console.log('\n📝 Next steps:');
        console.log('   1. Make sure you have a geofence created in the UI');
        console.log('   2. Run: node scripts/test-geofence-alert.js');
        console.log('   3. Check the backend logs for the notification\n');

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error);
    } finally {
        await client.end();
    }
}

main();
