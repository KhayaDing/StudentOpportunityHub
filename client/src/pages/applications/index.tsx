import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { Application, UserRole } from "@/types";
import ApplicationCard from "@/components/shared/ApplicationCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { FileX } from "lucide-react";

export default function Applications() {
  // Check user role and authentication
  useUserRole();
  const { user } = useAuth();
  const isStudent = user?.role === 'student';
  const isEmployer = user?.role === 'employer';
  
  // Get query params for active tab
  const [activeTab, setActiveTab] = useState<string>("all");
  
  // Map tab to status for filtering
  const tabToStatus: Record<string, string | undefined> = {
    all: undefined,
    pending: "pending",
    accepted: "accepted",
    rejected: "rejected",
    completed: "completed",
  };
  
  // Fetch applications based on user role
  const {
    data: applications,
    isLoading,
    isError,
  } = useQuery<Application[]>({
    queryKey: [
      isStudent 
        ? "/api/applications/student" 
        : "/api/applications/employer",
      { status: tabToStatus[activeTab] }
    ],
    enabled: !!user,
  });
  
  const filteredApplications = applications?.filter(app => {
    if (activeTab === "all") return true;
    return app.status === tabToStatus[activeTab];
  });
  
  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };
  
  // Count applications by status
  const counts = {
    all: applications?.length || 0,
    pending: applications?.filter(app => app.status === "pending").length || 0,
    accepted: applications?.filter(app => app.status === "accepted").length || 0,
    rejected: applications?.filter(app => app.status === "rejected").length || 0,
    completed: applications?.filter(app => app.status === "completed").length || 0,
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Applications</h1>
        
        {isStudent && (
          <Button asChild>
            <Link href="/opportunities">
              <a>Browse Opportunities</a>
            </Link>
          </Button>
        )}
      </div>
      
      <Tabs defaultValue="all" value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="grid grid-cols-5 w-full md:w-auto md:inline-flex">
          <TabsTrigger value="all">
            All <span className="ml-1 text-xs text-gray-500">({counts.all})</span>
          </TabsTrigger>
          <TabsTrigger value="pending">
            Pending <span className="ml-1 text-xs text-gray-500">({counts.pending})</span>
          </TabsTrigger>
          <TabsTrigger value="accepted">
            Accepted <span className="ml-1 text-xs text-gray-500">({counts.accepted})</span>
          </TabsTrigger>
          <TabsTrigger value="rejected">
            Rejected <span className="ml-1 text-xs text-gray-500">({counts.rejected})</span>
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed <span className="ml-1 text-xs text-gray-500">({counts.completed})</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value={activeTab} className="mt-6">
          <div className="space-y-4">
            {isLoading ? (
              // Loading state
              Array(3).fill(0).map((_, i) => (
                <Skeleton key={i} className="h-[150px] w-full" />
              ))
            ) : filteredApplications?.length === 0 ? (
              // Empty state
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="mx-auto w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                    <FileX className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium">No applications found</h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    {isStudent
                      ? activeTab === "all"
                        ? "You haven't applied to any opportunities yet."
                        : `You don't have any ${activeTab} applications.`
                      : activeTab === "all"
                        ? "There are no applications for your opportunities."
                        : `There are no ${activeTab} applications.`
                    }
                  </p>
                  {isStudent && (
                    <Button className="mt-4" asChild>
                      <Link href="/opportunities">
                        <a>Browse Opportunities</a>
                      </Link>
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              // Applications list
              filteredApplications?.map((application) => (
                <ApplicationCard
                  key={application.id}
                  application={application}
                  viewType={isStudent ? "student" : "employer"}
                />
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
