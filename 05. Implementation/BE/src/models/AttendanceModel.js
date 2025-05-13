import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: [true, "Student ID is required"]
    },
    section: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Section',
        required: [true, "Section ID is required"]
    },
    enrollment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Enrollment'
    },
    date: {
        type: Date,
        default: Date.now,
        required: [true, "Attendance date is required"]
    },
    status: {
        type: String,
        enum: ['present', 'absent', 'late', 'excused'],
        default: 'present'
    },
    recordedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Instructor',
        required: [true, "Recorder ID is required"]
    }
}, {
    timestamps: true
});

// Create a compound index to prevent duplicate attendance records for the same student, section, and date
attendanceSchema.index(
    { 
        student: 1, 
        section: 1, 
        date: 1 
    }, 
    { 
        unique: true 
    }
);

const AttendanceModel = mongoose.model("Attendance", attendanceSchema);

export default AttendanceModel; 