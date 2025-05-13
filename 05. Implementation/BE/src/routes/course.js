import express from 'express';
import { 
    registerCourse, 
    getAllCourses, 
    getCourseById, 
    updateCourse, 
    deleteCourse 
} from '../controllers/courseController.js';
import { authenticate, authorizeRole } from '../middleware/authMiddleware.js';
import { courseValidationRules, validate } from '../middleware/validator.js';

const router = express.Router();

// POST - Register new course (Admin only)
router.post('/register',
    authenticate,
    authorizeRole('admin'),
    courseValidationRules(),
    validate,
    registerCourse
);

// GET - Get all courses
router.get('/',
    authenticate,
    getAllCourses
);

// GET - Get course by ID
router.get('/:id',
    authenticate,
    authorizeRole('admin'),
    getCourseById
);

// PUT - Update course (Admin only)
router.put('/:id',
    authenticate,
    authorizeRole('admin'),
    courseValidationRules(),
    validate,
    updateCourse
);

// DELETE - Delete course (Admin only)
router.delete('/:id',
    authenticate,
    authorizeRole('admin'),
    deleteCourse
);

export default router;