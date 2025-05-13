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

// Configure storage for instructor photos
const instructorStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/instructor-photos'); // Make sure this directory exists
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

// Configure storage for student photos
const studentStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/student-photos'); // New directory for student photos
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'student-' + uniqueSuffix + path.extname(file.originalname));
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

// Create separate upload instances
const uploadInstructor = multer({
    storage: instructorStorage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

const uploadStudent = multer({
    storage: studentStorage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

// Export both as named exports
export { uploadInstructor, uploadStudent };

// Also export as default object
const upload = {
    instructor: uploadInstructor,
    student: uploadStudent
};

export { upload, handleMulterError };