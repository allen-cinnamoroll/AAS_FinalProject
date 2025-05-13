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
import { studentValidationRules, validate, photoValidation, uploadStudent } from '../middleware/validator.js';

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

// GET - Get student's courses (Protected)
router.get('/courses',
    authenticate,
    authorizeRole('student'),
    getStudentCourses
);

export default router; 