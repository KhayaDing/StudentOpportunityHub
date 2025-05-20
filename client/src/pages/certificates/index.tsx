import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Certificate } from "@/types";
import { useUserRole } from "@/hooks/useUserRole";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/utils";
import { Award, Download, FileX } from "lucide-react";

export default function Certificates() {
  // Check authentication
  useUserRole();
  
  // State for search term
  const [searchTerm, setSearchTerm] = useState("");
  
  // Fetch certificates
  const { data: certificates, isLoading } = useQuery<Certificate[]>({
    queryKey: ["/api/certificates/student"],
  });
  
  // Filter certificates by search term
  const filteredCertificates = certificates?.filter(
    (cert) =>
      cert.opportunityTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cert.employerName.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Certificates</h1>
      </div>
      
      {/* Search and filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search certificates..."
            className="w-full p-2 pl-9 border rounded-md"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 absolute left-2 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>
      
      {/* Certificates grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array(6).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-[280px] w-full" />
          ))}
        </div>
      ) : !certificates || certificates.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <FileX className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium">No certificates found</h3>
            <p className="text-sm text-muted-foreground mt-2">
              You don't have any certificates yet. Complete an internship or volunteering opportunity to receive a certificate.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCertificates?.map((certificate) => (
            <Card key={certificate.id} className="overflow-hidden flex flex-col">
              <div className="bg-primary-50 dark:bg-primary-900/20 h-40 flex items-center justify-center">
                <div className="text-primary-600 dark:text-primary-400">
                  <Award className="h-20 w-20 mx-auto" />
                </div>
              </div>
              
              <CardContent className="p-6 flex-1 flex flex-col">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                    {certificate.opportunityTitle}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {certificate.employerName}
                  </p>
                </div>
                
                <div className="mt-4 flex-1 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Issued On:</span>
                    <span className="font-medium">{formatDate(certificate.issuedAt)}</span>
                  </div>
                  
                  {certificate.startDate && certificate.endDate && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500 dark:text-gray-400">Duration:</span>
                      <span className="font-medium">
                        {formatDate(certificate.startDate)} - {formatDate(certificate.endDate)}
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="mt-4">
                  <Button className="w-full flex items-center justify-center gap-2" asChild>
                    <a 
                      href={certificate.pdfUrl || "#"} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      download
                    >
                      <Download className="h-4 w-4" />
                      Download Certificate
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
