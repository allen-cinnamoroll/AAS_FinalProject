import AssignedCourseModel from '../models/AssignedCourseModel.js';
import EnrollmentModel from '../models/EnrollmentModel.js';

// Function to convert time string (e.g., "9:30 AM") to minutes since midnight
const timeToMinutes = (timeStr) => {
    const [time, period] = timeStr.split(' ');
    let [hours, minutes] = time.split(':').map(Number);
    
    if (period === 'PM' && hours !== 12) {
        hours += 12;
    } else if (period === 'AM' && hours === 12) {
        hours = 0;
    }
    
    return hours * 60 + minutes;
};

// Function to check if current time is after course end time
const isAfterEndTime = (endTime) => {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const endMinutes = timeToMinutes(endTime);
    return currentMinutes > endMinutes;
};

// Function to reset course status
const resetCourseStatus = async () => {
    try {
        const now = new Date();
        const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' });
        
        // Find all assigned courses
        const assignedCourses = await AssignedCourseModel.find({
            'schedule.days': currentDay
        }).populate('course');
        
        for (const course of assignedCourses) {
            if (isAfterEndTime(course.schedule.endTime)) {
                // Find all enrollments for this course
                const enrollments = await EnrollmentModel.find({
                    assignedCourse: course._id
                });
                
                // Reset status for each enrollment
                for (const enrollment of enrollments) {
                    enrollment.status = 'active'; // Reset to active status
                    await enrollment.save();
                }
                
                console.log(`Reset status for course ${course.course.courseId} section ${course.section}`);
            }
        }
    } catch (error) {
        console.error('Error resetting course status:', error);
    }
};

// Function to start the status reset scheduler
const startStatusResetScheduler = () => {
    // Run every minute to check course end times
    setInterval(resetCourseStatus, 60000);
    
    // Also run immediately when server starts
    resetCourseStatus();
};

export { startStatusResetScheduler }; 