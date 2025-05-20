// User types
export type UserRole = 'student' | 'employer' | 'admin';
export type UserStatus = 'pending' | 'active' | 'inactive' | 'banned';

export interface User {
  id: number;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: UserRole;
  status: UserStatus;
  profileImageUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

// Student types
export interface StudentProfile {
  id: number;
  userId: number;
  institution: string | null;
  program: string | null;
  yearOfStudy: number | null;
  bio: string | null;
  cvUrl: string | null;
  isProfileVisible: boolean;
  createdAt: string;
  updatedAt: string;
  user?: User;
  skills?: Skill[];
}

// Employer types
export interface EmployerProfile {
  id: number;
  userId: number;
  companyName: string;
  industry: string | null;
  description: string | null;
  location: string | null;
  website: string | null;
  logoUrl: string | null;
  contactPhone: string | null;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
  user?: User;
}

// Skill type
export interface Skill {
  id: number;
  name: string;
  category: string | null;
  createdAt: string;
}

// Opportunity types
export type LocationType = 'remote' | 'in-person' | 'hybrid';
export type DurationType = 'days' | 'weeks' | 'months' | 'ongoing';

export interface Opportunity {
  id: number;
  employerId: number;
  title: string;
  description: string;
  category: string | null;
  locationType: LocationType;
  location: string | null;
  deadline: string | null;
  startDate: string | null;
  durationValue: number | null;
  durationType: DurationType | null;
  requiredProgram: string | null;
  preferredYear: number | null;
  stipend: string | null;
  isActive: boolean;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
  employer?: EmployerProfile;
  company?: EmployerProfile;
  skills?: Skill[];
  isSaved?: boolean;
  hasApplied?: boolean;
  applicationStatus?: ApplicationStatus;
}

// Application types
export type ApplicationStatus = 'pending' | 'accepted' | 'rejected' | 'completed';

export interface Application {
  id: number;
  studentId: number;
  opportunityId: number;
  status: ApplicationStatus;
  coverLetter: string | null;
  feedback: string | null;
  certificateId: string | null;
  appliedAt: string;
  updatedAt: string;
  completedAt: string | null;
  opportunity?: Opportunity;
  student?: StudentProfile;
  employer?: EmployerProfile;
}

// Certificate type
export interface Certificate {
  id: string;
  applicationId: number | null;
  studentId: number;
  employerId: number;
  opportunityTitle: string;
  studentName: string;
  employerName: string;
  description: string | null;
  startDate: string | null;
  endDate: string | null;
  issuedAt: string;
  pdfUrl: string | null;
}

// Stats type for admin dashboard
export interface Stats {
  users: {
    students: number;
    employers: number;
    admins: number;
  };
  opportunities: {
    total: number;
    active: number;
    verified: number;
  };
  applications: {
    total: number;
    pending: number;
    accepted: number;
    rejected: number;
    completed: number;
  };
  certificates: {
    total: number;
  };
  activeEmployers: {
    employerId: number;
    companyName: string;
    count: number;
  }[];
  popularSkills: {
    skillId: number;
    skillName: string;
    count: number;
  }[];
}

// Auth context types
export interface AuthContextType {
  user: User | null;
  profile: StudentProfile | EmployerProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => Promise<void>;
}
