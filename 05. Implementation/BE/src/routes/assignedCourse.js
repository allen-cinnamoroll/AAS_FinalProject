import express from 'express';
import { 
    assignCourse,
    getAllAssignedCourses,
    getAssignedCourseById,
    updateAssignedCourse,
    deleteAssignedCourse
} from '../controllers/assignedCourseController.js';
import { authenticate, authorizeRole } from '../middleware/authMiddleware.js';

const router = express.Router();

// POST - Assign course (Admin only)
router.post('/assign',
    authenticate,
    authorizeRole('admin'),
    assignCourse
);

// GET - Get all assigned courses
router.get('/',
    authenticate,
    authorizeRole('admin'),
    getAllAssignedCourses
);

// GET - Get assigned course by ID
router.get('/:id',
    authenticate,
    authorizeRole('admin'),
    getAssignedCourseById
);

// PUT - Update assigned course (Admin only)
router.put('/:id',
    authenticate,
    authorizeRole('admin'),
    updateAssignedCourse
);

// DELETE - Delete assigned course (Admin only)
router.delete('/:id',
    authenticate,
    authorizeRole('admin'),
    deleteAssignedCourse
);

export default router;