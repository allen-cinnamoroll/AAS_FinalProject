import mongoose from "mongoose";

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
    enrollmentDate: {
        type: Date,
        default: Date.now
    },
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

const EnrollmentModel = mongoose.model("Enrollment", enrollmentSchema);

export default EnrollmentModel;