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

const studentSchema = new mongoose.Schema({
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
    yearLevel: {
        type: String,
        required: [true, "Year level is required"],
        enum: ['1', '2', '3', '4'],
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
    studentId: {
        type: String,
        required: [true, "School ID is required"],
        unique: true,
        trim: true,
        match: [
            /^[0-9]{4}-[0-9]{4}$/,
            'School ID must follow the format: 0000-0000'
        ],
        uppercase: true
    },
    gmail: {
        type: String,
        required: [true, "Gmail address is required"],
        unique: true,
        trim: true,
        match: [/^[a-zA-Z0-9._%+-]+@gmail\.com$/, 'Please provide a valid Gmail address'],
        lowercase: true
    },
    role: {
        type: String,
        default: "2",
        immutable: true,
        enum: ["2"]  // Role 2 for students
    },
    lastLogin: {
        type: Date,
        default: null
    },
    lastLogout: {
        type: Date,
        default: null
    },
    otp: {
        code: {
            type: String,
            default: null
        },
        expiresAt: {
            type: Date,
            default: null
        }
    },
    idPhoto: {
        type: photoSchema,
        required: [true, "ID photo is required"]
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});



// Virtual for full name
studentSchema.virtual('fullName').get(function() {
    const middleInitial = this.middleName ? `${this.middleName.charAt(0)}. ` : '';
    const suffixStr = this.suffix ? ` ${this.suffix}` : '';
    return `${this.firstName} ${middleInitial}${this.lastName}${suffixStr}`.trim();
});

const StudentModel = mongoose.model("Student", studentSchema);

export default StudentModel;