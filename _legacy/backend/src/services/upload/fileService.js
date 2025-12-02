const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const UPLOAD_DIR = 'uploads';

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

class FileService {
    constructor() {
        this.storage = multer.memoryStorage();
        this.upload = multer({
            storage: this.storage,
            limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
            fileFilter: (req, file, cb) => {
                if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
                    cb(null, true);
                } else {
                    cb(new Error('Invalid file type. Only JPG and PNG are allowed.'), false);
                }
            }
        });
    }

    getMiddleware(fieldName) {
        return this.upload.single(fieldName);
    }

    async uploadVehicleImage(file) {
        return this.processAndSaveImage(file, 800, 600, 'vehicles');
    }

    async uploadUserAvatar(file) {
        return this.processAndSaveImage(file, 200, 200, 'avatars');
    }

    async processAndSaveImage(file, width, height, subDir) {
        if (!file) throw new Error('No file provided');

        const fileName = `${uuidv4()}-${Date.now()}.jpg`;
        const subDirPath = path.join(UPLOAD_DIR, subDir);

        if (!fs.existsSync(subDirPath)) {
            fs.mkdirSync(subDirPath, { recursive: true });
        }

        const filePath = path.join(subDirPath, fileName);

        await sharp(file.buffer)
            .resize(width, height, { fit: 'cover' })
            .toFormat('jpeg')
            .jpeg({ quality: 80 })
            .toFile(filePath);

        // Return relative path for database storage
        return path.posix.join(UPLOAD_DIR, subDir, fileName); // Use posix for consistent forward slashes
    }

    async deleteFile(filePath) {
        if (!filePath) return;

        // Sanitize path to prevent directory traversal
        const safePath = path.normalize(filePath).replace(/^(\.\.[\/\\])+/, '');
        const absolutePath = path.resolve(safePath);

        // Ensure we are only deleting files within the uploads directory
        if (!absolutePath.startsWith(path.resolve(UPLOAD_DIR))) {
            console.warn(`Attempted to delete file outside uploads directory: ${filePath}`);
            return;
        }

        if (fs.existsSync(absolutePath)) {
            try {
                fs.unlinkSync(absolutePath);
            } catch (error) {
                console.error(`Error deleting file ${filePath}:`, error);
            }
        }
    }
}

module.exports = new FileService();
