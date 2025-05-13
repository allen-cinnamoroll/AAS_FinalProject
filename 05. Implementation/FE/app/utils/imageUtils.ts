import { API_URL } from '../services/api';

export const getImageUrl = (path: string) => {
    if (!path) return '';
    
    // If the path is already a full URL, return it
    if (path.startsWith('http')) {
        return path;
    }
    
    // If the path starts with /uploads, prepend the API URL
    if (path.startsWith('/uploads')) {
        return `${API_URL.replace('/api', '')}${path}`;
    }
    
    // Check if it's an instructor photo
    if (path.includes('instructor-photos')) {
        return `${API_URL.replace('/api', '')}/uploads/instructor-photos/${path.split('/').pop()}`;
    }
    
    // Otherwise, assume it's a student photo
    return `${API_URL.replace('/api', '')}/uploads/student-photos/${path.split('/').pop()}`;
}; 