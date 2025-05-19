import express from 'express';
import { 
    recordAttendance,
    getAttendanceBySection,
    getStudentAttendance,
    markAbsent,
    updateAttendanceStatus,
    deleteAttendance
} from '../controllers/attendanceController.js';
import { authenticate, authorizeRole } from '../middleware/authMiddleware.js';

const router = express.Router();

// Record attendance (instructor only)
router.post('/record',
    authenticate,
    authorizeRole('instructor'),
    recordAttendance
);

// Mark student as absent (instructor only)
router.post('/absent',
    authenticate,
    authorizeRole('instructor'),
    markAbsent
);

// Update student attendance status (instructor only)
router.post('/status',
    authenticate,
    authorizeRole('instructor'),
    updateAttendanceStatus
);

// Get attendance by section (instructor only)
router.get('/section/:sectionId',
    authenticate,
    authorizeRole('instructor', 'admin'),
    getAttendanceBySection
);

// Get student's own attendance (student only)
router.get('/my-attendance',
    authenticate,
    authorizeRole('student'),
    getStudentAttendance
);

// Delete student's own attendance record (student only)
router.delete('/delete/:attendanceId',
    authenticate,
    authorizeRole('student'),
    deleteAttendance
);

export default router; 