import mongoose from "mongoose";

const photoSchema = new mongoose.Schema({
    url: {
        type: String,
        required: [true, "Photo URL is required"]
    },
    publicId: {
        type: String,
        required: [true, "Public ID is required"]
    },
    metadata: {
        fileName: String,
        fileType: {
            type: String,
            enum: ['image/jpeg', 'image/png', 'image/jpg'],
            required: true
        },
        fileSize: Number
    }
});

const instructorSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: [true, "First name is required"],
        trim: true
    },
    lastName: {
        type: String,
        required: [true, "Last name is required"],
        trim: true
    },
    middleName: {
        type: String,
        trim: true
    },
    suffix: {
        type: String,
        trim: true,
        enum: ['Jr.', 'Sr.', 'I', 'II', 'III', 'IV', 'V', ''],
        default: ''
    },
    instructorId: {
        type: String,
        required: [true, "Instructor ID is required"],
        unique: true,
        trim: true
    },
    program: {
        type: String,
        required: [true, "Program is required"],
        trim: true
    },
    faculty: {
        type: String,
        required: [true, "Faculty is required"],
        trim: true
    },
    idPhoto: {
        type: photoSchema,
        required: [true, "ID photo is required"]
    },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual for full name
instructorSchema.virtual('fullName').get(function() {
    const middleInitial = this.middleName ? `${this.middleName.charAt(0)}. ` : '';
    const suffixStr = this.suffix ? ` ${this.suffix}` : '';
    return `${this.firstName} ${middleInitial}${this.lastName}${suffixStr}`.trim();
});

const Instructor = mongoose.model("Instructor", instructorSchema);

export default Instructor;