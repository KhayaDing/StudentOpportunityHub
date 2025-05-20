import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";

export default function AdminListings() {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedOpportunity, setSelectedOpportunity] = useState<any>(null);
  
  const { data: opportunities, isLoading } = useQuery({
    queryKey: ['/api/opportunities'],
    queryFn: async () => {
      const response = await fetch('/api/opportunities?showAll=true');
      if (!response.ok) {
        throw new Error('Failed to fetch opportunities');
      }
      return response.json();
    },
    enabled: isAuthenticated,
  });

  const verifyMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/opportunities/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isVerified: true }),
      });
      if (!response.ok) {
        throw new Error('Failed to verify opportunity');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/opportunities'] });
      toast({
        title: "Opportunity verified",
        description: "The opportunity has been verified successfully",
      });
      setSelectedOpportunity(null);
    },
    onError: () => {
      toast({
        title: "Verification failed",
        description: "There was an error verifying the opportunity",
        variant: "destructive",
      });
    }
  });

  const handleVerify = (id: number) => {
    verifyMutation.mutate(id);
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-full">Loading opportunities...</div>;
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Manage Listings</h1>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Opportunity Listings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {opportunities?.length ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">Title</th>
                      <th className="text-left py-3 px-4">Company</th>
                      <th className="text-left py-3 px-4">Type</th>
                      <th className="text-left py-3 px-4">Status</th>
                      <th className="text-left py-3 px-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {opportunities.map((opp: any) => (
                      <tr key={opp.id} className="border-b">
                        <td className="py-3 px-4">
                          <div className="font-medium">{opp.title}</div>
                          <div className="text-sm text-muted-foreground">{opp.location}</div>
                        </td>
                        <td className="py-3 px-4">{opp.employer?.companyName}</td>
                        <td className="py-3 px-4">
                          <Badge variant="outline">{opp.category}</Badge>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex space-x-2">
                            {opp.isVerified ? (
                              <Badge className="bg-green-100 text-green-800">Verified</Badge>
                            ) : (
                              <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
                            )}
                            {!opp.isActive && (
                              <Badge className="bg-red-100 text-red-800">Inactive</Badge>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex space-x-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => setSelectedOpportunity(opp)}
                            >
                              View
                            </Button>
                            {!opp.isVerified && (
                              <Button 
                                size="sm"
                                onClick={() => handleVerify(opp.id)}
                                disabled={verifyMutation.isPending}
                              >
                                Verify
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">No opportunities found</div>
            )}
          </div>
        </CardContent>
      </Card>

      {selectedOpportunity && (
        <Dialog open={!!selectedOpportunity} onOpenChange={(open) => !open && setSelectedOpportunity(null)}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>{selectedOpportunity.title}</DialogTitle>
              <DialogDescription>
                {selectedOpportunity.employer?.companyName} • {selectedOpportunity.location}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">{selectedOpportunity.category}</Badge>
                <Badge variant="outline">{selectedOpportunity.locationType}</Badge>
                {selectedOpportunity.isVerified ? (
                  <Badge className="bg-green-100 text-green-800">Verified</Badge>
                ) : (
                  <Badge className="bg-yellow-100 text-yellow-800">Pending Verification</Badge>
                )}
              </div>
              
              <div>
                <h3 className="font-medium mb-1">Description</h3>
                <p className="text-sm">{selectedOpportunity.description}</p>
              </div>
              
              <div>
                <h3 className="font-medium mb-1">Requirements</h3>
                <p className="text-sm">{selectedOpportunity.requirements}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium mb-1">Duration</h3>
                  <p className="text-sm">{selectedOpportunity.duration} {selectedOpportunity.durationType}</p>
                </div>
                <div>
                  <h3 className="font-medium mb-1">Hours per week</h3>
                  <p className="text-sm">{selectedOpportunity.hoursPerWeek}</p>
                </div>
              </div>
              
              {selectedOpportunity.skills?.length > 0 && (
                <div>
                  <h3 className="font-medium mb-1">Skills</h3>
                  <div className="flex flex-wrap gap-1">
                    {selectedOpportunity.skills.map((skill: any) => (
                      <Badge key={skill.id} variant="secondary">{skill.name}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              {!selectedOpportunity.isVerified && (
                <Button 
                  onClick={() => handleVerify(selectedOpportunity.id)}
                  disabled={verifyMutation.isPending}
                >
                  Verify Listing
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}