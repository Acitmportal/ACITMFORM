
export enum UserRole {
  ADMIN = 'admin',
  CENTER = 'center',
}

export enum StudentStatus {
  PENDING = 'Pending',
  ACCEPTED = 'Accepted',
  REJECTED = 'Rejected',
}

export interface User {
  id: string;
  email: string;
  role: UserRole;
  centerId?: string;
  centerName?: string;
}

export interface Student {
  id: string;
  name: string;
  fatherName: string;
  course: string;
  admissionDate: string;
  mobile: string;
  address: string;
  gender: string;
  dob: string;
  photoUrl: string;
  signatureUrl: string;
  status: StudentStatus;
  centerId: string;
}

export interface Center {
  id: string;
  name: string;
  location: string;
}