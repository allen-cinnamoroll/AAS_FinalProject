import { body, validationResult } from "express-validator";


// Instructor registration validation rules
export const instructorValidationRules = () => [
    body("firstName")
        .notEmpty().withMessage("First name is required")
        .trim()
        .isLength({ min: 2 }).withMessage("First name must be at least 2 characters"),
    
    body("lastName")
        .notEmpty().withMessage("Last name is required")
        .trim()
        .isLength({ min: 2 }).withMessage("Last name must be at least 2 characters"),
    
    body("middleName")
        .optional()
        .trim(),
    
    body("suffix")
        .optional()
        .isIn(['Jr.', 'Sr.', 'I', 'II', 'III', 'IV', 'V', '']).withMessage("Invalid suffix value"),
    
    body("program")
        .notEmpty().withMessage("Program is required")
        .trim()
        .isLength({ min: 2 }).withMessage("Program must be at least 2 characters"),
    
    body("faculty")
        .notEmpty().withMessage("Faculty is required")
        .trim()
        .isLength({ min: 2 }).withMessage("Faculty must be at least 2 characters"),
];

// Photo validation middleware
export const photoValidation = (req, res, next) => {
    if (!req.file) {
        return res.status(400).json({
            success: false,
            message: "ID photo is required"
        });
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