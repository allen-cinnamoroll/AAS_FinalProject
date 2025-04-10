import Instructor from '../models/Instructor.js';

const registerInstructor = async (req, res) => {
    try {
        const {
            firstName,
            lastName,
            middleName,
            suffix,
            program,
            faculty,
        } = req.body;

        // Check if required fields are present
        if (!firstName || !lastName || !program || !faculty) {
            return res.status(400).json({
                success: false,
                message: "Please provide all required fields"
            });
        }

        // Handle photo upload - assuming photo data is in req.file from middleware
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "ID photo is required"
            });
        }

        const photoData = {
            url: req.file.path, // This will be updated with cloud storage URL
            publicId: req.file.filename, // This will be updated with cloud storage ID
            metadata: {
                fileName: req.file.originalname,
                fileType: req.file.mimetype,
                fileSize: req.file.size
            }
        };

        const newInstructor = new Instructor({
            firstName,
            lastName,
            middleName,
            suffix,
            program,
            faculty,
            idPhoto: photoData
        });

        const savedInstructor = await newInstructor.save();

        res.status(201).json({
            success: true,
            message: "Instructor registered successfully",
            data: savedInstructor
        });

    } catch (error) {
        if (error.code === 11000) { // Duplicate key error
            return res.status(400).json({
                success: false,
                message: "Instructor ID already exists"
            });
        }

        res.status(500).json({
            success: false,
            message: "Error registering instructor",
            error: error.message
        });
    }
};

const getAllInstructors = async (req, res) => {
    try {
        const instructors = await Instructor.find();
        res.status(200).json({
            success: true,
            count: instructors.length,
            data: instructors
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error fetching instructors",
            error: error.message
        });
    }
};

const getInstructorById = async (req, res) => {
    try {
        const instructor = await Instructor.findById(req.params.id);
        if (!instructor) {
            return res.status(404).json({
                success: false,
                message: "Instructor not found"
            });
        }

        res.status(200).json({
            success: true,
            data: instructor
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error fetching instructor",
            error: error.message
        });
    }
};

export {
    registerInstructor,
    getAllInstructors,
    getInstructorById
};