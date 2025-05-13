import EnrollmentModel from '../models/EnrollmentModel.js';
import AssignedCourseModel from '../models/AssignedCourseModel.js';

const enrollStudent = async (req, res) => {
    try {
        const { studentId, assignedCourseId } = req.body;

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

        // Check if student is already enrolled in this course
        const existingEnrollment = await EnrollmentModel.findOne({
            student: studentId,
            assignedCourse: assignedCourseId
        });

        if (existingEnrollment) {
            return res.status(400).json({
                success: false,
                message: "Student is already enrolled in this course"
            });
        }

        // Create enrollment
        const enrollment = new EnrollmentModel({
            student: studentId,
            assignedCourse: assignedCourseId
        });

        await enrollment.save();

        const populatedEnrollment = await EnrollmentModel
            .findById(enrollment._id)
            .populate('student')
            .populate({
                path: 'assignedCourse',
                populate: [
                    { path: 'course' },
                    { path: 'instructor' }
                ]
            });

        res.status(201).json({
            success: true,
            message: "Successfully enrolled student in course",
            data: populatedEnrollment
        });

    } catch (error) {
        console.error('Enrollment error:', error);
        res.status(500).json({
            success: false,
            message: "Error enrolling student",
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

const deleteEnrollment = async (req, res) => {
    try {
        const enrollment = await EnrollmentModel.findById(req.params.id);
        
        if (!enrollment) {
            return res.status(404).json({
                success: false,
                message: "Enrollment not found"
            });
        }

        await EnrollmentModel.findByIdAndDelete(req.params.id);

        res.status(200).json({
            success: true,
            message: "Enrollment deleted successfully"
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error deleting enrollment",
            error: error.message
        });
    }
};

// Get all enrollments for a specific section
const getEnrollmentsBySection = async (req, res) => {
    try {
        const sectionId = req.params.sectionId;
        
        // Validate that the section (assigned course) exists
        const sectionExists = await AssignedCourseModel.findById(sectionId);
        if (!sectionExists) {
            return res.status(404).json({
                success: false,
                message: "Section not found"
            });
        }
        
        // Find all enrollments for this section
        const enrollments = await EnrollmentModel.find({ 
            assignedCourse: sectionId 
        })
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
        console.error('Error fetching section enrollments:', error);
        res.status(500).json({
            success: false,
            message: "Error fetching enrollments for this section",
            error: error.message
        });
    }
};

export {
    enrollStudent,
    getStudentEnrollments,
    getInstructorEnrollments,
    getAllEnrollments,
    deleteEnrollment,
    getEnrollmentsBySection
};