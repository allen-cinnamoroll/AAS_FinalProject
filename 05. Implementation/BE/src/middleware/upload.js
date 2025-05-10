import multer from 'multer';
import path from 'path';

// Configure storage for instructor photos
const instructorStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/instructor-photos');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'instructor-' + uniqueSuffix + path.extname(file.originalname));
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
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only JPEG, PNG and JPG are allowed.'), false);
    }
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

export default upload;