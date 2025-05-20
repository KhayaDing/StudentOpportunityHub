import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { StudentProfile, EmployerProfile } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import StudentProfileForm from "@/components/students/StudentProfileForm";
import { updateStudentProfile, updateEmployerProfile } from "@/lib/api";

export default function Profile() {
  // Check authentication and user role
  const { user } = useUserRole();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Fetch profile data based on user role
  const { data: profile, isLoading } = useQuery<StudentProfile | EmployerProfile>({
    queryKey: [user?.role === 'student' ? '/api/students/profile' : '/api/employers/profile'],
    enabled: !!user,
  });

  // Update student profile mutation
  const updateStudentProfileMutation = useMutation({
    mutationFn: updateStudentProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/students/profile'] });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
      setIsSubmitting(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
      setIsSubmitting(false);
    },
  });

  // Update employer profile mutation
  const updateEmployerProfileMutation = useMutation({
    mutationFn: updateEmployerProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/employers/profile'] });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
      setIsSubmitting(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
      setIsSubmitting(false);
    },
  });

  // Handle form submissions
  const handleStudentSubmit = (formData: FormData) => {
    setIsSubmitting(true);
    updateStudentProfileMutation.mutate(formData);
  };

  const handleEmployerSubmit = (formData: FormData) => {
    setIsSubmitting(true);
    updateEmployerProfileMutation.mutate(formData);
  };

  if (isLoading) {
    return <Skeleton className="w-full h-[600px]" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
      </div>

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">Profile Information</TabsTrigger>
          {user?.role === 'student' && <TabsTrigger value="cv">CV & Documents</TabsTrigger>}
          <TabsTrigger value="account">Account Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6 mt-6">
          {user?.role === 'student' && (
            <StudentProfileForm 
              profile={profile as StudentProfile} 
              onSubmit={handleStudentSubmit}
              isSubmitting={isSubmitting}
            />
          )}

          {user?.role === 'employer' && (
            <Card>
              <CardHeader>
                <CardTitle>Employer Profile</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  handleEmployerSubmit(formData);
                }} className="space-y-6">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label htmlFor="companyName" className="text-sm font-medium">Company Name</label>
                      <input
                        id="companyName"
                        name="companyName"
                        className="w-full p-2 border rounded-md"
                        defaultValue={(profile as EmployerProfile)?.companyName || ''}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label htmlFor="industry" className="text-sm font-medium">Industry</label>
                      <input
                        id="industry"
                        name="industry"
                        className="w-full p-2 border rounded-md"
                        defaultValue={(profile as EmployerProfile)?.industry || ''}
                      />
                    </div>
                    
                    <div className="space-y-2 sm:col-span-2">
                      <label htmlFor="description" className="text-sm font-medium">Company Description</label>
                      <textarea
                        id="description"
                        name="description"
                        rows={4}
                        className="w-full p-2 border rounded-md"
                        defaultValue={(profile as EmployerProfile)?.description || ''}
                      ></textarea>
                    </div>
                    
                    <div className="space-y-2">
                      <label htmlFor="location" className="text-sm font-medium">Location</label>
                      <input
                        id="location"
                        name="location"
                        className="w-full p-2 border rounded-md"
                        defaultValue={(profile as EmployerProfile)?.location || ''}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label htmlFor="website" className="text-sm font-medium">Website</label>
                      <input
                        id="website"
                        name="website"
                        type="url"
                        className="w-full p-2 border rounded-md"
                        defaultValue={(profile as EmployerProfile)?.website || ''}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label htmlFor="contactPhone" className="text-sm font-medium">Contact Phone</label>
                      <input
                        id="contactPhone"
                        name="contactPhone"
                        className="w-full p-2 border rounded-md"
                        defaultValue={(profile as EmployerProfile)?.contactPhone || ''}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label htmlFor="logo" className="text-sm font-medium">Company Logo</label>
                      <input
                        id="logo"
                        name="logo"
                        type="file"
                        accept="image/jpeg,image/png,image/svg+xml"
                        className="w-full p-2 border rounded-md"
                      />
                      {(profile as EmployerProfile)?.logoUrl && (
                        <div className="mt-2 text-sm text-muted-foreground">
                          Current logo: <a href={(profile as EmployerProfile)?.logoUrl!} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">View uploaded logo</a>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex justify-end gap-4">
                    <button
                      type="button"
                      className="px-4 py-2 border rounded-md"
                      onClick={() => window.history.back()}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-primary text-white rounded-md"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Saving...' : 'Save Profile'}
                    </button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {user?.role === 'student' && (
          <TabsContent value="cv" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>CV & Documents</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium mb-2">Your CV</h3>
                    {(profile as StudentProfile)?.cvUrl ? (
                      <div className="flex items-center gap-4">
                        <div className="flex items-center p-4 border rounded-md">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <div className="ml-4">
                            <p className="text-sm font-medium">Your CV</p>
                            <p className="text-xs text-gray-500">Uploaded on {new Date((profile as StudentProfile)?.updatedAt!).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <a 
                          href={(profile as StudentProfile)?.cvUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="px-4 py-2 bg-primary text-white rounded-md"
                        >
                          View CV
                        </a>
                      </div>
                    ) : (
                      <div className="p-4 border rounded-md text-gray-500">
                        No CV uploaded yet. Upload your CV in the Profile Information tab.
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        <TabsContent value="account" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Account Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Your Details</h3>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label htmlFor="firstName" className="text-sm font-medium">First Name</label>
                      <input
                        id="firstName"
                        className="w-full p-2 border rounded-md"
                        value={user?.firstName || ''}
                        disabled
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label htmlFor="lastName" className="text-sm font-medium">Last Name</label>
                      <input
                        id="lastName"
                        className="w-full p-2 border rounded-md"
                        value={user?.lastName || ''}
                        disabled
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label htmlFor="email" className="text-sm font-medium">Email Address</label>
                      <input
                        id="email"
                        className="w-full p-2 border rounded-md"
                        value={user?.email || ''}
                        disabled
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label htmlFor="role" className="text-sm font-medium">Account Type</label>
                      <input
                        id="role"
                        className="w-full p-2 border rounded-md"
                        value={user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1) || ''}
                        disabled
                      />
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Change Password</h3>
                  <form className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label htmlFor="currentPassword" className="text-sm font-medium">Current Password</label>
                      <input
                        id="currentPassword"
                        type="password"
                        className="w-full p-2 border rounded-md"
                        placeholder="Enter current password"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label htmlFor="newPassword" className="text-sm font-medium">New Password</label>
                      <input
                        id="newPassword"
                        type="password"
                        className="w-full p-2 border rounded-md"
                        placeholder="Enter new password"
                      />
                    </div>
                    
                    <div className="space-y-2 sm:col-span-2">
                      <button
                        type="button"
                        className="px-4 py-2 bg-primary text-white rounded-md"
                      >
                        Change Password
                      </button>
                    </div>
                  </form>
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-lg font-medium text-red-600">Danger Zone</h3>
                  <div className="p-4 border border-red-200 rounded-md bg-red-50">
                    <h4 className="text-sm font-medium text-red-800">Delete Your Account</h4>
                    <p className="mt-1 text-sm text-red-700">
                      Once you delete your account, there is no going back. Please be certain.
                    </p>
                    <button
                      type="button"
                      className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md"
                    >
                      Delete Account
                    </button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
