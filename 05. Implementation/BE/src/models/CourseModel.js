import mongoose from "mongoose";

const courseSchema = new mongoose.Schema({
    courseId: {
        type: String,
        required: [true, "Course ID is required"],
        trim: true,
        uppercase: true,
    },
    courseCode: {
        type: String,
        trim: true,
        uppercase: true
    },
    courseName: {
        type: String,
        trim: true
    },
    description: {
        type: String,
        required: [true, "Course description is required"],
        trim: true
    },
    courseType: {
        type: String,
        required: [true, "Course type is required"],
        enum: ['Lab', 'Lec'],
        trim: true
    },
    units: {
        type: Number,
        required: [true, "Number of units is required"],
        min: [1, "Units must be at least 1"],
        max: [6, "Units cannot exceed 6"]
    },
    term: {
        type: String,
        required: [true, "Term is required"],
        enum: ['1', '2'],
        trim: true
    },
    faculty: {
        type: String,
        required: [true, "Faculty is required"],
        trim: true
    },
    program: {
        type: String,
        required: [true, "Program is required"],
        trim: true
    }
}, {
    timestamps: true
});

// Remove any existing indexes on courseId
courseSchema.index({ courseId: 1 }, { unique: false });

// Virtual for full course name
courseSchema.virtual('fullCourseName').get(function() {
    return `${this.courseId} - ${this.description} (${this.courseType})`;
});

// Set courseCode and courseName on save if they're not already set
courseSchema.pre('save', function(next) {
    // If courseCode is not set, use courseId as default
    if (!this.courseCode) {
        this.courseCode = this.courseId;
    }
    
    // If courseName is not set, use description as default
    if (!this.courseName) {
        this.courseName = this.description;
    }
    
    next();
});

// Add a post-find hook to ensure courseCode and courseName are set
courseSchema.post('find', function(docs) {
    if (Array.isArray(docs)) {
        docs.forEach(doc => {
            if (!doc.courseCode) {
                doc.courseCode = doc.courseId;
            }
            if (!doc.courseName) {
                doc.courseName = doc.description;
            }
        });
    }
});

// Also add a post-findOne hook
courseSchema.post('findOne', function(doc) {
    if (doc && !doc.courseCode) {
        doc.courseCode = doc.courseId;
    }
    if (doc && !doc.courseName) {
        doc.courseName = doc.description;
    }
});

const CourseModel = mongoose.model("Course", courseSchema);

export default CourseModel;