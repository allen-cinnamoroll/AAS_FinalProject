import multer from "multer";
import path from "path";
import { body, validationResult } from "express-validator";

// Configure storage for instructor photos
const instructorStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/instructor-photos");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "instructor-" + uniqueSuffix + path.extname(file.originalname));
  },
});

// Configure storage for student photos
const studentStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/student-photos");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "student-" + uniqueSuffix + path.extname(file.originalname));
  },
});

// File filter to accept only images
const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error("Invalid file type. Only JPEG, PNG and JPG are allowed."),
      false
    );
  }
};

// Create separate upload instances
const uploadInstructor = multer({
  storage: instructorStorage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

const uploadStudent = multer({
  storage: studentStorage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// Validation middleware
export const registrationValidationRules = () => {
  return [
    body("username")
      .trim()
      .notEmpty()
      .withMessage("Username is required"),
    body("gmail")
      .trim()
      .notEmpty()
      .withMessage("Gmail address is required")
      .isEmail()
      .withMessage("Valid email is required")
      .matches(/^[a-zA-Z0-9._%+-]+@gmail\.com$/)
      .withMessage("Please provide a valid Gmail address"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters long")
  ];
};

export const instructorValidationRules = () => {
  return [
    body("firstName").trim().notEmpty().withMessage("First name is required"),
    body("lastName").trim().notEmpty().withMessage("Last name is required"),
    body("middleName").optional().trim(),
    body("suffix")
      .optional()
      .isIn(["Jr.", "Sr.", "I", "II", "III", "IV", "V", ""])
      .withMessage("Invalid suffix"),
    body("instructorId")
      .trim()
      .notEmpty()
      .withMessage("Instructor ID is required")
      .matches(/^[0-9]{6}-[A-Z]{2}-[0-9]{2}$/)
      .withMessage("Instructor ID must follow the format: 000000-AA-00"),
    body("program").trim().notEmpty().withMessage("Program is required"),
    body("faculty").trim().notEmpty().withMessage("Faculty is required"),
    body("gmail")
      .trim()
      .notEmpty()
      .withMessage("Gmail address is required")
      .isEmail()
      .withMessage("Valid email is required")
      .matches(/^[a-zA-Z0-9._%+-]+@gmail\.com$/)
      .withMessage("Please provide a valid Gmail address"),
  ];
};

export const studentValidationRules = () => {
  return [
    body("firstName").trim().notEmpty().withMessage("First name is required"),
    body("lastName").trim().notEmpty().withMessage("Last name is required"),
    body("middleName").optional().trim(),
    body("suffix")
      .optional()
      .isIn(["Jr.", "Sr.", "I", "II", "III", "IV", "V", ""])
      .withMessage("Invalid suffix"),
    body("studentId")
      .trim()
      .notEmpty()
      .withMessage("Student ID is required")
      .matches(/^[0-9]{4}-[0-9]{4}$/)
      .withMessage("Student ID must follow the format: 0000-0000"),
    body("yearLevel")
      .trim()
      .notEmpty()
      .withMessage("Year level is required")
      .isIn(["1", "2", "3", "4", "5"])
      .withMessage("Invalid year level"),
    body("program").trim().notEmpty().withMessage("Program is required"),
    body("faculty").trim().notEmpty().withMessage("Faculty is required"),
    body("gmail")
      .trim()
      .notEmpty()
      .withMessage("Gmail address is required")
      .isEmail()
      .withMessage("Valid email is required")
      .matches(/^[a-zA-Z0-9._%+-]+@gmail\.com$/)
      .withMessage("Please provide a valid Gmail address"),
  ];
};

export const courseValidationRules = () => {
  return [
    body("courseId").trim().notEmpty().withMessage("Course ID is required"),
    body("description")
      .trim()
      .notEmpty()
      .withMessage("Course description is required"),
    body("courseType")
      .trim()
      .notEmpty()
      .withMessage("Course type is required")
      .isIn(["Lab", "Lec"])
      .withMessage("Course type must be either Lab or Lec"),
    body("units")
      .isNumeric()
      .withMessage("Units must be a number")
      .isInt({ min: 1, max: 6 })
      .withMessage("Units must be between 1 and 6"),
    body("term")
      .trim()
      .notEmpty()
      .withMessage("Term is required")
      .isIn(["1", "2"])
      .withMessage("Term must be either 1 or 2"),
    body("faculty").trim().notEmpty().withMessage("Faculty is required"),
    body("program").trim().notEmpty().withMessage("Program is required"),
  ];
};

export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Photo validation middleware
export const photoValidation = (req, res, next) => {
  // Skip validation if updating with keepExistingPhoto flag
  if (req.method === 'PUT' && req.body.keepExistingPhoto === 'true') {
    console.log('Skipping photo validation for update with keepExistingPhoto flag');
    return next();
  }

  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: "ID photo is required",
    });
  }

  // Validate file type
  const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
  if (!allowedTypes.includes(req.file.mimetype)) {
    return res.status(400).json({
      success: false,
      message: "Invalid file type. Only JPEG, PNG and JPG are allowed.",
    });
  }

  // Validate file size (5MB limit)
  const maxSize = 5 * 1024 * 1024; // 5MB in bytes
  if (req.file.size > maxSize) {
    return res.status(400).json({
      success: false,
      message: "File size too large. Maximum size is 5MB.",
    });
  }

  next();
};

// Export both as named exports
export { uploadInstructor, uploadStudent };

// Also export as default object
const upload = {
  instructor: uploadInstructor,
  student: uploadStudent,
};

export default upload;
