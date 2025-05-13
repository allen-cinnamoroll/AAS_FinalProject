import Instructor from '../models/Instructor.js';
import { generateOTP, sendOTP } from '../utils/emailUtil.js';
import CourseModel from '../models/CourseModel.js';
import SectionModel from '../models/SectionModel.js';
import AssignedCourseModel from '../models/AssignedCourseModel.js';
import EnrollmentModel from '../models/EnrollmentModel.js';

const registerInstructor = async (req, res) => {
    try {
        console.log('Received registration request:', {
            body: req.body,
            file: req.file ? {
                path: req.file.path,
                filename: req.file.filename,
                mimetype: req.file.mimetype,
                size: req.file.size
            } : 'No file'
        });

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

        // Create photo data object with proper path handling
        const photoData = {
            url: req.file.path.replace(/\\/g, '/'), // Convert Windows path to URL format
            publicId: req.file.filename,
            metadata: {
                fileName: req.file.originalname,
                fileType: req.file.mimetype,
                fileSize: req.file.size
            }
        };

        // Generate OTP
        const otp = generateOTP();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

        // Create new instructor with role=1 and initial lastLogin=null
        const newInstructor = new Instructor({
            firstName,
            lastName,
            middleName: middleName || '',
            suffix: suffix || '',
            instructorId,
            program,
            faculty,
            gmail: gmail.toLowerCase(), // Ensure lowercase
            idPhoto: photoData,
            role: "1", // Instructor role
            lastLogin: null,
            isEmailVerified: false // Set to false by default
        });

        const savedInstructor = await newInstructor.save();

        // Send OTP email
        const credentials = {
            userType: 'instructor',
            fullName: `${firstName} ${middleName ? middleName + ' ' : ''}${lastName}${suffix ? ' ' + suffix : ''}`,
            program,
            faculty
        };

        const emailSent = await sendOTP(gmail, otp, credentials);

        if (!emailSent) {
            // If email fails, delete the instructor and return error
            await Instructor.findByIdAndDelete(savedInstructor._id);
            return res.status(500).json({
                success: false,
                message: "Failed to send verification email"
            });
        }

        res.status(201).json({
            success: true,
            message: "Instructor registered successfully",
            data: {
                _id: savedInstructor._id,
                gmail: savedInstructor.gmail,
                isEmailVerified: false
            }
        });

    } catch (error) {
        console.error('Error registering instructor:', error);
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

const updateInstructor = async (req, res) => {
    try {
        const {
            firstName,
            lastName,
            middleName,
            suffix,
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

        // Find instructor first
        const instructor = await Instructor.findById(req.params.id);
        if (!instructor) {
            return res.status(404).json({
                success: false,
                message: "Instructor not found"
            });
        }

        console.log('Current instructor photo:', instructor.idPhoto);

        // Check if new gmail is already taken by another instructor
        if (gmail && gmail !== instructor.gmail) {
            const gmailExists = await Instructor.findOne({ gmail });
            if (gmailExists) {
                return res.status(400).json({
                    success: false,
                    message: "Gmail already registered to another instructor"
                });
            }
        }

        // Prepare update data
        const updateData = {
            firstName,
            lastName,
            middleName,
            suffix,
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
                    url: photoPath,
                    publicId: parsedPhoto.publicId,
                    metadata: parsedPhoto.metadata
                };
                console.log('Keeping existing photo:', updateData.idPhoto);
            } catch (error) {
                console.error('Error parsing existing photo data:', error);
                // If parsing fails, keep the current photo from the database
                updateData.idPhoto = instructor.idPhoto;
                console.log('Using current photo from database:', updateData.idPhoto);
            }
        } else {
            // No photo data provided, keep the current photo
            updateData.idPhoto = instructor.idPhoto;
            console.log('No photo data provided, keeping current photo:', updateData.idPhoto);
        }

        console.log('Updating instructor with data:', updateData);

        // Update instructor
        const updatedInstructor = await Instructor.findByIdAndUpdate(
            req.params.id,
            updateData,
            {
                new: true,
                runValidators: true
            }
        );

        console.log('Updated instructor:', updatedInstructor);

        res.status(200).json({
            success: true,
            message: "Instructor updated successfully",
            data: updatedInstructor
        });

    } catch (error) {
        console.error('Error updating instructor:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({
            success: false,
            message: "Error updating instructor",
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

const deleteInstructor = async (req, res) => {
    try {
        const instructor = await Instructor.findById(req.params.id);
        
        if (!instructor) {
            return res.status(404).json({
                success: false,
                message: "Instructor not found"
            });
        }

        await Instructor.findByIdAndDelete(req.params.id);

        res.status(200).json({
            success: true,
            message: "Instructor deleted successfully"
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error deleting instructor",
            error: error.message
        });
    }
};

// Get instructor's courses with their sections
const getInstructorCourses = async (req, res) => {
  try {
    const instructorId = req.user.userId;
    console.log('Fetching courses for instructor:', instructorId);

    // Find all assigned courses for the instructor
    const assignedCourses = await AssignedCourseModel.find({ instructor: instructorId })
      .populate({
        path: 'course',
        select: 'courseId courseCode description courseType units term faculty program'
      })
      .lean();

    console.log('Found assigned courses:', assignedCourses);

    // Group assignments by course
    const courseMap = {};
    
    assignedCourses.forEach(assignment => {
      const courseId = assignment.course._id.toString();
      
      if (!courseMap[courseId]) {
        courseMap[courseId] = {
      _id: assignment.course._id,
      courseId: assignment.course.courseId,
      courseName: assignment.course.description,
      courseType: assignment.course.courseType,
      units: assignment.course.units,
      term: assignment.course.term,
      faculty: assignment.course.faculty,
      program: assignment.course.program,
          sections: []
        };
      }
      
      courseMap[courseId].sections.push({
        _id: assignment._id,
        sectionCode: assignment.section,
        schedule: assignment.schedule,
        students: [] // We'll populate this if needed
      });
    });
    
    // Fetch enrollment counts for each section
    const sectionIds = assignedCourses.map(assignment => assignment._id);
    const enrollmentCounts = await EnrollmentModel.aggregate([
      {
        $match: { assignedCourse: { $in: sectionIds } }
      },
      {
        $group: {
          _id: "$assignedCourse",
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Create a map of section ID to student count
    const countMap = {};
    enrollmentCounts.forEach(item => {
      countMap[item._id.toString()] = item.count;
    });
    
    // Add the student counts to each section
    Object.values(courseMap).forEach(course => {
      course.sections.forEach(section => {
        section.enrolledStudents = countMap[section._id.toString()] || 0;
      });
    });
    
    // Convert the map to an array and sort sections alphabetically within each course
    const coursesWithSections = Object.values(courseMap).map(course => {
      // Sort sections alphabetically by sectionCode
      course.sections.sort((a, b) => a.sectionCode.localeCompare(b.sectionCode));
      return course;
    });

    console.log('Transformed courses with grouped sections and student counts:', coursesWithSections);

    res.status(200).json({
      success: true,
      courses: coursesWithSections
    });
  } catch (error) {
    console.error('Error fetching instructor courses:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch courses',
      error: error.message
    });
  }
};

export {
    registerInstructor,
    getAllInstructors,
    getInstructorById,
    updateInstructor,
    deleteInstructor,
    getInstructorCourses
};