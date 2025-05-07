import mongoose from "mongoose";

const courseSchema = new mongoose.Schema({
    courseId: {
        type: String,
        required: [true, "Course ID is required"],
        trim: true,
        uppercase: true,
        validate: {
            validator: async function(value) {
                const count = await mongoose.models.Course.countDocuments({ 
                    courseId: value,
                    _id: { $ne: this._id } // Exclude current document
                });
                return count < 2; // Allow maximum of 2 (original + 1 duplicate)
            },
            message: props => `Course ID '${props.value}' cannot have more than 2 instances`
        }
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

// Virtual for full course name
courseSchema.virtual('fullCourseName').get(function() {
    return `${this.courseId} - ${this.description} (${this.courseType})`;
});

const CourseModel = mongoose.model("Course", courseSchema);

export default CourseModel;