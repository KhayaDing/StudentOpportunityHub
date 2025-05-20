import { useState } from "react";
import { Link } from "wouter";
import { Application } from "@/types";
import { formatDate } from "@/lib/utils";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ApplicationStatusBadge } from "@/components/ui/application-status-badge";
import { OpportunityStatusBadge } from "@/components/ui/opportunity-status-badge";
import { useAuth } from "@/hooks/useAuth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateApplication } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";

interface ApplicationCardProps {
  application: Application;
  viewType: "student" | "employer";
}

export default function ApplicationCard({
  application,
  viewType,
}: ApplicationCardProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false);
  const [withdrawDialogOpen, setWithdrawDialogOpen] = useState(false);
  const [feedback, setFeedback] = useState(application.feedback || "");
  
  const updateApplicationMutation = useMutation({
    mutationFn: (data: { id: number; status: string; feedback?: string }) => 
      updateApplication(data.id, { status: data.status, feedback: data.feedback }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/applications/student"] });
      queryClient.invalidateQueries({ queryKey: [`/api/applications/opportunity/${application.opportunityId}`] });
      setFeedbackDialogOpen(false);
      setWithdrawDialogOpen(false);
      toast({
        title: "Application updated",
        description: "The application status has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update application. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  const handleStatusUpdate = (status: string) => {
    updateApplicationMutation.mutate({
      id: application.id,
      status,
    });
  };
  
  const handleFeedbackSubmit = () => {
    updateApplicationMutation.mutate({
      id: application.id,
      status: "rejected",
      feedback,
    });
  };
  
  const handleWithdraw = () => {
    updateApplicationMutation.mutate({
      id: application.id,
      status: "withdrawn",
    });
  };
  
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0 h-12 w-12 rounded-md bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                {viewType === "student" 
                  ? application.opportunity?.title 
                  : `${application.student?.user?.firstName} ${application.student?.user?.lastName}`}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {viewType === "student" 
                  ? application.opportunity?.company?.companyName 
                  : application.student?.institution || "Institution not specified"}
              </p>
              <div className="mt-1 flex flex-wrap gap-1">
                {viewType === "student" && application.opportunity?.locationType && (
                  <OpportunityStatusBadge locationType={application.opportunity.locationType} />
                )}
                <ApplicationStatusBadge status={application.status} />
              </div>
            </div>
          </div>
          <div className="mt-4 md:mt-0 text-right">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Applied on: {formatDate(application.appliedAt)}
            </span>
          </div>
        </div>
        
        {application.feedback && (
          <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">Feedback:</h4>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{application.feedback}</p>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="border-t p-6 bg-gray-50 dark:bg-gray-900/50 dark:border-gray-800">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center w-full">
          <div className="text-xs text-gray-500 dark:text-gray-400">
            <span>Application ID: {application.id}</span>
          </div>
          <div className="mt-3 sm:mt-0 flex flex-wrap gap-2">
            <Button variant="outline" asChild>
              <Link href={`/opportunities/${application.opportunityId}`}>
                <a>View Opportunity</a>
              </Link>
            </Button>
            
            {viewType === "student" && application.status === "pending" && (
              <Button 
                variant="destructive" 
                onClick={() => setWithdrawDialogOpen(true)}
                disabled={updateApplicationMutation.isPending}
              >
                Withdraw
              </Button>
            )}
            
            {viewType === "employer" && application.status === "pending" && (
              <>
                <Button 
                  variant="default" 
                  onClick={() => handleStatusUpdate("accepted")}
                  disabled={updateApplicationMutation.isPending}
                >
                  Accept
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setFeedbackDialogOpen(true)}
                  disabled={updateApplicationMutation.isPending}
                >
                  Reject
                </Button>
              </>
            )}
            
            {viewType === "employer" && application.status === "accepted" && !application.certificateId && (
              <Button asChild>
                <Link href={`/certificates/create?applicationId=${application.id}`}>
                  <a>Issue Certificate</a>
                </Link>
              </Button>
            )}
          </div>
        </div>
      </CardFooter>
      
      {/* Reject with Feedback Dialog */}
      <Dialog open={feedbackDialogOpen} onOpenChange={setFeedbackDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Provide Feedback</DialogTitle>
            <DialogDescription>
              Please provide feedback to the applicant explaining why their application was rejected.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Enter feedback for the applicant..."
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            className="min-h-[100px]"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setFeedbackDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleFeedbackSubmit} disabled={updateApplicationMutation.isPending}>
              Submit & Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Withdraw Confirmation Dialog */}
      <AlertDialog open={withdrawDialogOpen} onOpenChange={setWithdrawDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Withdraw Application</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to withdraw your application? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleWithdraw}>
              Withdraw
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
