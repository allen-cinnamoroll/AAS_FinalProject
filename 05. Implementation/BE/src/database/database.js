import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

const { NODE_ENV, DATABASE, CLOUD_DATABASE, DB_PASSWORD } = process.env;

if (!NODE_ENV || (!CLOUD_DATABASE && !DATABASE)) {
  console.error(
    "Missing required environment variables for database connection."
  );
  process.exit(1);
}

const DB_URI =
  NODE_ENV === "production"
    ? DATABASE.replace("<PASSWORD>", DB_PASSWORD)
    : CLOUD_DATABASE;

// Configure mongoose options
mongoose.set('strictQuery', false);

const options = {
  serverSelectionTimeoutMS: 30000, // Increase timeout to 30 seconds
  socketTimeoutMS: 45000, // Increase socket timeout
  connectTimeoutMS: 30000, // Increase connection timeout
  maxPoolSize: 10, // Maximum number of connections in the pool
  minPoolSize: 5, // Minimum number of connections in the pool
  retryWrites: true,
  retryReads: true
};

mongoose
  .connect(DB_URI, options)
  .then(() => {
    console.log(`${NODE_ENV} DB connected successfully`);
  })
  .catch((err) => {
    console.error("DB connection error:", err);
    process.exit(1); // Exit on failure
  });

export default mongoose.connection;
