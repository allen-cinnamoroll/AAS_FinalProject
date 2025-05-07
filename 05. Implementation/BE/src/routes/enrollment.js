import express from 'express';
import { 
    enrollStudent,
    getStudentEnrollments,
    getInstructorEnrollments,
    getAllEnrollments,
    deleteEnrollment
} from '../controllers/enrollmentController.js';
import { authenticate, authorizeRole } from '../middleware/authMiddleware.js';

const router = express.Router();

// Admin routes for enrollment management
router.post('/enroll',
    authenticate,
    authorizeRole('admin'),
    enrollStudent
);

// Student can only view their enrollments
router.get('/my-enrollments',
    authenticate,
    authorizeRole('2'),
    getStudentEnrollments
);

// Delete enrollment (Admin only)
router.delete('/:id',
    authenticate,
    authorizeRole('admin'),
    deleteEnrollment
);

// Instructor routes
router.get('/instructor-enrollments',
    authenticate,
    authorizeRole('1'),
    getInstructorEnrollments
);

// Admin routes
router.get('/all',
    authenticate,
    authorizeRole('admin'),
    getAllEnrollments
);

export default router;