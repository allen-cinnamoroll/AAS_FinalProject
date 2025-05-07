import express from 'express';
import { 
    enrollStudent,
    getStudentEnrollments,
    getInstructorEnrollments,
    getAllEnrollments,
    dropEnrollment
} from '../controllers/enrollmentController.js';
import { authenticate, authorizeRole } from '../middleware/authMiddleware.js';

const router = express.Router();

// Student routes
router.post('/enroll',
    authenticate,
    authorizeRole('2'), // Student role
    enrollStudent
);

router.get('/my-enrollments',
    authenticate,
    authorizeRole('2'),
    getStudentEnrollments
);

router.delete('/drop/:enrollmentId',
    authenticate,
    authorizeRole('2'),
    dropEnrollment
);

// Instructor routes
router.get('/instructor-enrollments',
    authenticate,
    authorizeRole('1'), // Instructor role
    getInstructorEnrollments
);

// Admin routes
router.get('/all',
    authenticate,
    authorizeRole('admin'),
    getAllEnrollments
);

export default router;