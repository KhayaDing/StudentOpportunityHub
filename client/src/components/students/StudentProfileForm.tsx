import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { StudentProfile, Skill } from "@/types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { FileUpload } from "@/components/ui/file-upload";
import { X } from "lucide-react";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const studentProfileSchema = z.object({
  institution: z.string().min(1, { message: "Institution is required" }),
  program: z.string().min(1, { message: "Program/Field of study is required" }),
  yearOfStudy: z.string().min(1, { message: "Year of study is required" }),
  bio: z.string().optional(),
  cv: z.instanceof(File).optional().nullable(),
  isProfileVisible: z.boolean().default(true),
});

type StudentProfileFormValues = z.infer<typeof studentProfileSchema>;

interface StudentProfileFormProps {
  profile?: StudentProfile;
  onSubmit: (data: FormData) => void;
  isSubmitting: boolean;
}

export default function StudentProfileForm({
  profile,
  onSubmit,
  isSubmitting,
}: StudentProfileFormProps) {
  const [selectedSkills, setSelectedSkills] = useState<number[]>(
    profile?.skills?.map((skill) => skill.id) || []
  );
  const [searchTerm, setSearchTerm] = useState("");
  
  // Fetch all available skills
  const { data: skills, isLoading: isLoadingSkills } = useQuery<Skill[]>({
    queryKey: ["/api/skills"],
  });
  
  // Initialize form with profile data if available
  const form = useForm<StudentProfileFormValues>({
    resolver: zodResolver(studentProfileSchema),
    defaultValues: {
      institution: profile?.institution || "",
      program: profile?.program || "",
      yearOfStudy: profile?.yearOfStudy?.toString() || "",
      bio: profile?.bio || "",
      isProfileVisible: profile?.isProfileVisible !== undefined ? profile.isProfileVisible : true,
      cv: null,
    },
  });
  
  const handleSubmit = (values: StudentProfileFormValues) => {
    const formData = new FormData();
    
    // Add profile data as JSON
    const profileData = {
      ...values,
      yearOfStudy: parseInt(values.yearOfStudy),
      skills: selectedSkills,
    };
    
    formData.append("data", JSON.stringify(profileData));
    
    // Add CV file if provided
    if (values.cv) {
      formData.append("cv", values.cv);
    }
    
    onSubmit(formData);
  };
  
  const toggleSkill = (skillId: number) => {
    setSelectedSkills((prev) =>
      prev.includes(skillId)
        ? prev.filter((id) => id !== skillId)
        : [...prev, skillId]
    );
  };
  
  const removeSkill = (skillId: number) => {
    setSelectedSkills((prev) => prev.filter((id) => id !== skillId));
  };
  
  // Filter skills based on search term
  const filteredSkills = skills?.filter((skill) =>
    skill.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>Student Profile</CardTitle>
            <CardDescription>
              Complete your profile to improve matching with opportunities
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Academic Information</h3>
              
              <FormField
                control={form.control}
                name="institution"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Institution *</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your institution" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Sol Plaatje University">Sol Plaatje University</SelectItem>
                        <SelectItem value="Northern Cape TVET College">Northern Cape TVET College</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="program"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Program/Field of Study *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g., Computer Science, Business Administration" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="yearOfStudy"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Year of Study *</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your year of study" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="1">1st Year</SelectItem>
                        <SelectItem value="2">2nd Year</SelectItem>
                        <SelectItem value="3">3rd Year</SelectItem>
                        <SelectItem value="4">4th Year</SelectItem>
                        <SelectItem value="5">Postgraduate</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Profile Information</h3>
              
              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bio (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Tell employers a bit about yourself, your interests, and career goals..." 
                        className="min-h-[120px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="cv"
                render={({ field: { value, onChange, ...fieldProps } }) => (
                  <FormItem>
                    <FormLabel>CV/Resume (Optional)</FormLabel>
                    <FormControl>
                      <FileUpload
                        value={value}
                        onChange={onChange}
                        accept=".pdf,.doc,.docx"
                        maxSize={MAX_FILE_SIZE}
                        {...fieldProps}
                      />
                    </FormControl>
                    <FormDescription>
                      Upload your CV in PDF, DOC, or DOCX format (max 5MB)
                    </FormDescription>
                    <FormMessage />
                    {profile?.cvUrl && !value && (
                      <div className="text-sm text-muted-foreground">
                        Current CV: <a href={profile.cvUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">View uploaded CV</a>
                      </div>
                    )}
                  </FormItem>
                )}
              />
              
              <div className="space-y-2">
                <FormLabel>Skills</FormLabel>
                <div className="flex flex-wrap gap-2 mb-2">
                  {selectedSkills.length > 0 && skills ? (
                    selectedSkills.map((skillId) => {
                      const skill = skills.find((s) => s.id === skillId);
                      return skill ? (
                        <Badge key={skill.id} variant="secondary" className="gap-1">
                          {skill.name}
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-4 w-4 p-0 ml-1"
                            onClick={() => removeSkill(skill.id)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </Badge>
                      ) : null;
                    })
                  ) : (
                    <p className="text-sm text-muted-foreground">Add your skills to help match with opportunities</p>
                  )}
                </div>
                
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" type="button" size="sm">
                      Add Skills
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-3">
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Select Skills</h4>
                      <Input
                        placeholder="Search skills..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="mb-2"
                      />
                      <div className="max-h-48 overflow-y-auto space-y-1">
                        {isLoadingSkills ? (
                          <p className="text-sm text-center text-muted-foreground">Loading skills...</p>
                        ) : filteredSkills?.length === 0 ? (
                          <p className="text-sm text-center text-muted-foreground">No skills found</p>
                        ) : (
                          filteredSkills?.map((skill) => (
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
                          ))
                        )}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
              
              <FormField
                control={form.control}
                name="isProfileVisible"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Profile Visibility
                      </FormLabel>
                      <FormDescription>
                        Allow employers to find and contact you based on your profile and skills
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => window.history.back()}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Profile"}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
}
