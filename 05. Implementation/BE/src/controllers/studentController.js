import StudentModel from '../models/StudentModel.js';
import { generateOTP, sendOTP } from '../utils/emailUtil.js';
import EnrollmentModel from '../models/EnrollmentModel.js';

const registerStudent = async (req, res) => {
    try {
        console.log('Received registration request:', {
            body: req.body,
            file: req.file ? 'File present' : 'No file'
        });

        const {
            firstName,
            lastName,
            middleName,
            suffix,
            yearLevel,
            program,
            faculty,
            studentId,
            gmail
        } = req.body;

        // Validate required fields
        if (!firstName || !lastName || !studentId || !program || !faculty || !gmail) {
            return res.status(400).json({
                success: false,
                message: 'All required fields must be provided'
            });
        }

        // Validate student ID format
        if (!/^[0-9]{4}-[0-9]{4}$/.test(studentId)) {
            return res.status(400).json({
                success: false,
                message: 'Student ID must follow the format: 0000-0000'
            });
        }

        // Validate Gmail format
        if (!/^[a-zA-Z0-9._%+-]+@gmail\.com$/.test(gmail)) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a valid Gmail address'
            });
        }

        // Check if student already exists
        const existingStudent = await StudentModel.findOne({
            $or: [
                { studentId: studentId },
                { gmail: gmail.toLowerCase() }
            ]
        });

        if (existingStudent) {
            return res.status(400).json({
                success: false,
                message: 'Student with this ID or Gmail already exists'
            });
        }

        // Handle photo upload
        let photoData = null;
        if (req.file) {
            photoData = {
                url: req.file.path.replace(/\\/g, '/'),
                publicId: req.file.filename,
                metadata: {
                    fileName: req.file.originalname,
                    fileType: req.file.mimetype,
                    fileSize: req.file.size
                }
            };
        }

        // Generate OTP
        const otp = generateOTP();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

        // Create new student
        const newStudent = new StudentModel({
            firstName,
            lastName,
            middleName: middleName || '',
            suffix: suffix || '',
            yearLevel,
            program,
            faculty,
            studentId,
            gmail: gmail.toLowerCase(),
            idPhoto: photoData,
            role: "2", // Student role
            lastLogin: null,
            otp: {
                code: otp,
                expiresAt: otpExpiry
            },
            isEmailVerified: false
        });

        const savedStudent = await newStudent.save();

        // Send OTP email
        const credentials = {
            userType: 'student',
            fullName: `${firstName} ${middleName ? middleName + ' ' : ''}${lastName}${suffix ? ' ' + suffix : ''}`,
            program,
            faculty,
            yearLevel
        };

        const emailSent = await sendOTP(gmail, otp, credentials);

        if (!emailSent) {
            // If email fails, delete the student and return error
            await StudentModel.findByIdAndDelete(savedStudent._id);
            return res.status(500).json({
                success: false,
                message: "Failed to send verification email"
            });
        }

        res.status(201).json({
            success: true,
            message: "Student registered successfully. Please check your email for verification.",
            data: {
                _id: savedStudent._id,
                gmail: savedStudent.gmail,
                isEmailVerified: false
            }
        });

    } catch (error) {
        console.error('Error registering student:', error);
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
            studentId,
            program,
            faculty,
            gmail,
            existingPhoto
        } = req.body;

        console.log('Received update request:', {
            firstName,
            lastName,
            middleName,
            suffix,
            studentId,
            program,
            faculty,
            gmail,
            file: req.file ? {
                path: req.file.path,
                filename: req.file.filename,
                mimetype: req.file.mimetype,
                size: req.file.size
            } : 'No file',
            existingPhoto: existingPhoto ? 'Existing photo data present' : 'No existing photo data'
        });

        // Find student first
        const student = await StudentModel.findById(req.params.id);
        if (!student) {
            return res.status(404).json({
                success: false,
                message: "Student not found"
            });
        }

        console.log('Current student photo:', student.idPhoto);

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

        // Prepare update data
        const updateData = {
            firstName,
            lastName,
            middleName,
            suffix,
            studentId,
            program,
            faculty,
            gmail: gmail.toLowerCase() // Ensure lowercase
        };

        // Handle photo update
        if (req.file) {
            // New photo uploaded
            const photoPath = req.file.path.replace(/\\/g, '/');
            updateData.idPhoto = {
                url: photoPath,
                publicId: req.file.filename,
                metadata: {
                    fileName: req.file.originalname,
                    fileType: req.file.mimetype,
                    fileSize: req.file.size
                }
            };
            console.log('New photo uploaded:', updateData.idPhoto);
        } else if (existingPhoto) {
            // Keep existing photo
            try {
                const parsedPhoto = JSON.parse(existingPhoto);
                // Ensure the URL is properly formatted
                const photoPath = parsedPhoto.url.replace(/\\/g, '/');
                updateData.idPhoto = {
                    ...parsedPhoto,
                    url: photoPath
                };
                console.log('Keeping existing photo:', updateData.idPhoto);
            } catch (error) {
                console.error('Error parsing existing photo data:', error);
                // If parsing fails, keep the current photo from the database
                updateData.idPhoto = student.idPhoto;
                console.log('Using current photo from database:', updateData.idPhoto);
            }
        } else {
            // No photo data provided, keep the current photo
            updateData.idPhoto = student.idPhoto;
            console.log('No photo data provided, keeping current photo:', updateData.idPhoto);
        }

        console.log('Updating student with data:', updateData);

        // Update student
        const updatedStudent = await StudentModel.findByIdAndUpdate(
            req.params.id,
            updateData,
            {
                new: true,
                runValidators: true
            }
        );

        console.log('Updated student:', updatedStudent);

        res.status(200).json({
            success: true,
            message: "Student updated successfully",
            data: updatedStudent
        });

    } catch (error) {
        console.error('Error updating student:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({
            success: false,
            message: "Error updating student",
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
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

// Get student's enrolled courses
const getStudentCourses = async (req, res) => {
  try {
    const studentId = req.userData._id;

    // Find all enrollments for the student
    const enrollments = await EnrollmentModel.find({ student: studentId })
      .populate({
        path: 'section',
        populate: {
          path: 'course',
          select: 'courseCode courseName'
        }
      })
      .lean();

    // Format the response
    const courses = enrollments.map(enrollment => ({
      _id: enrollment.section.course._id,
      courseCode: enrollment.section.course.courseCode,
      courseName: enrollment.section.course.courseName,
      section: {
        _id: enrollment.section._id,
        sectionCode: enrollment.section.sectionCode,
        schedule: enrollment.section.schedule
      }
    }));

    res.status(200).json({
      success: true,
      data: courses
    });
  } catch (error) {
    console.error('Error fetching student courses:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch courses'
    });
  }
};

export {
    registerStudent,
    getAllStudents,
    getStudentById,
    updateStudent,
    deleteStudent,
    getStudentCourses
};