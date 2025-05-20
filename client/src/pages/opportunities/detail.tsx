import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Opportunity, Application } from "@/types";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { createApplication, saveOpportunity, unsaveOpportunity, deleteOpportunity } from "@/lib/api";
import { formatDate, formatDuration } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { SkillBadge } from "@/components/ui/skill-badge";
import { OpportunityStatusBadge } from "@/components/ui/opportunity-status-badge";
import { ArrowLeft, Bookmark, BookmarkCheck, Calendar, Clock, MapPin, School, Timer, Trash, Edit, Ban } from "lucide-react";
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

interface OpportunityDetailProps {
  id: string;
}

export default function OpportunityDetail({ id }: OpportunityDetailProps) {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [coverLetter, setCoverLetter] = useState("");
  const [applyDialogOpen, setApplyDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  const opportunityId = parseInt(id);
  
  const isStudent = user?.role === 'student';
  const isEmployer = user?.role === 'employer';
  const isAdmin = user?.role === 'admin';
  
  // Fetch opportunity details
  const {
    data: opportunity,
    isLoading,
    isError,
  } = useQuery<Opportunity>({
    queryKey: [`/api/opportunities/${opportunityId}`],
  });
  
  // Save opportunity mutation
  const saveOpportunityMutation = useMutation({
    mutationFn: () => saveOpportunity(opportunityId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/opportunities/${opportunityId}`] });
      toast({
        title: "Opportunity saved",
        description: "The opportunity has been added to your saved list.",
      });
    },
  });
  
  // Unsave opportunity mutation
  const unsaveOpportunityMutation = useMutation({
    mutationFn: () => unsaveOpportunity(opportunityId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/opportunities/${opportunityId}`] });
      toast({
        title: "Opportunity removed",
        description: "The opportunity has been removed from your saved list.",
      });
    },
  });
  
  // Apply to opportunity mutation
  const applyMutation = useMutation({
    mutationFn: (data: { opportunityId: number; coverLetter: string }) => 
      createApplication(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/opportunities/${opportunityId}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/applications/student'] });
      setApplyDialogOpen(false);
      setCoverLetter("");
      toast({
        title: "Application submitted",
        description: "Your application has been submitted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to submit application. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  // Delete opportunity mutation
  const deleteOpportunityMutation = useMutation({
    mutationFn: () => deleteOpportunity(opportunityId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/opportunities'] });
      setDeleteDialogOpen(false);
      toast({
        title: "Opportunity deleted",
        description: "The opportunity has been deleted successfully.",
      });
      setLocation('/opportunities');
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete opportunity. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  const handleToggleSave = () => {
    if (opportunity?.isSaved) {
      unsaveOpportunityMutation.mutate();
    } else {
      saveOpportunityMutation.mutate();
    }
  };
  
  const handleApply = () => {
    applyMutation.mutate({
      opportunityId,
      coverLetter,
    });
  };
  
  const handleDelete = () => {
    deleteOpportunityMutation.mutate();
  };
  
  // Check if the current employer owns this opportunity
  const isOwner = 
    isEmployer && 
    opportunity?.employer?.userId === user?.id;
  
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center">
          <Button variant="ghost" className="gap-1">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </div>
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }
  
  if (isError || !opportunity) {
    return (
      <div className="space-y-6">
        <div className="flex items-center">
          <Button variant="ghost" className="gap-1" asChild>
            <Link href="/opportunities">
              <a>
                <ArrowLeft className="h-4 w-4" />
                Back to Opportunities
              </a>
            </Link>
          </Button>
        </div>
        <Card>
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-bold">Opportunity not found</h2>
            <p className="mt-2 text-gray-500">
              The opportunity you're looking for doesn't exist or has been removed.
            </p>
            <Button className="mt-4" asChild>
              <Link href="/opportunities">
                <a>Browse Opportunities</a>
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Button variant="ghost" className="gap-1" asChild>
          <Link href="/opportunities">
            <a>
              <ArrowLeft className="h-4 w-4" />
              Back to Opportunities
            </a>
          </Link>
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <div className="h-48 bg-gray-200 dark:bg-gray-800 relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-white dark:bg-gray-900 p-6 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
              </div>
            </div>
            
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-2xl font-bold">{opportunity.title}</h1>
                    <OpportunityStatusBadge locationType={opportunity.locationType} />
                    {!opportunity.isActive && (
                      <Badge variant="destructive">Inactive</Badge>
                    )}
                    {!opportunity.isVerified && (
                      <Badge variant="outline" className="bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300">
                        Pending Verification
                      </Badge>
                    )}
                  </div>
                  <p className="text-lg text-muted-foreground mt-1">{opportunity.company?.companyName}</p>
                </div>
                
                <div className="flex space-x-2">
                  {isStudent && (
                    <Button
                      variant="outline"
                      className="gap-1"
                      onClick={handleToggleSave}
                      disabled={saveOpportunityMutation.isPending || unsaveOpportunityMutation.isPending}
                    >
                      {opportunity.isSaved ? (
                        <>
                          <BookmarkCheck className="h-5 w-5 text-primary-500" />
                          Saved
                        </>
                      ) : (
                        <>
                          <Bookmark className="h-5 w-5" />
                          Save
                        </>
                      )}
                    </Button>
                  )}
                  
                  {(isOwner || isAdmin) && (
                    <>
                      <Button variant="outline" className="gap-1" asChild>
                        <Link href={`/opportunities/edit/${opportunity.id}`}>
                          <a>
                            <Edit className="h-4 w-4" />
                            Edit
                          </a>
                        </Link>
                      </Button>
                      
                      <Button variant="destructive" className="gap-1" onClick={() => setDeleteDialogOpen(true)}>
                        <Trash className="h-4 w-4" />
                        Delete
                      </Button>
                    </>
                  )}
                </div>
              </div>
              
              <Tabs defaultValue="description" className="mt-6">
                <TabsList>
                  <TabsTrigger value="description">Description</TabsTrigger>
                  <TabsTrigger value="company">About Company</TabsTrigger>
                </TabsList>
                
                <TabsContent value="description" className="mt-4 space-y-6">
                  <div className="prose dark:prose-invert max-w-none">
                    <h3>About the Opportunity</h3>
                    <p>{opportunity.description}</p>
                    
                    {opportunity.skills && opportunity.skills.length > 0 && (
                      <>
                        <h3>Required Skills</h3>
                        <div className="flex flex-wrap gap-2 not-prose">
                          {opportunity.skills.map((skill) => (
                            <SkillBadge key={skill.id} skill={skill} />
                          ))}
                        </div>
                      </>
                    )}
                    
                    {opportunity.requiredProgram && (
                      <>
                        <h3>Required Program</h3>
                        <p>{opportunity.requiredProgram}</p>
                      </>
                    )}
                    
                    {opportunity.preferredYear && (
                      <>
                        <h3>Preferred Year of Study</h3>
                        <p>{opportunity.preferredYear}{getYearSuffix(opportunity.preferredYear)} Year or higher</p>
                      </>
                    )}
                    
                    {opportunity.stipend && (
                      <>
                        <h3>Stipend/Compensation</h3>
                        <p>{opportunity.stipend}</p>
                      </>
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="company" className="mt-4 space-y-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-16 w-16 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                      {opportunity.company?.logoUrl ? (
                        <img 
                          src={opportunity.company.logoUrl} 
                          alt={opportunity.company.companyName} 
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      )}
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-medium">{opportunity.company?.companyName}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {opportunity.company?.industry || "Industry not specified"}
                      </p>
                    </div>
                  </div>
                  
                  {opportunity.company?.description && (
                    <div>
                      <h4 className="text-sm font-medium mb-1">About</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {opportunity.company.description}
                      </p>
                    </div>
                  )}
                  
                  {opportunity.company?.location && (
                    <div className="flex items-start">
                      <MapPin className="h-5 w-5 text-gray-400 mr-2" />
                      <div>
                        <h4 className="text-sm font-medium">Location</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          {opportunity.company.location}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {opportunity.company?.website && (
                    <div>
                      <h4 className="text-sm font-medium mb-1">Website</h4>
                      <a 
                        href={opportunity.company.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-primary-600 hover:underline dark:text-primary-400"
                      >
                        {opportunity.company.website.replace(/^https?:\/\//, '')}
                      </a>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
          
          {/* Similar Opportunities would go here */}
        </div>
        
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6 space-y-6">
              <h3 className="font-medium">Opportunity Details</h3>
              
              <div className="space-y-4">
                <div className="flex items-start">
                  <Clock className="h-5 w-5 text-gray-400 mr-2" />
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Application Deadline</p>
                    <p className="text-sm text-gray-900 dark:text-gray-100">
                      {opportunity.deadline ? formatDate(opportunity.deadline) : "No deadline specified"}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <Calendar className="h-5 w-5 text-gray-400 mr-2" />
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Start Date</p>
                    <p className="text-sm text-gray-900 dark:text-gray-100">
                      {opportunity.startDate ? formatDate(opportunity.startDate) : "Not specified"}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <Timer className="h-5 w-5 text-gray-400 mr-2" />
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Duration</p>
                    <p className="text-sm text-gray-900 dark:text-gray-100">
                      {opportunity.durationValue && opportunity.durationType
                        ? formatDuration(opportunity.durationValue, opportunity.durationType)
                        : "Not specified"}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <MapPin className="h-5 w-5 text-gray-400 mr-2" />
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Location</p>
                    <p className="text-sm text-gray-900 dark:text-gray-100">
                      {opportunity.locationType === 'remote'
                        ? "Remote"
                        : opportunity.location || "Location not specified"}
                      {opportunity.locationType === 'hybrid' && " (Hybrid)"}
                    </p>
                  </div>
                </div>
                
                {(opportunity.requiredProgram || opportunity.preferredYear) && (
                  <div className="flex items-start">
                    <School className="h-5 w-5 text-gray-400 mr-2" />
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Requirements
                      </p>
                      <p className="text-sm text-gray-900 dark:text-gray-100">
                        {opportunity.requiredProgram && (
                          <span className="block">Program: {opportunity.requiredProgram}</span>
                        )}
                        {opportunity.preferredYear && (
                          <span className="block">Year: {opportunity.preferredYear}{getYearSuffix(opportunity.preferredYear)} Year or higher</span>
                        )}
                      </p>
                    </div>
                  </div>
                )}
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <h3 className="font-medium">Application Status</h3>
                {isStudent ? (
                  opportunity.hasApplied ? (
                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-md">
                      <p className="text-sm font-medium mb-1">
                        You have already applied for this opportunity
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Current status: 
                        <span className={`font-medium ml-1 ${
                          opportunity.applicationStatus === 'pending'
                            ? 'text-amber-600 dark:text-amber-400'
                            : opportunity.applicationStatus === 'accepted'
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-red-600 dark:text-red-400'
                        }`}>
                          {opportunity.applicationStatus?.charAt(0).toUpperCase()}{opportunity.applicationStatus?.slice(1)}
                        </span>
                      </p>
                      <Button className="w-full mt-4" asChild>
                        <Link href="/applications">
                          <a>View Your Applications</a>
                        </Link>
                      </Button>
                    </div>
                  ) : (
                    <Button
                      className="w-full" 
                      onClick={() => setApplyDialogOpen(true)}
                      disabled={!opportunity.isActive || !opportunity.isVerified}
                    >
                      Apply Now
                    </Button>
                  )
                ) : isOwner || isAdmin ? (
                  <Button className="w-full" asChild>
                    <Link href={`/applications/opportunity/${opportunity.id}`}>
                      <a>View Applications</a>
                    </Link>
                  </Button>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    You need to be logged in as a student to apply for this opportunity.
                  </p>
                )}
              </div>
              
              {(!opportunity.isActive || !opportunity.isVerified) && isStudent && (
                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-md text-amber-800 dark:text-amber-200 text-sm">
                  <div className="flex items-center mb-1">
                    <Ban className="h-4 w-4 mr-1" />
                    <p className="font-medium">
                      {!opportunity.isActive 
                        ? "This opportunity is currently inactive" 
                        : "This opportunity is awaiting verification"}
                    </p>
                  </div>
                  <p>
                    You cannot apply for this opportunity at the moment. Please check back later.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Apply Dialog */}
      <Dialog open={applyDialogOpen} onOpenChange={setApplyDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Apply for {opportunity.title}</DialogTitle>
            <DialogDescription>
              Submit your application for this opportunity at {opportunity.company?.companyName}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Cover Letter (Optional)</label>
              <Textarea
                placeholder="Tell the employer why you're interested in this opportunity and why you're a good fit..."
                className="min-h-[200px]"
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                A good cover letter can help you stand out from other applicants.
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setApplyDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleApply}
              disabled={applyMutation.isPending}
            >
              {applyMutation.isPending ? "Submitting..." : "Submit Application"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the opportunity
              and all associated applications.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 text-white hover:bg-red-700 dark:bg-red-900 dark:text-red-100 dark:hover:bg-red-800"
            >
              {deleteOpportunityMutation.isPending ? "Deleting..." : "Delete Opportunity"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Helper function to get the suffix for the year
function getYearSuffix(year: number): string {
  if (year === 1) return "st";
  if (year === 2) return "nd";
  if (year === 3) return "rd";
  return "th";
}
