import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export default function AdminEmployers() {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: employers, isLoading } = useQuery({
    queryKey: ['/api/admin/employers'],
    enabled: isAuthenticated,
  });

  const verifyMutation = useMutation({
    mutationFn: async (employerId: number) => {
      const response = await fetch(`/api/admin/employers/${employerId}/verify`, {
        method: 'PUT',
      });
      if (!response.ok) {
        throw new Error('Failed to verify employer');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/employers'] });
      toast({
        title: "Employer verified",
        description: "The employer has been verified successfully",
      });
    },
    onError: () => {
      toast({
        title: "Verification failed",
        description: "There was an error verifying the employer",
        variant: "destructive",
      });
    }
  });

  const handleVerify = (id: number) => {
    verifyMutation.mutate(id);
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-full">Loading employers...</div>;
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Manage Employers</h1>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Employers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {employers?.length ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">Company</th>
                      <th className="text-left py-3 px-4">Contact</th>
                      <th className="text-left py-3 px-4">Industry</th>
                      <th className="text-left py-3 px-4">Status</th>
                      <th className="text-left py-3 px-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employers.map((employer: any) => (
                      <tr key={employer.id} className="border-b">
                        <td className="py-3 px-4">
                          <div className="font-medium">{employer.companyName}</div>
                          <div className="text-sm text-muted-foreground">{employer.website}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div>{employer.firstName} {employer.lastName}</div>
                          <div className="text-sm text-muted-foreground">{employer.email}</div>
                        </td>
                        <td className="py-3 px-4">{employer.industry}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded text-xs ${employer.isVerified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                            {employer.isVerified ? 'Verified' : 'Pending'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {!employer.isVerified && (
                            <Button 
                              size="sm" 
                              onClick={() => handleVerify(employer.id)}
                              disabled={verifyMutation.isPending}
                            >
                              Verify
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">No employers found</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}