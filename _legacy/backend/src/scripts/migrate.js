require('dotenv').config();
const { sequelize, User, Organization, Vehicle, Device } = require('../models');
const bcrypt = require('bcryptjs');

const migrate = async () => {
    try {
        console.log('🔄 Connecting to database...');
        await sequelize.authenticate();
        console.log('✅ Database connected.');

        console.log('🔄 Syncing models...');
        // Sync all models. force: true will DROP tables! Use with caution. 
        // alter: true updates tables.
        await sequelize.sync({ alter: true });
        console.log('✅ Models synced.');

        console.log('🌱 Seeding initial data...');

        // Create Admin User
        const adminEmail = 'admin@example.com';
        let admin = await User.findOne({ where: { email: adminEmail } });

        if (!admin) {
            const salt = await bcrypt.genSalt(10);
            const password_hash = await bcrypt.hash('admin123', salt);

            admin = await User.create({
                email: adminEmail,
                password_hash,
                full_name: 'System Admin',
                role: 'admin',
                is_active: true
            });
            console.log('✅ Admin user created: admin@example.com / admin123');
        } else {
            console.log('ℹ️ Admin user already exists.');
        }

        // Create Sample Organization
        let org = await Organization.findOne({ where: { owner_id: admin.id } });
        if (!org) {
            org = await Organization.create({
                name: 'Demo Fleet',
                owner_id: admin.id,
                address: '123 GPS Street',
                phone: '555-0123'
            });
            console.log('✅ Sample organization created.');
        }

        // Create Sample Device & Vehicle (Optional)
        // const imei = '123456789012345';
        // let device = await Device.findOne({ where: { imei } });
        // if (!device) {
        //   device = await Device.create({
        //     imei,
        //     device_model: 'GT06',
        //     sim_number: '1234567890'
        //   });
        //   console.log('✅ Sample device created.');
        // }

        // let vehicle = await Vehicle.findOne({ where: { registration_number: 'DEMO-001' } });
        // if (!vehicle) {
        //   vehicle = await Vehicle.create({
        //     name: 'Demo Truck',
        //     registration_number: 'DEMO-001',
        //     organization_id: org.id,
        //     device_id: device.id,
        //     color: 'White',
        //     model: 'Ford Transit'
        //   });
        //   console.log('✅ Sample vehicle created.');
        // }

        console.log('✨ Migration and seeding completed successfully.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
};

migrate();
