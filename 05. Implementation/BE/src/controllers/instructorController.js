import Instructor from '../models/Instructor.js';

const registerInstructor = async (req, res) => {
    try {
        const {
            firstName,
            lastName,
            middleName,
            suffix,
            instructorId,
            program,
            faculty,
            gmail
        } = req.body;

        // Check if instructor already exists
        const instructorExists = await Instructor.findOne({
            $or: [
                { instructorId },
                { gmail }
            ]
        });

        if (instructorExists) {
            return res.status(400).json({
                success: false,
                message: instructorExists.instructorId === instructorId 
                    ? "Instructor ID already exists"
                    : "Gmail already registered"
            });
        }

        // Handle photo upload
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "ID photo is required"
            });
        }

        const photoData = {
            url: req.file.path,
            publicId: req.file.filename,
            metadata: {
                fileName: req.file.originalname,
                fileType: req.file.mimetype,
                fileSize: req.file.size
            }
        };

        // Create new instructor with role=1 and initial lastLogin=null
        const newInstructor = new Instructor({
            firstName,
            lastName,
            middleName,
            suffix,
            instructorId,
            program,
            faculty,
            gmail,
            idPhoto: photoData,
            role: "1", // Instructor role
            lastLogin: null
        });

        const savedInstructor = await newInstructor.save();

        res.status(201).json({
            success: true,
            message: "Instructor registered successfully",
            data: savedInstructor
        });

    } catch (error) {
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