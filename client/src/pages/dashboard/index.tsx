import { useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";
import { Opportunity, Application } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProfileSummary from "@/components/shared/ProfileSummary";
import OpportunityCard from "@/components/shared/OpportunityCard";
import ApplicationCard from "@/components/shared/ApplicationCard";
import { ArrowRight } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const { user, profile, isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const isStudent = user?.role === 'student';
  const isEmployer = user?.role === 'employer';
  const isAdmin = user?.role === 'admin';

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setLocation('/login');
    }
  }, [isLoading, isAuthenticated, setLocation]);

  // Fetch recommended opportunities for students
  const { 
    data: recommendedOpportunities, 
    isLoading: isLoadingRecommended 
  } = useQuery<Opportunity[]>({
    queryKey: ['/api/opportunities/recommended', { limit: 3 }],
    enabled: isAuthenticated && isStudent,
  });

  // Fetch recent applications for students
  const {
    data: recentApplications,
    isLoading: isLoadingApplications,
  } = useQuery<Application[]>({
    queryKey: ['/api/applications/student'],
    enabled: isAuthenticated && isStudent,
  });

  // Fetch employer's active opportunities
  const {
    data: employerOpportunities,
    isLoading: isLoadingEmployerOpportunities,
  } = useQuery<Opportunity[]>({
    queryKey: ['/api/opportunities', { employerId: profile?.id }],
    enabled: isAuthenticated && isEmployer,
  });

  // Fetch applications for employer's opportunities
  const {
    data: employerApplications,
    isLoading: isLoadingEmployerApplications,
  } = useQuery<Application[]>({
    queryKey: ['/api/applications/opportunity', { employerId: profile?.id }],
    enabled: isAuthenticated && isEmployer && employerOpportunities?.length > 0,
  });

  // Fetch admin stats
  const {
    data: adminStats,
    isLoading: isLoadingStats,
  } = useQuery({
    queryKey: ['/api/admin/stats'],
    enabled: isAuthenticated && isAdmin,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-[250px] w-full" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
      </div>

      <Tabs defaultValue={isStudent ? "student" : isEmployer ? "employer" : "admin"}>
        <TabsList>
          {isStudent && <TabsTrigger value="student">Student Dashboard</TabsTrigger>}
          {isEmployer && <TabsTrigger value="employer">Employer Dashboard</TabsTrigger>}
          {isAdmin && <TabsTrigger value="admin">Admin Dashboard</TabsTrigger>}
        </TabsList>

        {/* Student Dashboard */}
        {isStudent && (
          <TabsContent value="student" className="mt-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {/* Profile Card */}
              <div className="md:col-span-1">
                <ProfileSummary user={user} profile={profile} />
              </div>

              {/* Main Content */}
              <div className="md:col-span-2 space-y-6">
                {/* Application Status Summary */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-medium">Your Applications</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                          {recentApplications?.filter(app => app.status === 'pending').length || 0}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Pending</p>
                      </div>
                      <div>
                        <p className="text-2xl font-semibold text-green-500">
                          {recentApplications?.filter(app => app.status === 'accepted').length || 0}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Accepted</p>
                      </div>
                      <div>
                        <p className="text-2xl font-semibold text-red-500">
                          {recentApplications?.filter(app => app.status === 'rejected').length || 0}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Rejected</p>
                      </div>
                    </div>
                    <div className="mt-4">
                      <Link href="/applications">
                        <a className="inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300">
                          View all applications
                          <ArrowRight className="ml-1 h-4 w-4" />
                        </a>
                      </Link>
                    </div>
                  </CardContent>
                </Card>

                {/* Recommended Opportunities */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-medium">Recommended For You</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y divide-gray-200 dark:divide-gray-800">
                      {isLoadingRecommended ? (
                        <>
                          <div className="p-6">
                            <Skeleton className="h-20 w-full mb-2" />
                            <Skeleton className="h-4 w-20" />
                          </div>
                          <div className="p-6">
                            <Skeleton className="h-20 w-full mb-2" />
                            <Skeleton className="h-4 w-20" />
                          </div>
                        </>
                      ) : recommendedOpportunities?.length === 0 ? (
                        <div className="p-6 text-center">
                          <div className="mx-auto w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <h3 className="text-lg font-medium mb-1">No recommendations yet</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                            To get personalized recommendations:
                          </p>
                          <ul className="text-sm text-left mx-auto max-w-xs space-y-2 mb-4">
                            <li className="flex items-center">
                              <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 p-1 rounded-full mr-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              </span>
                              Add at least 3 skills to your profile
                            </li>
                            <li className="flex items-center">
                              <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 p-1 rounded-full mr-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              </span>
                              Select your program and year of study
                            </li>
                            <li className="flex items-center">
                              <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 p-1 rounded-full mr-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              </span>
                              Upload your CV (optional but recommended)
                            </li>
                          </ul>
                        </div>
                      ) : (
                        recommendedOpportunities?.map((opportunity) => (
                          <div key={opportunity.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                            <div className="flex justify-between items-start">
                              <div className="flex items-start space-x-4">
                                <div className="flex-shrink-0 h-12 w-12 rounded-md bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                  </svg>
                                </div>
                                <div>
                                  <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">{opportunity.title}</h4>
                                  <p className="text-sm text-gray-500 dark:text-gray-400">{opportunity.company?.companyName}</p>
                                  <div className="mt-1 flex flex-wrap gap-1">
                                    <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 dark:bg-blue-900/20 dark:text-blue-300">
                                      {opportunity.locationType}
                                    </span>
                                    {opportunity.durationValue && opportunity.durationType && (
                                      <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700 dark:bg-amber-900/20 dark:text-amber-300">
                                        {opportunity.durationValue} {opportunity.durationType}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="flex flex-col items-end">
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  Posted {new Date(opportunity.createdAt).toLocaleDateString()}
                                </span>
                                {opportunity.deadline && (
                                  <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    Deadline: {new Date(opportunity.deadline).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="mt-3 flex justify-between">
                              <div className="flex flex-wrap gap-1">
                                {opportunity.skills?.slice(0, 2).map((skill) => (
                                  <span key={skill.id} className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700 dark:bg-green-900/20 dark:text-green-300">
                                    {skill.name}
                                  </span>
                                ))}
                                {opportunity.skills && opportunity.skills.length > 2 && (
                                  <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                                    +{opportunity.skills.length - 2} more
                                  </span>
                                )}
                              </div>
                              <Link href={`/opportunities/${opportunity.id}`}>
                                <a className="inline-flex items-center text-xs font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300">
                                  View Details
                                  <ArrowRight className="ml-1 h-3 w-3" />
                                </a>
                              </Link>
                            </div>
                          </div>
                        ))
                      )}
                      
                      <div className="px-6 py-4 text-center">
                        <Link href="/opportunities">
                          <Button className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6">
                            Browse All Opportunities
                          </Button>
                        </Link>
                        {!recommendedOpportunities?.length && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
                            We match you with the best roles based on your program, year, and skills.
                            Stay updated by keeping your profile fresh!
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        )}

        {/* Employer Dashboard */}
        {isEmployer && (
          <TabsContent value="employer" className="mt-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {/* Profile Card */}
              <div className="md:col-span-1">
                <ProfileSummary user={user} profile={profile} />
                
                <Card className="mt-6">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-medium">Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button className="w-full" asChild>
                      <Link href="/opportunities/create">
                        <a>Post New Opportunity</a>
                      </Link>
                    </Button>
                    <Button variant="outline" className="w-full" asChild>
                      <Link href="/applications">
                        <a>Manage Applications</a>
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Main Content */}
              <div className="md:col-span-2 space-y-6">
                {/* Opportunities Summary */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-medium">Your Opportunities</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                          {employerOpportunities?.length || 0}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Total</p>
                      </div>
                      <div>
                        <p className="text-2xl font-semibold text-green-500">
                          {employerOpportunities?.filter(opp => opp.isActive).length || 0}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Active</p>
                      </div>
                      <div>
                        <p className="text-2xl font-semibold text-amber-500">
                          {employerOpportunities?.filter(opp => !opp.isVerified).length || 0}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Pending</p>
                      </div>
                    </div>
                    <div className="mt-4">
                      <Link href="/opportunities">
                        <a className="inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300">
                          Manage your opportunities
                          <ArrowRight className="ml-1 h-4 w-4" />
                        </a>
                      </Link>
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Applications */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-medium">Recent Applications</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y divide-gray-200 dark:divide-gray-800">
                      {isLoadingEmployerApplications ? (
                        <>
                          <div className="p-6">
                            <Skeleton className="h-20 w-full mb-2" />
                            <Skeleton className="h-4 w-20" />
                          </div>
                          <div className="p-6">
                            <Skeleton className="h-20 w-full mb-2" />
                            <Skeleton className="h-4 w-20" />
                          </div>
                        </>
                      ) : !employerApplications || employerApplications.length === 0 ? (
                        <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                          <p>No applications yet. Post opportunities to receive applications!</p>
                        </div>
                      ) : (
                        employerApplications.slice(0, 3).map((application) => (
                          <div key={application.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                            <div className="flex justify-between items-start">
                              <div className="flex items-start space-x-4">
                                <div className="flex-shrink-0 h-12 w-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                                  {application.student?.user?.profileImageUrl ? (
                                    <img 
                                      src={application.student.user.profileImageUrl} 
                                      alt={`${application.student.user.firstName} ${application.student.user.lastName}`}
                                      className="h-full w-full object-cover"
                                    />
                                  ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                  )}
                                </div>
                                <div>
                                  <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                    {application.student?.user?.firstName} {application.student?.user?.lastName}
                                  </h4>
                                  <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {application.student?.program || "Program not specified"}
                                  </p>
                                  <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                                    application.status === 'pending' 
                                      ? "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300"
                                      : application.status === 'accepted'
                                      ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300"
                                      : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300"
                                  }`}>
                                    {application.status}
                                  </span>
                                </div>
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {new Date(application.appliedAt).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                      
                      <div className="px-6 py-4 text-center">
                        <Button asChild>
                          <Link href="/applications">
                            <a>View All Applications</a>
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        )}

        {/* Admin Dashboard */}
        {isAdmin && (
          <TabsContent value="admin" className="mt-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
              {/* Stats Cards */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {isLoadingStats ? <Skeleton className="h-8 w-16" /> : adminStats?.users?.students || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Registered student accounts
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Employers</CardTitle>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {isLoadingStats ? <Skeleton className="h-8 w-16" /> : adminStats?.users?.employers || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Registered employer accounts
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Opportunities</CardTitle>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {isLoadingStats ? <Skeleton className="h-8 w-16" /> : adminStats?.opportunities?.total || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Total opportunities posted
                  </p>
                  <div className="mt-2">
                    <Progress value={(adminStats?.opportunities?.verified / adminStats?.opportunities?.total || 0) * 100} className="h-1" />
                    <p className="mt-1 text-xs text-muted-foreground">
                      {adminStats?.opportunities?.verified || 0} verified
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Applications</CardTitle>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {isLoadingStats ? <Skeleton className="h-8 w-16" /> : adminStats?.applications?.total || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Total applications submitted
                  </p>
                  <div className="mt-2 grid grid-cols-3 gap-1 text-xs text-muted-foreground">
                    <div>
                      <span className="text-amber-500 font-medium">{adminStats?.applications?.pending || 0}</span> pending
                    </div>
                    <div>
                      <span className="text-green-500 font-medium">{adminStats?.applications?.accepted || 0}</span> accepted
                    </div>
                    <div>
                      <span className="text-red-500 font-medium">{adminStats?.applications?.rejected || 0}</span> rejected
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Admin Actions */}
              <div className="md:col-span-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Button variant="outline" className="h-auto py-4 flex flex-col items-center space-y-2" asChild>
                  <Link href="/admin/employers">
                    <a>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-sm font-medium">Approve Employers</span>
                    </a>
                  </Link>
                </Button>
                
                <Button variant="outline" className="h-auto py-4 flex flex-col items-center space-y-2" asChild>
                  <Link href="/admin/listings">
                    <a>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      <span className="text-sm font-medium">Moderate Listings</span>
                    </a>
                  </Link>
                </Button>
                
                <Button variant="outline" className="h-auto py-4 flex flex-col items-center space-y-2" asChild>
                  <Link href="/admin/students">
                    <a>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                      <span className="text-sm font-medium">Manage Students</span>
                    </a>
                  </Link>
                </Button>
                
                <Button variant="outline" className="h-auto py-4 flex flex-col items-center space-y-2" asChild>
                  <Link href="/admin/dashboard">
                    <a>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      <span className="text-sm font-medium">Advanced Analytics</span>
                    </a>
                  </Link>
                </Button>
              </div>

              {/* Admin Overview */}
              <div className="md:col-span-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Platform Activity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="text-sm font-medium mb-2">Most Active Employers</h3>
                        {isLoadingStats ? (
                          <div className="space-y-2">
                            {[1, 2, 3].map(i => (
                              <Skeleton key={i} className="h-6 w-full" />
                            ))}
                          </div>
                        ) : adminStats?.activeEmployers?.length === 0 ? (
                          <p className="text-sm text-muted-foreground">No data available</p>
                        ) : (
                          <ul className="space-y-2">
                            {adminStats?.activeEmployers?.map((employer, index) => (
                              <li key={employer.employerId} className="flex items-center justify-between">
                                <span className="text-sm">
                                  {index + 1}. {employer.companyName}
                                </span>
                                <span className="text-sm font-medium">
                                  {employer.count} opportunities
                                </span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium mb-2">Popular Skills</h3>
                        {isLoadingStats ? (
                          <div className="space-y-2">
                            {[1, 2, 3].map(i => (
                              <Skeleton key={i} className="h-6 w-full" />
                            ))}
                          </div>
                        ) : adminStats?.popularSkills?.length === 0 ? (
                          <p className="text-sm text-muted-foreground">No data available</p>
                        ) : (
                          <ul className="space-y-2">
                            {adminStats?.popularSkills?.map((skill, index) => (
                              <li key={skill.skillId} className="flex items-center justify-between">
                                <span className="text-sm">
                                  {index + 1}. {skill.skillName}
                                </span>
                                <span className="text-sm font-medium">
                                  {skill.count} opportunities
                                </span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
