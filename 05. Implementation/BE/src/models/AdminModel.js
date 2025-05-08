import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const adminSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Username is required"],
    },
    gmail: {  // Changed from email to gmail
      type: String,
      required: [true, "Gmail address is required"],
      unique: true,
      trim: true,
      match: [/^[a-zA-Z0-9._%+-]+@gmail\.com$/, 'Please provide a valid Gmail address'],
      lowercase: true
    },
    password: {
      type: String,
      required: [true, "Password is required"],
    },
    role: {
      type: String,
      enum: ["0"],  // Only admin role
      default: "0",
      immutable: true
    },
    isPasswordChange:{
      type: Boolean,
      default: false
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
    isEmailVerified: {
        type: Boolean,
        default: false
    },
    lastLogin: {
        type: Date,
        default: null
    }
  },
  { timestamps: true }
);

// Pre-save hook to hash the password
adminSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    try {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
    } catch (err) {
      return next(err);
    }
  }
  next();
});

// Password comparison method
adminSchema.methods.comparePassword = async function(candidatePassword) {
  try {
      return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
      throw error;
  }
};

const AdminModel = mongoose.model("Admin", adminSchema);

export default AdminModel;