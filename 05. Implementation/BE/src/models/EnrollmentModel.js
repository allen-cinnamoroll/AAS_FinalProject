import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema({
    percentage: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    }
});

const enrollmentSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: [true, "Student ID is required"]
    },
    assignedCourse: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AssignedCourse',
        required: [true, "Assigned course is required"]
    },
    section: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Section'
    },
    enrollmentDate: {
        type: Date,
        default: Date.now
    },
    attendance: {
        type: attendanceSchema,
        default: () => ({})
    }
}, {
    timestamps: true
});

// Compound index to prevent duplicate enrollments
enrollmentSchema.index(
    { 
        student: 1, 
        assignedCourse: 1, 
        academicYear: 1, 
        semester: 1 
    }, 
    { unique: true }
);

// Update the attendance.lastUpdated timestamp when attendance is modified
enrollmentSchema.pre('save', function(next) {
    if (this.isModified('attendance.percentage')) {
        this.attendance.lastUpdated = new Date();
    }
    next();
});

const EnrollmentModel = mongoose.model("Enrollment", enrollmentSchema);

export default EnrollmentModel;