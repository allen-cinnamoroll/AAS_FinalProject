import express from 'express';
import { 
    enrollStudent,
    getStudentEnrollments,
    getInstructorEnrollments,
    getAllEnrollments,
    deleteEnrollment,
    getEnrollmentsBySection
} from '../controllers/enrollmentController.js';
import { authenticate, authorizeRole } from '../middleware/authMiddleware.js';

const router = express.Router();

// Admin routes for enrollment management
router.post('/enroll',
    authenticate,
    authorizeRole('admin'),
    enrollStudent
);

// Get all enrollments (admin only)
router.get('/',
    authenticate,
    authorizeRole('admin'),
    getAllEnrollments
);

// Get enrollments by section (admin only)
router.get('/section/:sectionId',
    authenticate,
    authorizeRole('admin'),
    getEnrollmentsBySection
);

// Delete enrollment (admin only)
router.delete('/:id',
    authenticate,
    authorizeRole('admin'),
    deleteEnrollment
);

// Student routes
router.get('/my-enrollments',
    authenticate,
    authorizeRole('student'),
    getStudentEnrollments
);

// Instructor routes
router.get('/teaching',
    authenticate,
    authorizeRole('instructor'),
    getInstructorEnrollments
);

export default router;