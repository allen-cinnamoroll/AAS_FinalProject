import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Create upload directories if they don't exist
const createUploadDirs = () => {
    const dirs = ['uploads', 'uploads/student-photos', 'uploads/instructor-photos'];
    dirs.forEach(dir => {
        if (!fs.existsSync(dir)) {
            try {
                fs.mkdirSync(dir, { recursive: true });
                console.log(`Created directory: ${dir}`);
            } catch (error) {
                console.error(`Error creating directory ${dir}:`, error);
            }
        }
    });
};

// Call createUploadDirs immediately
createUploadDirs();

// Configure multer for file upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        try {
            // Determine if this is a student or instructor upload based on the route
            const isStudent = req.originalUrl.includes('/students/');
            const uploadDir = isStudent ? 'uploads/student-photos' : 'uploads/instructor-photos';
            
            // Ensure directory exists
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }
            
            cb(null, uploadDir);
        } catch (error) {
            cb(error);
        }
    },
    filename: (req, file, cb) => {
        try {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            const prefix = req.originalUrl.includes('/students/') ? 'student-' : 'instructor-';
            const ext = path.extname(file.originalname).toLowerCase();
            cb(null, prefix + uniqueSuffix + ext);
        } catch (error) {
            cb(error);
        }
    }
});

// File filter to accept only images
const fileFilter = (req, file, cb) => {
    try {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only JPEG, PNG and JPG are allowed.'), false);
        }
    } catch (error) {
        cb(error);
    }
};

// Error handling middleware
const handleMulterError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: 'File size too large. Maximum size is 5MB.'
            });
        }
        return res.status(400).json({
            success: false,
            message: err.message
        });
    }
    next(err);
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

export { upload, handleMulterError };