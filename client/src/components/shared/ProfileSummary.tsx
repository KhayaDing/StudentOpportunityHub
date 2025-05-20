import { Link } from "wouter";
import { User, StudentProfile, EmployerProfile } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { SkillBadge } from "@/components/ui/skill-badge";
import UserAvatar from "@/components/shared/UserAvatar";
import { calculateProfileCompletion } from "@/lib/utils";

interface ProfileSummaryProps {
  user: User | null;
  profile: StudentProfile | EmployerProfile | null;
}

export default function ProfileSummary({ user, profile }: ProfileSummaryProps) {
  const isStudent = user?.role === 'student';
  const studentProfile = isStudent ? (profile as StudentProfile) : null;
  const employerProfile = !isStudent ? (profile as EmployerProfile) : null;
  
  // Calculate profile completion percentage
  const completionPercentage = isStudent 
    ? calculateProfileCompletion(studentProfile)
    : employerProfile?.isVerified 
      ? 100 
      : 50;
  
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <UserAvatar user={user} className="h-16 w-16" />
          </div>
          <div className="ml-4">
            <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">
              {user?.firstName} {user?.lastName}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {isStudent
                ? studentProfile?.institution || "No institution specified"
                : employerProfile?.companyName || "Company name not specified"}
            </p>
            {isStudent && studentProfile?.program && (
              <div className="mt-1">
                <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 dark:bg-blue-900/20 dark:text-blue-300">
                  {studentProfile.program}
                </span>
              </div>
            )}
            {!isStudent && (
              <div className="mt-1">
                <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                  employerProfile?.isVerified 
                    ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300"
                    : "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300"
                }`}>
                  {employerProfile?.isVerified ? "Verified Employer" : "Pending Verification"}
                </span>
              </div>
            )}
          </div>
        </div>
        
        <div className="mt-6">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">Profile Completion</h3>
            <span className="text-sm font-medium">{completionPercentage}%</span>
          </div>
          <div className="mt-2 w-full">
            <Progress value={completionPercentage} className="h-2" />
          </div>
          
          {isStudent && (
            <div className="mt-3 space-y-2">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Complete these items to improve opportunity matching:
              </p>
              <ul className="text-xs space-y-1.5">
                <li className="flex items-start">
                  <span className={`flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center mt-0.5 ${
                    studentProfile?.institution ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400" : "bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500"
                  }`}>
                    {studentProfile?.institution ? "✓" : "!"}
                  </span>
                  <span className="ml-2">Basic Information (Name, Institution)</span>
                </li>
                <li className="flex items-start">
                  <span className={`flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center mt-0.5 ${
                    studentProfile?.program ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400" : "bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500"
                  }`}>
                    {studentProfile?.program ? "✓" : "!"}
                  </span>
                  <span className="ml-2">Program & Year of Study</span>
                </li>
                <li className="flex items-start">
                  <span className={`flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center mt-0.5 ${
                    studentProfile?.skills && studentProfile.skills.length >= 3 ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400" : "bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500"
                  }`}>
                    {studentProfile?.skills && studentProfile.skills.length >= 3 ? "✓" : "!"}
                  </span>
                  <span className="ml-2">Skills (at least 3)</span>
                </li>
                <li className="flex items-start">
                  <span className={`flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center mt-0.5 ${
                    studentProfile?.cvUrl ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400" : "bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500"
                  }`}>
                    {studentProfile?.cvUrl ? "✓" : "○"}
                  </span>
                  <span className="ml-2">CV Upload (optional but recommended)</span>
                </li>
              </ul>
            </div>
          )}
          
          {!isStudent && (
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              {employerProfile?.isVerified 
                ? "Your profile is complete and verified" 
                : "Waiting for admin verification. Ensure your company details are accurate."}
            </p>
          )}
        </div>
        
        {isStudent && studentProfile?.skills && studentProfile.skills.length > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">Skills</h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {studentProfile.skills.map((skill) => (
                <SkillBadge key={skill.id} skill={skill} />
              ))}
            </div>
          </div>
        )}
        
        {!isStudent && employerProfile?.industry && (
          <div className="mt-6">
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">Industry</h3>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
              {employerProfile.industry}
            </p>
          </div>
        )}
        
        <div className="mt-6">
          <Button asChild variant="outline" className="w-full">
            <Link href="/profile">
              <a className="flex items-center justify-center">
                Edit Profile
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-4 w-4 ml-2" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </a>
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
