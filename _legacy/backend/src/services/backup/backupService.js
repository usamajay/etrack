const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const archiver = require('archiver');
const cron = require('node-cron');
const { sequelize } = require('../../models');

const BACKUP_DIR = 'backups';

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

class BackupService {

    constructor() {
        this.scheduleBackups();
    }

    scheduleBackups() {
        // Run daily at 2:00 AM
        cron.schedule('0 2 * * *', async () => {
            console.log('🔄 Starting daily backup...');
            try {
                const dbBackup = await this.backupDatabase();
                const filesBackup = await this.backupFiles();

                // Upload to cloud (placeholder)
                await this.uploadToCloud(dbBackup);
                await this.uploadToCloud(filesBackup);

                this.cleanOldBackups();
                console.log('✅ Daily backup completed.');
            } catch (error) {
                console.error('❌ Backup failed:', error);
            }
        });
    }

    async backupDatabase() {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const dialect = sequelize.getDialect();

        if (dialect === 'sqlite') {
            const dbPath = sequelize.options.storage;
            const backupPath = path.join(BACKUP_DIR, `db-backup-${timestamp}.sqlite`);
            fs.copyFileSync(dbPath, backupPath);
            console.log(`Database backed up to ${backupPath}`);
            return backupPath;
        }

        if (dialect === 'postgres') {
            const fileName = `db-backup-${timestamp}.sql`;
            const filePath = path.join(BACKUP_DIR, fileName);

            // Assumes pg_dump is available in PATH and .env has credentials
            // PGPASSWORD needs to be set in env for non-interactive auth
            const cmd = `pg_dump ${process.env.DATABASE_URL} > ${filePath}`;

            return new Promise((resolve, reject) => {
                exec(cmd, (error, stdout, stderr) => {
                    if (error) {
                        console.error(`pg_dump error: ${error.message}`);
                        return reject(error);
                    }
                    console.log(`Database backed up to ${filePath}`);
                    resolve(filePath);
                });
            });
        }
    }

    async backupFiles() {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const fileName = `files-backup-${timestamp}.zip`;
        const filePath = path.join(BACKUP_DIR, fileName);
        const output = fs.createWriteStream(filePath);
        const archive = archiver('zip', { zlib: { level: 9 } });

        return new Promise((resolve, reject) => {
            output.on('close', () => {
                console.log(`Files backed up to ${filePath} (${archive.pointer()} bytes)`);
                resolve(filePath);
            });

            archive.on('error', (err) => reject(err));

            archive.pipe(output);
            archive.directory('uploads/', false);
            archive.finalize();
        });
    }

    async uploadToCloud(filePath) {
        if (!filePath) return;
        // Placeholder for S3/DigitalOcean Spaces upload
        console.log(`[Cloud Upload] Would upload ${filePath} to S3 bucket...`);
        // Example:
        // const fileContent = fs.readFileSync(filePath);
        // await s3.upload({ Bucket: 'my-backups', Key: path.basename(filePath), Body: fileContent }).promise();
    }

    cleanOldBackups() {
        // Keep only last 7 days
        const files = fs.readdirSync(BACKUP_DIR);
        const now = Date.now();
        const sevenDays = 7 * 24 * 60 * 60 * 1000;

        files.forEach(file => {
            const filePath = path.join(BACKUP_DIR, file);
            const stats = fs.statSync(filePath);
            if (now - stats.mtimeMs > sevenDays) {
                fs.unlinkSync(filePath);
                console.log(`Deleted old backup: ${file}`);
            }
        });
    }
}

module.exports = new BackupService();
