import EnrollmentModel from '../models/EnrollmentModel.js';
import AssignedCourseModel from '../models/AssignedCourseModel.js';

const enrollStudent = async (req, res) => {
    try {
        const { assignedCourseId } = req.body;
        const studentId = req.user._id; // From auth middleware

        // Check if course exists and is available
        const assignedCourse = await AssignedCourseModel
            .findById(assignedCourseId)
            .populate('course');

        if (!assignedCourse) {
            return res.status(404).json({
                success: false,
                message: "Course not found"
            });
        }

        // Check if student is already enrolled
        const existingEnrollment = await EnrollmentModel.findOne({
            student: studentId,
            assignedCourse: assignedCourseId,
            academicYear: assignedCourse.academicYear,
            semester: assignedCourse.semester
        });

        if (existingEnrollment) {
            return res.status(400).json({
                success: false,
                message: "Already enrolled in this course"
            });
        }

        // Create enrollment
        const enrollment = new EnrollmentModel({
            student: studentId,
            assignedCourse: assignedCourseId,
            academicYear: assignedCourse.academicYear,
            semester: assignedCourse.semester
        });

        await enrollment.save();

        res.status(201).json({
            success: true,
            message: "Successfully enrolled in course",
            data: enrollment
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error enrolling in course",
            error: error.message
        });
    }
};

// Get all enrollments for a student
const getStudentEnrollments = async (req, res) => {
    try {
        const studentId = req.user._id;
        
        const enrollments = await EnrollmentModel.find({ student: studentId })
            .populate({
                path: 'assignedCourse',
                populate: [
                    { path: 'course' },
                    { path: 'instructor' }
                ]
            });

        res.status(200).json({
            success: true,
            count: enrollments.length,
            data: enrollments
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error fetching enrollments",
            error: error.message
        });
    }
};

// Get enrollments by course for instructor
const getInstructorEnrollments = async (req, res) => {
    try {
        const instructorId = req.user._id;
        
        const enrollments = await EnrollmentModel.find({
            'assignedCourse.instructor': instructorId
        })
        .populate('student')
        .populate({
            path: 'assignedCourse',
            populate: { path: 'course' }
        });

        res.status(200).json({
            success: true,
            count: enrollments.length,
            data: enrollments
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error fetching enrollments",
            error: error.message
        });
    }
};

// Get all enrollments (admin only)
const getAllEnrollments = async (req, res) => {
    try {
        const enrollments = await EnrollmentModel.find()
            .populate('student')
            .populate({
                path: 'assignedCourse',
                populate: [
                    { path: 'course' },
                    { path: 'instructor' }
                ]
            });

        res.status(200).json({
            success: true,
            count: enrollments.length,
            data: enrollments
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error fetching all enrollments",
            error: error.message
        });
    }
};

// Delete enrollment (drop course)
const dropEnrollment = async (req, res) => {
    try {
        const { enrollmentId } = req.params;
        const studentId = req.user._id;

        const enrollment = await EnrollmentModel.findOne({
            _id: enrollmentId,
            student: studentId
        });

        if (!enrollment) {
            return res.status(404).json({
                success: false,
                message: "Enrollment not found"
            });
        }

        await EnrollmentModel.findByIdAndDelete(enrollmentId);

        res.status(200).json({
            success: true,
            message: "Successfully dropped the course"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error dropping course",
            error: error.message
        });
    }
};

export {
    enrollStudent,
    getStudentEnrollments,
    getInstructorEnrollments,
    getAllEnrollments,
    dropEnrollment
};