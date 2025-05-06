import express from 'express';
import { registerInstructor, getAllInstructors, getInstructorById } from '../controllers/instructorController.js';
import { authenticate, authorizeRole } from '../middleware/authMiddleware.js';
import { instructorValidationRules, validate, photoValidation } from '../middleware/validator.js';
import upload from '../middleware/upload.js';

const router = express.Router();

// POST - Register new instructor (Protected + Admin only)
router.post('/register',
    authenticate, // Verify JWT token
    authorizeRole('admin'), // Only admin can register instructors
    upload.single('idPhoto'), // Handle photo upload
    instructorValidationRules(), // Validate input fields
    validate, // Handle validation errors
    photoValidation, // Validate photo
    registerInstructor
);

// GET - Get all instructors (Protected)
router.get('/',
    authenticate,
    authorizeRole('admin', 'instructor'),
    getAllInstructors
);

// GET - Get instructor by ID (Protected)
router.get('/:id',
    authenticate,
    authorizeRole('admin', 'instructor'),
    getInstructorById
);

export default router;