import CourseModel from '../models/CourseModel.js';

const registerCourse = async (req, res) => {
    try {
        const {
            courseId,
            description,
            courseType,
            units,
            term,
            faculty,
            program
        } = req.body;

        // Create new course
        const newCourse = new CourseModel({
            courseId,
            description,
            courseType,
            units,
            term,
            faculty,
            program
        });

        const savedCourse = await newCourse.save();

        res.status(201).json({
            success: true,
            message: "Course registered successfully",
            data: savedCourse
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error registering course",
            error: error.message
        });
    }
};

const getAllCourses = async (req, res) => {
    try {
        const courses = await CourseModel.find();
        res.status(200).json({
            success: true,
            count: courses.length,
            data: courses
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error fetching courses",
            error: error.message
        });
    }
};

const getCourseById = async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`Getting course details for ID: ${id}`);
        
        const course = await CourseModel.findById(id);
        
        if (!course) {
            console.log(`Course not found with ID: ${id}`);
            return res.status(404).json({
                success: false,
                message: "Course not found"
            });
        }
        
        console.log(`Found course: ${course.courseId} - ${course.description}`);
        
        res.status(200).json({
            success: true,
            data: course
        });
    } catch (error) {
        console.error(`Error getting course by ID: ${error.message}`);
        res.status(500).json({
            success: false,
            message: "Error retrieving course",
            error: error.message
        });
    }
};

const updateCourse = async (req, res) => {
    try {
        const {
            description,
            courseType,
            units,
            term,
            faculty,
            program
        } = req.body;

        // Check if course exists
        const course = await CourseModel.findById(req.params.id);
        if (!course) {
            return res.status(404).json({
                success: false,
                message: "Course not found"
            });
        }

        // Update course (courseId cannot be updated)
        const updatedCourse = await CourseModel.findByIdAndUpdate(
            req.params.id,
            {
                description,
                courseType,
                units,
                term,
                faculty,
                program
            },
            {
                new: true,
                runValidators: true
            }
        );

        res.status(200).json({
            success: true,
            message: "Course updated successfully",
            data: updatedCourse
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error updating course",
            error: error.message
        });
    }
};

const deleteCourse = async (req, res) => {
    try {
        const course = await CourseModel.findById(req.params.id);
        
        if (!course) {
            return res.status(404).json({
                success: false,
                message: "Course not found"
            });
        }

        await CourseModel.findByIdAndDelete(req.params.id);

        res.status(200).json({
            success: true,
            message: "Course deleted successfully"
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error deleting course",
            error: error.message
        });
    }
};

export {
    registerCourse,
    getAllCourses,
    getCourseById,
    updateCourse,
    deleteCourse
};