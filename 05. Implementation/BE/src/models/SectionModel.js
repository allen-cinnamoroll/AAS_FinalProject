import mongoose from 'mongoose';

const sectionSchema = new mongoose.Schema({
  sectionCode: {
    type: String,
    required: true,
    trim: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  schedule: {
    type: String,
    required: true,
    trim: true
  },
  students: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student'
  }],
  instructor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Instructor',
    required: true
  },
  classesHeld: {
    type: Number,
    default: 0,
    min: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt timestamp before saving
sectionSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const SectionModel = mongoose.model('Section', sectionSchema);

export default SectionModel; 