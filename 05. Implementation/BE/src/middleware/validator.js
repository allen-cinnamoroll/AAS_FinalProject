import { body, validationResult } from "express-validator";

// Instructor registration validation rules
export const instructorValidationRules = () => {
    return [
        body('firstName').trim().notEmpty().withMessage('First name is required'),
        body('lastName').trim().notEmpty().withMessage('Last name is required'),
        body('program').trim().notEmpty().withMessage('Program is required'),
        body('faculty').trim().notEmpty().withMessage('Faculty is required'),
        body('gmail')
            .trim()
            .notEmpty()
            .withMessage('Gmail is required')
            .matches(/^[a-zA-Z0-9._%+-]+@gmail\.com$/)
            .withMessage('Please provide a valid Gmail address'),
        body('suffix')
            .optional()
            .isIn(['Jr.', 'Sr.', 'I', 'II', 'III', 'IV', 'V', ''])
            .withMessage('Invalid suffix value'),
    ];
};

// Photo validation middleware
export const photoValidation = (req, res, next) => {
    // Skip validation if no file is uploaded during update
    if (!req.file) {
        return next();
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(req.file.mimetype)) {
        return res.status(400).json({
            success: false,
            message: "Only JPG, JPEG, and PNG files are allowed"
        });
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (req.file.size > maxSize) {
        return res.status(400).json({
            success: false,
            message: "File size must not exceed 5MB"
        });
    }

    next();
};

export const registrationValidationRules = () => {
    return [
        body('username').trim().notEmpty().withMessage('Username is required'),
        body('email').isEmail().withMessage('Must be a valid email address'),
        body('password')
            .isLength({ min: 6 })
            .withMessage('Password must be at least 6 characters long'),
        body('role')
            .optional()
            .isIn(['0', '1', '2'])
            .withMessage('Invalid role specified')
    ];
};

export const studentValidationRules = () => {
    return [
        body('firstName').trim().notEmpty().withMessage('First name is required'),
        body('lastName').trim().notEmpty().withMessage('Last name is required'),
        body('yearLevel')
            .trim()
            .notEmpty()
            .withMessage('Year level is required')
            .isIn(['1', '2', '3', '4'])
            .withMessage('Invalid year level'),
        body('program').trim().notEmpty().withMessage('Program is required'),
        body('faculty').trim().notEmpty().withMessage('Faculty is required'),
        body('studentId') // Changed from schoolId
            .trim()
            .notEmpty()
            .withMessage('Student ID is required')
            .matches(/^[0-9]{4}-[0-9]{4}$/)
            .withMessage('Student ID must follow the format: 0000-0000'),
        body('gmail')
            .trim()
            .notEmpty()
            .withMessage('Gmail is required')
            .matches(/^[a-zA-Z0-9._%+-]+@gmail\.com$/)
            .withMessage('Please provide a valid Gmail address'),
        body('suffix')
            .optional()
            .isIn(['Jr.', 'Sr.', 'I', 'II', 'III', 'IV', 'V', ''])
            .withMessage('Invalid suffix value'),
    ];
};

// Middleware to handle validation errors
export const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: errors.array().map((error) => error.msg),
      });
    }
    next();
  };