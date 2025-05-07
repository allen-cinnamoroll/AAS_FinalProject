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
    academicYear: {
        type: String,
        required: [true, "Academic year is required"],
        match: [
            /^\d{4}-\d{4}$/,
            "Academic year must be in format: YYYY-YYYY (e.g., 2023-2024)"
        ],
        validate: {
            validator: function(value) {
                const [start, end] = value.split('-').map(Number);
                return end === start + 1;
            },
            message: "End year must be the next year after start year"
        }
    },
    semester: {
        type: String,
        required: [true, "Semester is required"],
        enum: ['1', '2']
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

const EnrollmentModel = mongoose.model("Enrollment", enrollmentSchema);

export default EnrollmentModel;