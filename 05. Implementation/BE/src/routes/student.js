import express from 'express';
import { 
    registerStudent,
    getAllStudents,
    getStudentById,
    updateStudent,
    deleteStudent,
    getStudentCourses
} from '../controllers/studentController.js';
import { authenticate, authorizeRole } from '../middleware/authMiddleware.js';
import { studentValidationRules, validate, photoValidation } from '../middleware/validator.js';
import { uploadStudent } from '../middleware/upload.js';

const router = express.Router();

// POST - Register new student (Protected + Admin only)
router.post('/register',
    authenticate,
    authorizeRole('admin'),
    uploadStudent.single('idPhoto'),
    studentValidationRules(),
    validate,
    photoValidation,
    registerStudent
);

// GET - Get all students (Protected)
router.get('/',
    authenticate,
    authorizeRole('admin', 'instructor'),
    getAllStudents
);

// GET - Get student courses (Protected)
router.get('/courses',
    authenticate,
    authorizeRole('student'),
    getStudentCourses
);

// PUT - Update student's own profile (Protected - Students can update their own profile)
router.put('/update-profile',
    authenticate,
    authorizeRole('student'),
    (req, res, next) => {
        console.log('Received request to update student profile');
        console.log('User ID from token:', req.user?.userId);
        console.log('User role from token:', req.user?.role);
        console.log('Request body:', req.body);
        next();
    },
    updateStudent
);

// GET - Get student by ID (Protected)
router.get('/:id',
    authenticate,
    authorizeRole('admin', 'instructor', 'student'),
    getStudentById
);

// PUT - Update student (Protected + Admin only)
router.put('/:id',
    authenticate,
    authorizeRole('admin'),
    uploadStudent.single('idPhoto'),
    studentValidationRules(),
    validate,
    photoValidation,
    updateStudent
);

// DELETE - Delete student (Protected + Admin only)
router.delete('/:id',
    authenticate,
    authorizeRole('admin'),
    deleteStudent
);

export default router; 