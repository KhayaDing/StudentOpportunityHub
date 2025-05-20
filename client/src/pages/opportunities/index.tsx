import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Opportunity, Skill } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import OpportunityCard from "@/components/shared/OpportunityCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Filter, Search, SlidersHorizontal, SortDesc } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export default function Opportunities() {
  const { user } = useAuth();
  const isEmployer = user?.role === 'employer';
  
  // Filter states
  const [category, setCategory] = useState<string>("");
  const [locationType, setLocationType] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedSkills, setSelectedSkills] = useState<number[]>([]);
  const [filterApplied, setFilterApplied] = useState(false);
  
  // Fetch all opportunities
  const {
    data: opportunities,
    isLoading: isLoadingOpportunities,
    refetch,
  } = useQuery<Opportunity[]>({
    queryKey: ['/api/opportunities', { category, locationType, skills: selectedSkills, search: searchTerm }],
  });
  
  // Fetch all skills for filtering
  const { data: skills, isLoading: isLoadingSkills } = useQuery<Skill[]>({
    queryKey: ['/api/skills'],
  });
  
  // Apply filters
  const applyFilters = () => {
    setFilterApplied(true);
    refetch();
  };
  
  // Reset filters
  const resetFilters = () => {
    setCategory("");
    setLocationType("");
    setSearchTerm("");
    setSelectedSkills([]);
    setFilterApplied(false);
  };
  
  // Toggle skill selection
  const toggleSkill = (skillId: number) => {
    setSelectedSkills(prev => 
      prev.includes(skillId)
        ? prev.filter(id => id !== skillId)
        : [...prev, skillId]
    );
  };
  
  // Search on enter key
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      applyFilters();
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Opportunities</h1>
        
        {isEmployer && (
          <Link href="/opportunities/create">
            <Button>Post New Opportunity</Button>
          </Link>
        )}
      </div>
      
      {/* Desktop filter bar */}
      <Card className="hidden md:block">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[240px]">
              <Input
                placeholder="Search opportunities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                className="w-full"
                icon={<Search className="h-4 w-4" />}
              />
            </div>
            
            <div className="w-[180px]">
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Categories</SelectItem>
                  <SelectItem value="Software Development">Software Development</SelectItem>
                  <SelectItem value="Marketing">Marketing</SelectItem>
                  <SelectItem value="Business">Business</SelectItem>
                  <SelectItem value="Design">Design</SelectItem>
                  <SelectItem value="Community Service">Community Service</SelectItem>
                  <SelectItem value="Research">Research</SelectItem>
                  <SelectItem value="Education">Education</SelectItem>
                  <SelectItem value="Healthcare">Healthcare</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="w-[180px]">
              <Select value={locationType} onValueChange={setLocationType}>
                <SelectTrigger>
                  <SelectValue placeholder="Location Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Locations</SelectItem>
                  <SelectItem value="remote">Remote</SelectItem>
                  <SelectItem value="in-person">In-Person</SelectItem>
                  <SelectItem value="hybrid">Hybrid</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="gap-1">
                  <SlidersHorizontal className="h-4 w-4" />
                  Skills
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Filter by Skills</SheetTitle>
                  <SheetDescription>
                    Select the skills you're looking for
                  </SheetDescription>
                </SheetHeader>
                <div className="py-4">
                  <div className="grid grid-cols-1 gap-3 max-h-[70vh] overflow-y-auto">
                    {isLoadingSkills ? (
                      Array(8).fill(0).map((_, i) => (
                        <Skeleton key={i} className="h-6 w-full" />
                      ))
                    ) : skills?.map((skill) => (
                      <div key={skill.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`skill-${skill.id}`}
                          checked={selectedSkills.includes(skill.id)}
                          onCheckedChange={() => toggleSkill(skill.id)}
                        />
                        <label
                          htmlFor={`skill-${skill.id}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          {skill.name}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex justify-between mt-4">
                  <Button variant="outline" onClick={() => setSelectedSkills([])}>
                    Clear
                  </Button>
                  <Button onClick={applyFilters}>Apply</Button>
                </div>
              </SheetContent>
            </Sheet>
            
            <div className="flex gap-2 ml-auto">
              <Button variant="outline" onClick={resetFilters} disabled={!filterApplied}>
                Reset
              </Button>
              <Button onClick={applyFilters}>
                Apply Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Mobile filter bar */}
      <div className="flex md:hidden gap-2">
        <Input
          placeholder="Search opportunities..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={handleSearchKeyDown}
          className="flex-1"
        />
        
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Filter Opportunities</SheetTitle>
              <SheetDescription>
                Refine your search with these filters
              </SheetDescription>
            </SheetHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Category</label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Categories</SelectItem>
                    <SelectItem value="Software Development">Software Development</SelectItem>
                    <SelectItem value="Marketing">Marketing</SelectItem>
                    <SelectItem value="Business">Business</SelectItem>
                    <SelectItem value="Design">Design</SelectItem>
                    <SelectItem value="Community Service">Community Service</SelectItem>
                    <SelectItem value="Research">Research</SelectItem>
                    <SelectItem value="Education">Education</SelectItem>
                    <SelectItem value="Healthcare">Healthcare</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Location Type</label>
                <Select value={locationType} onValueChange={setLocationType}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Locations" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Locations</SelectItem>
                    <SelectItem value="remote">Remote</SelectItem>
                    <SelectItem value="in-person">In-Person</SelectItem>
                    <SelectItem value="hybrid">Hybrid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Skills</label>
                <div className="grid grid-cols-1 gap-2 max-h-[40vh] overflow-y-auto">
                  {isLoadingSkills ? (
                    Array(8).fill(0).map((_, i) => (
                      <Skeleton key={i} className="h-6 w-full" />
                    ))
                  ) : skills?.map((skill) => (
                    <div key={skill.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`mobile-skill-${skill.id}`}
                        checked={selectedSkills.includes(skill.id)}
                        onCheckedChange={() => toggleSkill(skill.id)}
                      />
                      <label
                        htmlFor={`mobile-skill-${skill.id}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {skill.name}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-between">
              <Button variant="outline" onClick={resetFilters}>
                Reset
              </Button>
              <Button onClick={() => {
                applyFilters();
                document.querySelector<HTMLButtonElement>(".close-sheet-button")?.click();
              }}>
                Apply Filters
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
      
      {/* Results count and sorting */}
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          {isLoadingOpportunities ? (
            <Skeleton className="h-5 w-32" />
          ) : (
            `${opportunities?.length || 0} opportunities found`
          )}
        </p>
        
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Sort by:</span>
          <Select defaultValue="latest">
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="latest">Newest First</SelectItem>
              <SelectItem value="deadline">Deadline (Soonest)</SelectItem>
              <SelectItem value="a-z">A-Z</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {/* Opportunities Grid */}
      {isLoadingOpportunities ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array(6).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-[400px] w-full" />
          ))}
        </div>
      ) : opportunities?.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <Search className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium">No opportunities found</h3>
            <p className="text-sm text-muted-foreground mt-2">
              {filterApplied
                ? "Try adjusting your filters or search term"
                : "Check back later for new opportunities"}
            </p>
            {filterApplied && (
              <Button className="mt-4" onClick={resetFilters}>
                Clear Filters
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {opportunities.map((opportunity) => (
            <OpportunityCard key={opportunity.id} opportunity={opportunity} />
          ))}
        </div>
      )}
      
      {/* Pagination */}
      {!isLoadingOpportunities && opportunities?.length > 0 && (
        <div className="flex justify-center mt-8">
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="icon" disabled>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Button>
            <Button variant="outline" className="h-9 w-9">1</Button>
            <Button variant="outline" className="h-9 w-9" disabled>2</Button>
            <Button variant="outline" size="icon" disabled>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
