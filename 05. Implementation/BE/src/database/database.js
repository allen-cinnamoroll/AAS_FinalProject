import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

const { NODE_ENV, DATABASE, DATABASE_LOCAL, DB_PASSWORD } = process.env;

if (!NODE_ENV || (!DATABASE_LOCAL && !DATABASE)) {
  console.error(
    "Missing required environment variables for database connection."
  );
  process.exit(1);
}

const DB_URI =
  NODE_ENV === "production"
    ? DATABASE.replace("<PASSWORD>", DB_PASSWORD)
    : DATABASE_LOCAL;

mongoose
  .connect(DB_URI)
  .then(() => {
    console.log(`${NODE_ENV} DB connected successfully`);
  })
  .catch((err) => {
    console.error("DB connection error:", err);
    process.exit(1); // Exit on failure
  });

export default mongoose.connection;
