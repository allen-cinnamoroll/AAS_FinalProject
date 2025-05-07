import AssignedCourseModel from '../models/AssignedCourseModel.js';
import CourseModel from '../models/CourseModel.js';
import Instructor from '../models/Instructor.js';

const assignCourse = async (req, res) => {
    try {
        const {
            courseId,
            instructorId,
            section,
            schedule,
            academicYear,
            semester
        } = req.body;

        // Verify course exists
        const courseExists = await CourseModel.findById(courseId);
        if (!courseExists) {
            return res.status(404).json({
                success: false,
                message: "Course not found"
            });
        }

        // Verify instructor exists
        const instructorExists = await Instructor.findById(instructorId);
        if (!instructorExists) {
            return res.status(404).json({
                success: false,
                message: "Instructor not found"
            });
        }

        // Create new assigned course using the correct field names
        const newAssignedCourse = new AssignedCourseModel({
            course: courseId,      // map courseId to course
            instructor: instructorId,  // map instructorId to instructor
            section,
            schedule,
            academicYear,
            semester
        });

        const savedAssignment = await newAssignedCourse.save();

        // Populate course and instructor details
        const populatedAssignment = await AssignedCourseModel
            .findById(savedAssignment._id)
            .populate('course')
            .populate('instructor');

        res.status(201).json({
            success: true,
            message: "Course assigned successfully",
            data: populatedAssignment
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error assigning course",
            error: error.message
        });
    }
};

const getAllAssignedCourses = async (req, res) => {
    try {
        const assignedCourses = await AssignedCourseModel
            .find()
            .populate('course')
            .populate('instructor');

        res.status(200).json({
            success: true,
            count: assignedCourses.length,
            data: assignedCourses
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error fetching assigned courses",
            error: error.message
        });
    }
};

const getAssignedCourseById = async (req, res) => {
    try {
        const assignedCourse = await AssignedCourseModel
            .findById(req.params.id)
            .populate('course')
            .populate('instructor');

        if (!assignedCourse) {
            return res.status(404).json({
                success: false,
                message: "Assigned course not found"
            });
        }

        res.status(200).json({
            success: true,
            data: assignedCourse
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error fetching assigned course",
            error: error.message
        });
    }
};

const updateAssignedCourse = async (req, res) => {
    try {
        const {
            section,
            schedule,
            academicYear,
            semester
        } = req.body;

        const assignedCourse = await AssignedCourseModel.findById(req.params.id);
        if (!assignedCourse) {
            return res.status(404).json({
                success: false,
                message: "Assigned course not found"
            });
        }

        // Update assigned course (course and instructor cannot be updated)
        const updatedAssignment = await AssignedCourseModel
            .findByIdAndUpdate(
                req.params.id,
                {
                    section,
                    schedule,
                    academicYear,
                    semester
                },
                {
                    new: true,
                    runValidators: true
                }
            )
            .populate('course')
            .populate('instructor');

        res.status(200).json({
            success: true,
            message: "Assigned course updated successfully",
            data: updatedAssignment
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error updating assigned course",
            error: error.message
        });
    }
};

const deleteAssignedCourse = async (req, res) => {
    try {
        const assignedCourse = await AssignedCourseModel.findById(req.params.id);
        
        if (!assignedCourse) {
            return res.status(404).json({
                success: false,
                message: "Assigned course not found"
            });
        }

        await AssignedCourseModel.findByIdAndDelete(req.params.id);

        res.status(200).json({
            success: true,
            message: "Course assignment deleted successfully"
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error deleting course assignment",
            error: error.message
        });
    }
};

export {
    assignCourse,
    getAllAssignedCourses,
    getAssignedCourseById,
    updateAssignedCourse,
    deleteAssignedCourse
};