import { Link } from "wouter";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { Opportunity } from "@/types";
import { formatDate, daysRemaining, truncateText } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { SkillBadge } from "@/components/ui/skill-badge";
import { OpportunityStatusBadge } from "@/components/ui/opportunity-status-badge";
import { useAuth } from "@/hooks/useAuth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { saveOpportunity, unsaveOpportunity } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface OpportunityCardProps {
  opportunity: Opportunity;
  saved?: boolean;
  showActions?: boolean;
}

export default function OpportunityCard({ 
  opportunity, 
  saved = false,
  showActions = true
}: OpportunityCardProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const isStudentRole = user?.role === 'student';
  
  const saveOpportunityMutation = useMutation({
    mutationFn: () => saveOpportunity(opportunity.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/opportunities'] });
      queryClient.invalidateQueries({ queryKey: ['/api/opportunities/saved'] });
      queryClient.invalidateQueries({ queryKey: [`/api/opportunities/${opportunity.id}`] });
      toast({
        title: "Opportunity saved",
        description: "The opportunity has been added to your saved list.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save opportunity. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  const unsaveOpportunityMutation = useMutation({
    mutationFn: () => unsaveOpportunity(opportunity.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/opportunities'] });
      queryClient.invalidateQueries({ queryKey: ['/api/opportunities/saved'] });
      queryClient.invalidateQueries({ queryKey: [`/api/opportunities/${opportunity.id}`] });
      toast({
        title: "Opportunity removed",
        description: "The opportunity has been removed from your saved list.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove opportunity. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  const toggleSave = () => {
    if (opportunity.isSaved || saved) {
      unsaveOpportunityMutation.mutate();
    } else {
      saveOpportunityMutation.mutate();
    }
  };
  
  return (
    <Card className="h-full flex flex-col overflow-hidden">
      <div className="bg-gray-200 dark:bg-gray-800 h-40 relative">
        {/* Company logo or placeholder */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-900 p-3 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
        </div>
        
        {/* Location type badge */}
        <div className="absolute top-2 right-2">
          <OpportunityStatusBadge locationType={opportunity.locationType} />
        </div>
      </div>
      
      <CardContent className="flex-1 flex flex-col p-6">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
              {opportunity.title}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {opportunity.company?.companyName}
            </p>
          </div>
          
          {isStudentRole && showActions && (
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSave}
              disabled={saveOpportunityMutation.isPending || unsaveOpportunityMutation.isPending}
            >
              {opportunity.isSaved || saved ? (
                <BookmarkCheck className="h-5 w-5 text-primary-500" />
              ) : (
                <Bookmark className="h-5 w-5" />
              )}
            </Button>
          )}
        </div>
        
        <div className="mt-4 flex-1">
          <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3">
            {truncateText(opportunity.description, 150)}
          </p>
        </div>
        
        <div className="mt-4">
          <div className="flex flex-wrap gap-1 mb-4">
            {opportunity.skills?.slice(0, 3).map((skill) => (
              <SkillBadge key={skill.id} skill={skill} />
            ))}
            {opportunity.skills && opportunity.skills.length > 3 && (
              <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 dark:bg-blue-900/20 dark:text-blue-300">
                +{opportunity.skills.length - 3} more
              </span>
            )}
          </div>
          
          <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
            <div>
              {opportunity.deadline ? (
                <span>Deadline: {daysRemaining(opportunity.deadline)} left</span>
              ) : (
                <span>No deadline specified</span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="border-t p-6 bg-gray-50 dark:bg-gray-900/50 dark:border-gray-800">
        <div className="flex justify-between items-center w-full">
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {opportunity.durationValue && opportunity.durationType ? (
              <span>{opportunity.durationValue} {opportunity.durationType}</span>
            ) : (
              <span>Duration not specified</span>
            )}
          </div>
          <Button asChild>
            <Link href={`/opportunities/${opportunity.id}`}>
              <a>View Details</a>
            </Link>
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
