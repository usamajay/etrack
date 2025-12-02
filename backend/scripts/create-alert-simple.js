// Simple script to create an alert rule
// Run with: node scripts/create-alert-simple.js

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

        // Get first user
        const usersResult = await client.query('SELECT id, email, name FROM users LIMIT 1');
        if (usersResult.rows.length === 0) {
            console.log('❌ No users found! Please register a user first.');
            return;
        }

        const user = usersResult.rows[0];
        console.log(`📋 Creating alert for user: ${user.email}\n`);

        // Create alert rule
        const result = await client.query(`
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
                'Geofence Entry Alert',
                'geofence_enter',
                $1,
                '{email}',
                $2,
                true,
                '{}',
                NOW(),
                NOW()
            ) RETURNING id, name, type
        `, [user.id, JSON.stringify({ email: [user.email] })]);

        console.log('✅ Alert rule created successfully!\n');
        console.log('Alert Rule Details:');
        console.log('  ID:', result.rows[0].id);
        console.log('  Name:', result.rows[0].name);
        console.log('  Type:', result.rows[0].type);
        console.log('  Email:', user.email);

        // Show all alert rules
        console.log('\n📊 All your alert rules:');
        const allRules = await client.query(`
            SELECT 
                ar.id,
                ar.name,
                ar.type,
                ar.enabled,
                ar.notification_channels,
                ar.notification_config
            FROM alert_rules ar
            WHERE ar."userId" = $1
            ORDER BY ar.created_at DESC
        `, [user.id]);

        console.table(allRules.rows);

        console.log('\n✅ Done! Now you can test with:');
        console.log('   node scripts/test-geofence-alert.js\n');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await client.end();
    }
}

main();
