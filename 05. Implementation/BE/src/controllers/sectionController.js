import EnrollmentModel from '../models/EnrollmentModel.js';
import AssignedCourseModel from '../models/AssignedCourseModel.js';
import SectionModel from '../models/SectionModel.js';

// Helper function to format photo URLs and ensure fullName is present
const formatPhotoUrl = (student) => {
  if (!student) return student;
  
  // Create a copy to avoid modifying the original document
  const formattedStudent = JSON.parse(JSON.stringify(student));
  
  // Ensure student has a fullName property
  if (!formattedStudent.fullName && formattedStudent.firstName) {
    const middleInitial = formattedStudent.middleName ? `${formattedStudent.middleName.charAt(0)}. ` : '';
    const suffixStr = formattedStudent.suffix ? ` ${formattedStudent.suffix}` : '';
    formattedStudent.fullName = `${formattedStudent.firstName} ${middleInitial}${formattedStudent.lastName}${suffixStr}`.trim();
  }
  
  if (formattedStudent.idPhoto && formattedStudent.idPhoto.url) {
    // Make sure URL doesn't have duplicate slashes
    let url = formattedStudent.idPhoto.url;
    
    // If the URL is a relative path and doesn't start with /uploads, add it
    if (!url.startsWith('http') && !url.startsWith('/uploads')) {
      url = '/uploads/' + url;
    }
    
    // Fix any potential issues with uploads path
    url = url.replace('uploads/uploads', 'uploads');
    
    // Update the URL
    formattedStudent.idPhoto.url = url;
  }
  
  return formattedStudent;
};

// Get students enrolled in a specific section/assigned course
const getStudentsInSection = async (req, res) => {
  try {
    const sectionId = req.params.sectionId;
    
    // Check if we're using AssignedCourse as sections
    const assignedCourse = await AssignedCourseModel.findById(sectionId);
    
    if (assignedCourse) {
      // Find enrollments for this assigned course
      const enrollments = await EnrollmentModel.find({ assignedCourse: sectionId })
        .populate('student')
        .lean();
      
      // Format each student's photo URL and add attendance data
      const students = enrollments.map(enrollment => {
        // Add the enrollment data to the student object
        const student = formatPhotoUrl(enrollment.student);
        if (student) {
          student.enrollment = {
            _id: enrollment._id,
            attendance: enrollment.attendance || { percentage: 0 }
          };
        }
        return student;
      });
      
      return res.status(200).json({
        success: true,
        count: students.length,
        students
      });
    }
    
    // If not found in AssignedCourse, try the SectionModel
    const section = await SectionModel.findById(sectionId)
      .populate('students')
      .lean();
    
    if (!section) {
      return res.status(404).json({
        success: false,
        message: "Section not found"
      });
    }
    
    // We need to get enrollments for these students to include attendance data
    const studentIds = section.students.map(student => student._id);
    
    // Find all enrollments for these students
    const enrollments = await EnrollmentModel.find({
      student: { $in: studentIds },
      $or: [
        { section: sectionId },
        { assignedCourse: sectionId }
      ]
    }).lean();
    
    // Create a map for quick lookup
    const enrollmentMap = {};
    enrollments.forEach(enrollment => {
      enrollmentMap[enrollment.student.toString()] = enrollment;
    });
    
    // Format each student's photo URL and add attendance data
    const formattedStudents = section.students.map(student => {
      const formattedStudent = formatPhotoUrl(student);
      const enrollment = enrollmentMap[student._id.toString()];
      
      if (enrollment) {
        formattedStudent.enrollment = {
          _id: enrollment._id,
          attendance: enrollment.attendance || { percentage: 0 }
        };
      } else {
        formattedStudent.attendance = 0; // Default value if no enrollment found
      }
      
      return formattedStudent;
    });
    
    return res.status(200).json({
      success: true,
      count: formattedStudents.length,
      students: formattedStudents
    });
    
  } catch (error) {
    console.error('Error fetching section students:', error);
    res.status(500).json({
      success: false,
      message: "Error fetching students for this section",
      error: error.message
    });
  }
};

export { getStudentsInSection }; 