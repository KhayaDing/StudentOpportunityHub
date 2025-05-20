import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";

export default function AdminDashboard() {
  const { isAuthenticated } = useAuth();
  
  const { data: stats, isLoading } = useQuery({
    queryKey: ['/api/admin/stats'],
    enabled: isAuthenticated,
  });

  if (isLoading) {
    return <div className="flex items-center justify-center h-full">Loading dashboard statistics...</div>;
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.studentCount || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Employers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.employerCount || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Opportunities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.opportunityCount || 0}</div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Applications</CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.recentApplications?.length ? (
              <div className="space-y-4">
                {stats.recentApplications.map((app: any) => (
                  <div key={app.id} className="flex justify-between items-center border-b pb-2">
                    <div>
                      <div className="font-medium">{app.studentName}</div>
                      <div className="text-sm text-muted-foreground">{app.opportunityTitle}</div>
                    </div>
                    <div className="text-sm">{new Date(app.createdAt).toLocaleDateString()}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground">No recent applications</div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Pending Verifications</CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.pendingEmployers?.length ? (
              <div className="space-y-4">
                {stats.pendingEmployers.map((emp: any) => (
                  <div key={emp.id} className="flex justify-between items-center border-b pb-2">
                    <div>
                      <div className="font-medium">{emp.companyName}</div>
                      <div className="text-sm text-muted-foreground">{emp.email}</div>
                    </div>
                    <Button size="sm" variant="outline">Verify</Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground">No pending verifications</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}