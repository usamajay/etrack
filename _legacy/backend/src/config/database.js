require('dotenv').config();
const { Sequelize } = require('sequelize');

let sequelize;

if (process.env.DATABASE_DIALECT === 'sqlite') {
    console.log('Using SQLite Database');
    sequelize = new Sequelize({
        dialect: 'sqlite',
        storage: process.env.DATABASE_STORAGE || './database.sqlite',
        logging: false
    });
} else {
    sequelize = new Sequelize(process.env.DATABASE_URL, {
        dialect: 'postgres',
        logging: false,
        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000
        }
    });
}

const connectDB = async () => {
    try {
        await sequelize.authenticate();
        console.log('✅ Database connection has been established successfully.');

        // Enable PostGIS extension ONLY if using Postgres
        if (sequelize.getDialect() === 'postgres') {
            try {
                await sequelize.query('CREATE EXTENSION IF NOT EXISTS postgis;');
                console.log('✅ PostGIS extension enabled.');
            } catch (e) {
                console.warn('⚠️ Could not enable PostGIS (might need superuser):', e.message);
            }
        }

    } catch (error) {
        console.error('❌ Unable to connect to the database:', error);
    }
};

module.exports = { sequelize, Sequelize, connectDB };
