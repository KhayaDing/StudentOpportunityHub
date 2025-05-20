import { useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { useUserRole } from "@/hooks/useUserRole";
import { useToast } from "@/hooks/use-toast";
import { createOpportunity } from "@/lib/api";
import OpportunityForm from "@/components/employers/OpportunityForm";

export default function CreateOpportunity() {
  // Check if user is employer or admin
  const { hasRequiredRole, isLoading } = useUserRole(['employer', 'admin']);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Create opportunity mutation
  const createOpportunityMutation = useMutation({
    mutationFn: createOpportunity,
    onSuccess: (data) => {
      toast({
        title: "Opportunity created",
        description: "Your opportunity has been created successfully and is pending approval.",
      });
      // Redirect to opportunity detail page
      setLocation(`/opportunities/${data.id}`);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create opportunity. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  // Handle form submission
  const handleSubmit = (data: any) => {
    createOpportunityMutation.mutate(data);
  };
  
  // Redirect if not an employer or admin
  useEffect(() => {
    if (!isLoading && !hasRequiredRole) {
      toast({
        title: "Access denied",
        description: "You must be an employer or admin to create opportunities.",
        variant: "destructive",
      });
      setLocation('/opportunities');
    }
  }, [isLoading, hasRequiredRole, setLocation, toast]);
  
  if (isLoading || !hasRequiredRole) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Create Opportunity</h1>
      </div>
      
      <OpportunityForm
        onSubmit={handleSubmit}
        isSubmitting={createOpportunityMutation.isPending}
      />
    </div>
  );
}
