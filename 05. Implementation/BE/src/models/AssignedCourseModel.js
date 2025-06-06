import mongoose from "mongoose";

const scheduleSchema = new mongoose.Schema({
    days: [{
        type: String,
        required: true,
        enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        trim: true
    }],
    startTime: {
        type: String,
        required: [true, "Start time is required"],
        match: [
            /^(0?[1-9]|1[0-2]):[0-5][0-9]\s(AM|PM)$/,
            "Time must be in format: HH:MM AM/PM (e.g., 9:30 AM)"
        ]
    },
    endTime: {
        type: String,
        required: [true, "End time is required"],
        match: [
            /^(0?[1-9]|1[0-2]):[0-5][0-9]\s(AM|PM)$/,
            "Time must be in format: HH:MM AM/PM (e.g., 11:00 AM)"
        ]
    }
});

const assignedCourseSchema = new mongoose.Schema({
    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: [true, "Course ID is required"]
    },
    instructor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Instructor',
        required: [true, "Instructor ID is required"]
    },
    section: {
        type: String,
        required: [true, "Section is required"],
        trim: true,
        uppercase: true
    },
    schedule: {
        type: scheduleSchema,
        required: [true, "Schedule is required"]
    },
    semester: {
        type: String,
        required: [true, "Semester is required"],
        enum: ['1', '2'],
        trim: true
    }
}, {
    timestamps: true
});

// Add compound index for unique course assignment
assignedCourseSchema.index(
    { 
        course: 1, 
        section: 1, 
        semester: 1 
    }, 
    { unique: true }
);

const AssignedCourseModel = mongoose.model("AssignedCourse", assignedCourseSchema);

export default AssignedCourseModel;