const { sequelize } = require('./src/config/database');
require('./src/models'); // Load models

const sync = async () => {
    try {
        await sequelize.authenticate();
        console.log('Connected to DB');
        await sequelize.sync({ alter: true });
        console.log('✅ Database synced successfully');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error syncing database:', error);
        process.exit(1);
    }
};

sync();
