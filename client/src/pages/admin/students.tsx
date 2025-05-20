import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export default function AdminStudents() {
  const { isAuthenticated } = useAuth();
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  
  const { data: students, isLoading } = useQuery({
    queryKey: ['/api/admin/students'],
    queryFn: async () => {
      // Simplified fetch for prototype - normally we'd have a dedicated admin API endpoint
      const response = await fetch('/api/admin/students');
      if (!response.ok) {
        throw new Error('Failed to fetch students');
      }
      return response.json();
    },
    enabled: isAuthenticated,
  });

  if (isLoading) {
    return <div className="flex items-center justify-center h-full">Loading students data...</div>;
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Manage Students</h1>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Registered Students</CardTitle>
        </CardHeader>
        <CardContent>
          {students?.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Program</TableHead>
                  <TableHead>Year</TableHead>
                  <TableHead>Skills</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((student: any) => (
                  <TableRow key={student.id}>
                    <TableCell>
                      <div className="font-medium">{student.firstName} {student.lastName}</div>
                      <div className="text-sm text-muted-foreground">{student.email}</div>
                    </TableCell>
                    <TableCell>{student.program}</TableCell>
                    <TableCell>{student.yearOfStudy}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {student.skills?.slice(0, 3).map((skill: any) => (
                          <Badge key={skill.id} variant="outline" className="text-xs">
                            {skill.name}
                          </Badge>
                        ))}
                        {student.skills?.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{student.skills.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => setSelectedStudent(student)}
                      >
                        View Profile
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">No students found</div>
          )}
        </CardContent>
      </Card>

      {selectedStudent && (
        <Dialog open={!!selectedStudent} onOpenChange={(open) => !open && setSelectedStudent(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Student Profile</DialogTitle>
              <DialogDescription>
                Viewing details for {selectedStudent.firstName} {selectedStudent.lastName}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium">Contact Information</h3>
                  <div className="mt-1">
                    <p>{selectedStudent.email}</p>
                    <p>{selectedStudent.phone}</p>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium">Academic Information</h3>
                  <div className="mt-1">
                    <p><span className="font-medium">Program:</span> {selectedStudent.program}</p>
                    <p><span className="font-medium">Year:</span> {selectedStudent.yearOfStudy}</p>
                    <p><span className="font-medium">Institution:</span> {selectedStudent.institution}</p>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium">Bio</h3>
                <p className="mt-1 text-sm">{selectedStudent.bio}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium">Skills</h3>
                <div className="mt-1 flex flex-wrap gap-1">
                  {selectedStudent.skills?.map((skill: any) => (
                    <Badge key={skill.id} variant="secondary">
                      {skill.name}
                    </Badge>
                  ))}
                </div>
              </div>
              
              {selectedStudent.cvUrl && (
                <div>
                  <h3 className="text-sm font-medium">Resume/CV</h3>
                  <Button size="sm" variant="outline" className="mt-1" asChild>
                    <a href={selectedStudent.cvUrl} target="_blank" rel="noopener noreferrer">
                      View Resume/CV
                    </a>
                  </Button>
                </div>
              )}
              
              <div>
                <h3 className="text-sm font-medium">Application History</h3>
                {selectedStudent.applications?.length > 0 ? (
                  <div className="mt-1 space-y-2">
                    {selectedStudent.applications.map((app: any) => (
                      <div key={app.id} className="flex justify-between items-center text-sm border-b pb-2">
                        <div>
                          <p className="font-medium">{app.opportunity.title}</p>
                          <p className="text-muted-foreground">{app.opportunity.employer.companyName}</p>
                        </div>
                        <Badge
                          variant={
                            app.status === 'completed' ? 'default' :
                            app.status === 'accepted' ? 'success' :
                            app.status === 'rejected' ? 'destructive' : 'secondary'
                          }
                        >
                          {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-1 text-sm text-muted-foreground">No applications yet</p>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}