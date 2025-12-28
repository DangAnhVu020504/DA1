import { diskStorage } from 'multer';
import { extname } from 'path';
import { existsSync, mkdirSync } from 'fs';

export const multerConfig = {
    storage: diskStorage({
        destination: (req, file, callback) => {
            const uploadPath = './uploads';
            if (!existsSync(uploadPath)) {
                mkdirSync(uploadPath);
            }
            callback(null, uploadPath);
        },
        filename: (req, file, callback) => {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
            const ext = extname(file.originalname);
            callback(null, `avatar-${uniqueSuffix}${ext}`);
        },
    }),
    fileFilter: (req, file, callback) => {
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
            return callback(new Error('Only image files are allowed!'), false);
        }
        callback(null, true);
    },
};

// Video upload configuration
export const multerVideoConfig = {
    storage: diskStorage({
        destination: (req, file, callback) => {
            const uploadPath = './uploads/videos';
            if (!existsSync(uploadPath)) {
                mkdirSync(uploadPath, { recursive: true });
            }
            callback(null, uploadPath);
        },
        filename: (req, file, callback) => {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
            const ext = extname(file.originalname);
            callback(null, `video-${uniqueSuffix}${ext}`);
        },
    }),
    fileFilter: (req, file, callback) => {
        if (!file.originalname.match(/\.(mp4|webm|mov|avi)$/i)) {
            return callback(new Error('Only video files are allowed!'), false);
        }
        callback(null, true);
    },
    limits: {
        fileSize: 100 * 1024 * 1024, // 100MB max
    },
};
