import mongoose from "mongoose";
import bcrypt from "bcrypt";

/**role ={
 * 0 - admin
 * 1 - instructor
 * 2 - student
} */

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "username is required"],
    },
    email: {
      type: String,
    },
    password: {
      type: String,
      required: [true, "password is required"],
    },
    role: {
      type: String,
      enum: ["0", "1", "2"],
      default: "1",
    },
    isPasswordChange:{
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

// Pre-save hook to hash the password before saving it to the database
userSchema.pre(
  "save",
  async function (next) {
    const user = this;

    // Only hash the password if it has been modified (or is new)
    if (user.isModified("password")) {
      try {
        // Generate a salt and hash the password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      } catch (err) {
        return next(err);
      }
    }
    next();
  },
  { discriminatorKey: "role", collection: "users" }
);


// Method to compare a given password with the hashed password in the database
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const UserModel = mongoose.model("Users", userSchema);

export default UserModel;