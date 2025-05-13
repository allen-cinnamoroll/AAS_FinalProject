import * as ImagePicker from 'expo-image-picker';
import { ImagePickerAsset } from 'expo-image-picker';

export interface StudentFormData {
  firstName: string;
  lastName: string;
  middleName: string;
  suffix: string;
  yearLevel: string;
  program: string;
  faculty: string;
  studentId: string;
  gmail: string;
  idPhoto: ImagePickerAsset | {
    uri: string;
    type: string;
    name: string;
  } | null;
}

export interface InstructorFormData {
  firstName: string;
  lastName: string;
  middleName: string;
  suffix: string;
  instructorId: string;
  program: string;
  faculty: string;
  gmail: string;
  idPhoto: ImagePicker.ImagePickerAsset | null;
}

export interface CourseFormData {
  courseId: string;
  description: string;
  courseType: 'Lab' | 'Lec';
  units: number;
  term: '1' | '2';
  faculty: string;
  program: string;
} 