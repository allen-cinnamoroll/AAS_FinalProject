import StudentModel from '../models/StudentModel.js';

const registerStudent = async (req, res) => {
    try {
        const {
            firstName,
            lastName,
            middleName,
            suffix,
            studentId,  // Changed from schoolId
            yearLevel,
            program,
            faculty,
            gmail
        } = req.body;

        // Check if student already exists
        const studentExists = await StudentModel.findOne({
            $or: [
                { studentId },  // Changed from schoolId
                { gmail }
            ]
        });

        if (studentExists) {
            return res.status(400).json({
                success: false,
                message: studentExists.studentId === studentId 
                    ? "Student ID already exists"
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

        // Create new student
        const newStudent = new StudentModel({
            firstName,
            lastName,
            middleName,
            suffix,
            studentId,
            yearLevel,
            program,
            faculty,
            gmail,
            idPhoto: photoData,
            role: "2", // Student role
            lastLogin: null
        });

        const savedStudent = await newStudent.save();

        res.status(201).json({
            success: true,
            message: "Student registered successfully",
            data: savedStudent
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error registering student",
            error: error.message
        });
    }
};

const getAllStudents = async (req, res) => {
    try {
        const students = await StudentModel.find();
        res.status(200).json({
            success: true,
            count: students.length,
            data: students
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error fetching students",
            error: error.message
        });
    }
};

const getStudentById = async (req, res) => {
    try {
        const student = await StudentModel.findById(req.params.id);
        if (!student) {
            return res.status(404).json({
                success: false,
                message: "Student not found"
            });
        }

        res.status(200).json({
            success: true,
            data: student
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error fetching student",
            error: error.message
        });
    }
};

const updateStudent = async (req, res) => {
    try {
        const {
            firstName,
            lastName,
            middleName,
            suffix,
            yearLevel,
            program,
            faculty,
            gmail
        } = req.body;

        // Find student first
        const student = await StudentModel.findById(req.params.id);
        if (!student) {
            return res.status(404).json({
                success: false,
                message: "Student not found"
            });
        }

        // Check if new gmail is already taken by another student
        if (gmail && gmail !== student.gmail) {
            const gmailExists = await StudentModel.findOne({ gmail });
            if (gmailExists) {
                return res.status(400).json({
                    success: false,
                    message: "Gmail already registered to another student"
                });
            }
        }

        // Handle photo upload if new photo is provided
        let photoData = student.idPhoto;
        if (req.file) {
            photoData = {
                url: req.file.path,
                publicId: req.file.filename,
                metadata: {
                    fileName: req.file.originalname,
                    fileType: req.file.mimetype,
                    fileSize: req.file.size
                }
            };
        }

        // Update student
        const updatedStudent = await StudentModel.findByIdAndUpdate(
            req.params.id,
            {
                firstName,
                lastName,
                middleName,
                suffix,
                yearLevel,
                program,
                faculty,
                gmail,
                idPhoto: photoData
            },
            {
                new: true,
                runValidators: true
            }
        );

        res.status(200).json({
            success: true,
            message: "Student updated successfully",
            data: updatedStudent
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error updating student",
            error: error.message
        });
    }
};

const deleteStudent = async (req, res) => {
    try {
        const student = await StudentModel.findById(req.params.id);
        
        if (!student) {
            return res.status(404).json({
                success: false,
                message: "Student not found"
            });
        }

        await StudentModel.findByIdAndDelete(req.params.id);

        res.status(200).json({
            success: true,
            message: "Student deleted successfully"
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error deleting student",
            error: error.message
        });
    }
};

export {
    registerStudent,
    getAllStudents,
    getStudentById,
    updateStudent,
    deleteStudent
};