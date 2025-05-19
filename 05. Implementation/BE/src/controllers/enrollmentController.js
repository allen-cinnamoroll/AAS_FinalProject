import EnrollmentModel from '../models/EnrollmentModel.js';
import AssignedCourseModel from '../models/AssignedCourseModel.js';
import mongoose from 'mongoose';

const enrollStudent = async (req, res) => {
    try {
        const { studentId, assignedCourseId } = req.body;

        // Check if student exists first
        const student = await mongoose.model('Student').findById(studentId);
        if (!student) {
            return res.status(404).json({
                success: false,
                message: "Student not found"
            });
        }

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

        // Use populate with lean for better performance and to ensure we get all fields
        const populatedEnrollment = await EnrollmentModel
            .findById(enrollment._id)
            .populate({
                path: 'student',
                select: 'firstName lastName middleName suffix fullName studentId gmail'
            })
            .populate({
                path: 'assignedCourse',
                populate: [
                    { path: 'course' },
                    { path: 'instructor' }
                ]
            })
            .lean();

        // Extra validation to ensure we have student data
        if (!populatedEnrollment.student) {
            console.error('Student data missing after population', {
                enrollmentId: enrollment._id,
                studentId,
                populatedStudentData: populatedEnrollment.student
            });
            
            // Try to fetch student data separately if population failed
            const studentData = await mongoose.model('Student').findById(studentId).lean();
            if (studentData) {
                populatedEnrollment.student = studentData;
            }
        }

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
        const studentId = req.user.userId || req.user._id;
        console.log('Fetching enrollments for student ID:', studentId);
        
        // Verify student exists
        const student = await mongoose.model('Student').findById(studentId);
        if (!student) {
            return res.status(404).json({
                success: false,
                message: "Student not found"
            });
        }
        
        const enrollments = await EnrollmentModel.find({ student: studentId })
            .populate({
                path: 'student',
                select: 'firstName lastName middleName suffix fullName studentId gmail'
            })
            .populate({
                path: 'assignedCourse',
                populate: [
                    { 
                        path: 'course',
                        select: 'courseId courseCode description courseName'
                    },
                    { 
                        path: 'instructor',
                        select: 'firstName lastName middleName suffix fullName'
                    }
                ]
            })
            .lean();

        console.log(`Found ${enrollments.length} enrollments for student`);
        
        // Process enrollments to ensure each has valid course data
        const processedEnrollments = enrollments.map(enrollment => {
            // Ensure assignedCourse has course data
            if (enrollment.assignedCourse && !enrollment.assignedCourse.course) {
                console.warn(`Enrollment ${enrollment._id} has missing course data`);
                enrollment.assignedCourse.course = {
                    _id: 'unknown',
                    courseId: 'UNKNOWN',
                    courseCode: 'N/A',
                    courseName: 'Unknown Course',
                    description: 'Course data not available'
                };
            }
            
            // Ensure assignedCourse has instructor data
            if (enrollment.assignedCourse && !enrollment.assignedCourse.instructor) {
                console.warn(`Enrollment ${enrollment._id} has missing instructor data`);
                enrollment.assignedCourse.instructor = {
                    _id: 'unknown',
                    firstName: 'Unknown',
                    lastName: 'Instructor',
                    fullName: 'Unknown Instructor'
                };
            }
            
            return enrollment;
        });

        res.status(200).json({
            success: true,
            count: processedEnrollments.length,
            data: processedEnrollments
        });
    } catch (error) {
        console.error('Error fetching student enrollments:', error);
        res.status(500).json({
            success: false,
            message: "Error fetching student enrollments",
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
            .populate({
                path: 'student',
                select: 'firstName lastName middleName suffix fullName studentId gmail'
            })
            .populate({
                path: 'assignedCourse',
                populate: [
                    { path: 'course' },
                    { path: 'instructor' }
                ]
            })
            .lean();

        // Handle potentially missing student data
        const validatedEnrollments = enrollments.map(enrollment => {
            if (!enrollment.student) {
                console.warn(`Enrollment ${enrollment._id} has missing student data`);
                enrollment.student = {
                    _id: enrollment.student || 'unknown',
                    firstName: '[Deleted]',
                    lastName: 'Student',
                    fullName: '[Deleted Student]',
                    studentId: 'N/A'
                };
            }
            return enrollment;
        });

        res.status(200).json({
            success: true,
            count: validatedEnrollments.length,
            data: validatedEnrollments
        });
    } catch (error) {
        console.error('Error fetching all enrollments:', error);
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
        .populate({
            path: 'student',
            select: 'firstName lastName middleName suffix fullName studentId gmail'
        })
        .populate({
            path: 'assignedCourse',
            populate: [
                { path: 'course' },
                { path: 'instructor' }
            ]
        })
        .lean();
        
        // Validate each enrollment has a valid student
        const validatedEnrollments = enrollments.map(async (enrollment) => {
            if (!enrollment.student) {
                console.warn(`Enrollment ${enrollment._id} has missing student data (student ID: ${enrollment.student})`);
                // Try to fetch student data separately
                try {
                    const studentData = await mongoose.model('Student').findById(enrollment.student).lean();
                    if (studentData) {
                        enrollment.student = studentData;
                    } else {
                        // If student no longer exists, mark with placeholder data
                        enrollment.student = {
                            _id: enrollment.student || 'unknown',
                            firstName: '[Deleted]',
                            lastName: 'Student',
                            fullName: '[Deleted Student]',
                            studentId: 'N/A'
                        };
                    }
                } catch (err) {
                    console.error(`Error fetching student data for enrollment ${enrollment._id}:`, err);
                }
            }
            return enrollment;
        });
        
        // Wait for all validations to complete
        const processedEnrollments = await Promise.all(validatedEnrollments);
        
        res.status(200).json({
            success: true,
            count: processedEnrollments.length,
            data: processedEnrollments
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