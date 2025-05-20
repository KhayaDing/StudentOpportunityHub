import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { sessionMiddleware, login, register, logout, getCurrentUser, requireAuth, requireRole } from "./auth";
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import { generateCertificatePDF } from "./utils/pdf";
import { z } from "zod";
import { 
  insertStudentProfileSchema, 
  insertEmployerProfileSchema,
  insertOpportunitySchema,
  insertApplicationSchema,
  insertCertificateSchema
} from "@shared/schema";

// Configure multer for file uploads
const storage_dir = path.join(process.cwd(), 'uploads');

// Ensure uploads directory exists
async function ensureUploadDirExists() {
  try {
    await fs.mkdir(storage_dir, { recursive: true });
  } catch (err) {
    console.error('Error creating uploads directory:', err);
  }
}

ensureUploadDirExists();

const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, storage_dir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({ 
  storage: fileStorage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // For CV: allow PDF, DOC, DOCX
    if (file.fieldname === 'cv') {
      if (
        file.mimetype === 'application/pdf' ||
        file.mimetype === 'application/msword' ||
        file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ) {
        cb(null, true);
      } else {
        cb(new Error('Only PDF, DOC, and DOCX files are allowed for CV'));
      }
    } 
    // For images: allow JPEG, PNG, SVG
    else if (file.fieldname === 'profileImage' || file.fieldname === 'logo') {
      if (
        file.mimetype === 'image/jpeg' ||
        file.mimetype === 'image/png' ||
        file.mimetype === 'image/svg+xml'
      ) {
        cb(null, true);
      } else {
        cb(new Error('Only JPEG, PNG, and SVG images are allowed'));
      }
    } else {
      cb(null, false);
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup session middleware
  app.use(sessionMiddleware);

  // Auth routes
  app.post('/api/auth/login', login);
  app.post('/api/auth/register', register);
  app.post('/api/auth/logout', logout);
  app.get('/api/auth/me', getCurrentUser);

  // Skills routes
  app.get('/api/skills', async (req: Request, res: Response) => {
    try {
      const skills = await storage.getAllSkills();
      res.status(200).json(skills);
    } catch (error) {
      console.error('Error fetching skills:', error);
      res.status(500).json({ message: 'Error fetching skills' });
    }
  });

  // Student profile routes
  app.get('/api/students/profile', requireAuth, requireRole(['student']), async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId!;
      const profile = await storage.getStudentWithSkills(userId);
      
      if (!profile) {
        return res.status(404).json({ message: 'Student profile not found' });
      }
      
      res.status(200).json(profile);
    } catch (error) {
      console.error('Error fetching student profile:', error);
      res.status(500).json({ message: 'Error fetching student profile' });
    }
  });

  app.put('/api/students/profile', requireAuth, requireRole(['student']), upload.single('cv'), async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId!;
      
      // Parse form data
      const data = JSON.parse(req.body.data || '{}');
      
      // Validate
      const validation = insertStudentProfileSchema.partial().safeParse(data);
      if (!validation.success) {
        return res.status(400).json({ message: 'Invalid profile data', errors: validation.error.format() });
      }
      
      // Add file URL if uploaded
      if (req.file) {
        data.cvUrl = `/uploads/${req.file.filename}`;
      }
      
      // Update profile
      const updatedProfile = await storage.updateStudentProfile(userId, data);
      
      if (!updatedProfile) {
        return res.status(404).json({ message: 'Student profile not found' });
      }
      
      // Update skills if provided
      if (data.skills && Array.isArray(data.skills)) {
        await storage.addSkillsToStudent(updatedProfile.id, data.skills);
      }
      
      // Get updated profile with skills
      const profile = await storage.getStudentWithSkills(userId);
      
      res.status(200).json(profile);
    } catch (error) {
      console.error('Error updating student profile:', error);
      res.status(500).json({ message: 'Error updating student profile' });
    }
  });

  // Skills management for students
  app.post('/api/students/skills', requireAuth, requireRole(['student']), async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId!;
      const { skillIds } = req.body;
      
      if (!Array.isArray(skillIds)) {
        return res.status(400).json({ message: 'Invalid skill data' });
      }
      
      const profile = await storage.getStudentProfile(userId);
      if (!profile) {
        return res.status(404).json({ message: 'Student profile not found' });
      }
      
      await storage.addSkillsToStudent(profile.id, skillIds);
      
      const updatedProfile = await storage.getStudentWithSkills(userId);
      res.status(200).json(updatedProfile);
    } catch (error) {
      console.error('Error adding skills:', error);
      res.status(500).json({ message: 'Error adding skills' });
    }
  });

  app.delete('/api/students/skills/:skillId', requireAuth, requireRole(['student']), async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId!;
      const skillId = parseInt(req.params.skillId);
      
      if (isNaN(skillId)) {
        return res.status(400).json({ message: 'Invalid skill ID' });
      }
      
      const profile = await storage.getStudentProfile(userId);
      if (!profile) {
        return res.status(404).json({ message: 'Student profile not found' });
      }
      
      await storage.removeSkillFromStudent(profile.id, skillId);
      
      const updatedProfile = await storage.getStudentWithSkills(userId);
      res.status(200).json(updatedProfile);
    } catch (error) {
      console.error('Error removing skill:', error);
      res.status(500).json({ message: 'Error removing skill' });
    }
  });

  // Employer profile routes
  app.get('/api/employers/profile', requireAuth, requireRole(['employer']), async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId!;
      const profile = await storage.getEmployerProfile(userId);
      
      if (!profile) {
        return res.status(404).json({ message: 'Employer profile not found' });
      }
      
      const user = await storage.getUser(userId);
      
      res.status(200).json({
        ...profile,
        email: user?.email,
        firstName: user?.firstName,
        lastName: user?.lastName,
      });
    } catch (error) {
      console.error('Error fetching employer profile:', error);
      res.status(500).json({ message: 'Error fetching employer profile' });
    }
  });

  app.put('/api/employers/profile', requireAuth, requireRole(['employer']), upload.single('logo'), async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId!;
      
      // Parse form data
      const data = JSON.parse(req.body.data || '{}');
      
      // Validate
      const validation = insertEmployerProfileSchema.partial().safeParse(data);
      if (!validation.success) {
        return res.status(400).json({ message: 'Invalid profile data', errors: validation.error.format() });
      }
      
      // Add file URL if uploaded
      if (req.file) {
        data.logoUrl = `/uploads/${req.file.filename}`;
      }
      
      // Update profile
      const updatedProfile = await storage.updateEmployerProfile(userId, data);
      
      if (!updatedProfile) {
        return res.status(404).json({ message: 'Employer profile not found' });
      }
      
      const user = await storage.getUser(userId);
      
      res.status(200).json({
        ...updatedProfile,
        email: user?.email,
        firstName: user?.firstName,
        lastName: user?.lastName,
      });
    } catch (error) {
      console.error('Error updating employer profile:', error);
      res.status(500).json({ message: 'Error updating employer profile' });
    }
  });

  // Opportunity routes
  app.get('/api/opportunities', async (req: Request, res: Response) => {
    try {
      const filters: any = {
        isActive: true,
        isVerified: true,
      };
      
      // Parse filters from query params
      if (req.query.category) filters.category = req.query.category as string;
      if (req.query.locationType) filters.locationType = req.query.locationType as string;
      if (req.query.search) filters.search = req.query.search as string;
      
      // Skills filter (comma-separated list of skill IDs)
      if (req.query.skills) {
        const skillIds = (req.query.skills as string).split(',').map(id => parseInt(id));
        if (skillIds.some(id => !isNaN(id))) {
          filters.skills = skillIds.filter(id => !isNaN(id));
        }
      }
      
      // For employer, show their own opportunities regardless of active/verified status
      if (req.session.userId && req.session.role === 'employer') {
        const employerProfile = await storage.getEmployerProfile(req.session.userId);
        if (employerProfile) {
          filters.employerId = employerProfile.id;
          // Allow employers to see all their opportunities
          delete filters.isActive;
          delete filters.isVerified;
        }
      }
      
      // For admin, show all if needed
      if (req.session.userId && req.session.role === 'admin') {
        if (req.query.showAll === 'true') {
          delete filters.isActive;
          delete filters.isVerified;
        }
      }
      
      const opportunities = await storage.getAllOpportunities(filters);
      res.status(200).json(opportunities);
    } catch (error) {
      console.error('Error fetching opportunities:', error);
      res.status(500).json({ message: 'Error fetching opportunities' });
    }
  });

  app.get('/api/opportunities/recommended', requireAuth, requireRole(['student']), async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId!;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      
      const studentProfile = await storage.getStudentProfile(userId);
      if (!studentProfile) {
        return res.status(404).json({ message: 'Student profile not found' });
      }
      
      const recommendations = await storage.getRecommendedOpportunitiesForStudent(studentProfile.id, limit);
      res.status(200).json(recommendations);
    } catch (error) {
      console.error('Error fetching recommended opportunities:', error);
      res.status(500).json({ message: 'Error fetching recommended opportunities' });
    }
  });

  app.get('/api/opportunities/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid opportunity ID' });
      }
      
      const opportunity = await storage.getOpportunity(id);
      
      if (!opportunity) {
        return res.status(404).json({ message: 'Opportunity not found' });
      }
      
      // Check if the student has saved this opportunity
      if (req.session.userId && req.session.role === 'student') {
        const studentProfile = await storage.getStudentProfile(req.session.userId);
        if (studentProfile) {
          const savedOpportunities = await storage.getSavedOpportunities(studentProfile.id);
          opportunity.isSaved = savedOpportunities.some(o => o.id === opportunity.id);
          
          // Check if student has already applied
          const application = await storage.getApplicationByIds(studentProfile.id, opportunity.id);
          opportunity.hasApplied = !!application;
          opportunity.applicationStatus = application?.status;
        }
      }
      
      res.status(200).json(opportunity);
    } catch (error) {
      console.error('Error fetching opportunity:', error);
      res.status(500).json({ message: 'Error fetching opportunity' });
    }
  });

  app.post('/api/opportunities', requireAuth, requireRole(['employer']), async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId!;
      
      // Validate request
      const validation = insertOpportunitySchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: 'Invalid opportunity data', errors: validation.error.format() });
      }
      
      // Get employer profile
      const employerProfile = await storage.getEmployerProfile(userId);
      if (!employerProfile) {
        return res.status(404).json({ message: 'Employer profile not found' });
      }
      
      // Create opportunity
      const opportunity = await storage.createOpportunity({
        ...validation.data,
        employerId: employerProfile.id,
        // New opportunities are active but need admin verification
        isActive: true,
        isVerified: false,
      });
      
      // Add skills if provided
      if (req.body.skills && Array.isArray(req.body.skills)) {
        await storage.addSkillsToOpportunity(opportunity.id, req.body.skills);
      }
      
      const createdOpportunity = await storage.getOpportunity(opportunity.id);
      res.status(201).json(createdOpportunity);
    } catch (error) {
      console.error('Error creating opportunity:', error);
      res.status(500).json({ message: 'Error creating opportunity' });
    }
  });

  app.put('/api/opportunities/:id', requireAuth, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.session.userId!;
      
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid opportunity ID' });
      }
      
      // Validate request
      const validation = insertOpportunitySchema.partial().safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: 'Invalid opportunity data', errors: validation.error.format() });
      }
      
      // Get opportunity
      const opportunity = await storage.getOpportunity(id);
      if (!opportunity) {
        return res.status(404).json({ message: 'Opportunity not found' });
      }
      
      // Verify permissions
      if (req.session.role === 'employer') {
        // Employer can only update their own opportunities
        const employerProfile = await storage.getEmployerProfile(userId);
        if (!employerProfile || opportunity.employerId !== employerProfile.id) {
          return res.status(403).json({ message: 'You are not authorized to update this opportunity' });
        }
        
        // Employers cannot verify their own opportunities
        if (req.body.isVerified !== undefined) {
          delete req.body.isVerified;
        }
      } else if (req.session.role !== 'admin') {
        return res.status(403).json({ message: 'Only employers or admins can update opportunities' });
      }
      
      // Update opportunity
      const updatedOpportunity = await storage.updateOpportunity(id, validation.data);
      
      // Update skills if provided
      if (req.body.skills && Array.isArray(req.body.skills)) {
        await storage.addSkillsToOpportunity(id, req.body.skills);
      }
      
      const result = await storage.getOpportunity(id);
      res.status(200).json(result);
    } catch (error) {
      console.error('Error updating opportunity:', error);
      res.status(500).json({ message: 'Error updating opportunity' });
    }
  });

  app.delete('/api/opportunities/:id', requireAuth, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.session.userId!;
      
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid opportunity ID' });
      }
      
      // Get opportunity
      const opportunity = await storage.getOpportunity(id);
      if (!opportunity) {
        return res.status(404).json({ message: 'Opportunity not found' });
      }
      
      // Verify permissions
      if (req.session.role === 'employer') {
        // Employer can only delete their own opportunities
        const employerProfile = await storage.getEmployerProfile(userId);
        if (!employerProfile || opportunity.employerId !== employerProfile.id) {
          return res.status(403).json({ message: 'You are not authorized to delete this opportunity' });
        }
      } else if (req.session.role !== 'admin') {
        return res.status(403).json({ message: 'Only employers or admins can delete opportunities' });
      }
      
      // Delete opportunity
      const deleted = await storage.deleteOpportunity(id);
      
      res.status(200).json({ success: deleted });
    } catch (error) {
      console.error('Error deleting opportunity:', error);
      res.status(500).json({ message: 'Error deleting opportunity' });
    }
  });

  // Application routes
  app.post('/api/applications', requireAuth, requireRole(['student']), async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId!;
      
      // Validate request
      const validation = insertApplicationSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: 'Invalid application data', errors: validation.error.format() });
      }
      
      // Get student profile
      const studentProfile = await storage.getStudentProfile(userId);
      if (!studentProfile) {
        return res.status(404).json({ message: 'Student profile not found' });
      }
      
      // Check if opportunity exists
      const opportunity = await storage.getOpportunity(req.body.opportunityId);
      if (!opportunity) {
        return res.status(404).json({ message: 'Opportunity not found' });
      }
      
      // Check if already applied
      const existingApplication = await storage.getApplicationByIds(
        studentProfile.id,
        req.body.opportunityId
      );
      
      if (existingApplication) {
        return res.status(409).json({ message: 'You have already applied to this opportunity' });
      }
      
      // Create application
      const application = await storage.createApplication({
        ...validation.data,
        studentId: studentProfile.id,
        status: 'pending',
      });
      
      const result = await storage.getApplication(application.id);
      res.status(201).json(result);
    } catch (error) {
      console.error('Error creating application:', error);
      res.status(500).json({ message: 'Error creating application' });
    }
  });

  app.get('/api/applications/student', requireAuth, requireRole(['student']), async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId!;
      
      // Get student profile
      const studentProfile = await storage.getStudentProfile(userId);
      if (!studentProfile) {
        return res.status(404).json({ message: 'Student profile not found' });
      }
      
      // Get status filter from query param
      const status = req.query.status as string | undefined;
      
      // Get applications
      const applications = await storage.getStudentApplications(studentProfile.id, status);
      
      res.status(200).json(applications);
    } catch (error) {
      console.error('Error fetching student applications:', error);
      res.status(500).json({ message: 'Error fetching student applications' });
    }
  });

  app.get('/api/applications/opportunity/:id', requireAuth, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.session.userId!;
      
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid opportunity ID' });
      }
      
      // Get opportunity
      const opportunity = await storage.getOpportunity(id);
      if (!opportunity) {
        return res.status(404).json({ message: 'Opportunity not found' });
      }
      
      // Verify permissions
      if (req.session.role === 'employer') {
        // Employer can only view applications for their opportunities
        const employerProfile = await storage.getEmployerProfile(userId);
        if (!employerProfile || opportunity.employerId !== employerProfile.id) {
          return res.status(403).json({ message: 'You are not authorized to view these applications' });
        }
      } else if (req.session.role !== 'admin') {
        return res.status(403).json({ message: 'Only employers or admins can view applications for opportunities' });
      }
      
      // Get status filter from query param
      const status = req.query.status as string | undefined;
      
      // Get applications
      const applications = await storage.getOpportunityApplications(id, status);
      
      res.status(200).json(applications);
    } catch (error) {
      console.error('Error fetching opportunity applications:', error);
      res.status(500).json({ message: 'Error fetching opportunity applications' });
    }
  });

  app.put('/api/applications/:id', requireAuth, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.session.userId!;
      
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid application ID' });
      }
      
      // Get application
      const application = await storage.getApplication(id);
      if (!application) {
        return res.status(404).json({ message: 'Application not found' });
      }
      
      // Verify permissions
      if (req.session.role === 'employer') {
        // Employer can only update applications for their opportunities
        const employerProfile = await storage.getEmployerProfile(userId);
        if (!employerProfile || application.opportunity.employerId !== employerProfile.id) {
          return res.status(403).json({ message: 'You are not authorized to update this application' });
        }
        
        // Employers can only update status and feedback
        const allowedFields = ['status', 'feedback'];
        Object.keys(req.body).forEach(key => {
          if (!allowedFields.includes(key)) {
            delete req.body[key];
          }
        });
      } else if (req.session.role === 'student') {
        // Students can only withdraw their own applications
        const studentProfile = await storage.getStudentProfile(userId);
        if (!studentProfile || application.studentId !== studentProfile.id) {
          return res.status(403).json({ message: 'You are not authorized to update this application' });
        }
        
        // Students can only withdraw applications (not modify other fields)
        if (req.body.status !== 'withdrawn') {
          return res.status(403).json({ message: 'Students can only withdraw applications' });
        }
      } else if (req.session.role !== 'admin') {
        return res.status(403).json({ message: 'You are not authorized to update this application' });
      }
      
      // Update application
      const updatedApplication = await storage.updateApplication(id, req.body);
      
      const result = await storage.getApplication(id);
      res.status(200).json(result);
    } catch (error) {
      console.error('Error updating application:', error);
      res.status(500).json({ message: 'Error updating application' });
    }
  });

  // Saved opportunities routes
  app.post('/api/opportunities/:id/save', requireAuth, requireRole(['student']), async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.session.userId!;
      
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid opportunity ID' });
      }
      
      // Get student profile
      const studentProfile = await storage.getStudentProfile(userId);
      if (!studentProfile) {
        return res.status(404).json({ message: 'Student profile not found' });
      }
      
      // Check if opportunity exists
      const opportunity = await storage.getOpportunity(id);
      if (!opportunity) {
        return res.status(404).json({ message: 'Opportunity not found' });
      }
      
      // Save opportunity
      const saved = await storage.saveOpportunity(studentProfile.id, id);
      
      res.status(200).json({ success: saved });
    } catch (error) {
      console.error('Error saving opportunity:', error);
      res.status(500).json({ message: 'Error saving opportunity' });
    }
  });

  app.delete('/api/opportunities/:id/save', requireAuth, requireRole(['student']), async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.session.userId!;
      
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid opportunity ID' });
      }
      
      // Get student profile
      const studentProfile = await storage.getStudentProfile(userId);
      if (!studentProfile) {
        return res.status(404).json({ message: 'Student profile not found' });
      }
      
      // Unsave opportunity
      const unsaved = await storage.unsaveOpportunity(studentProfile.id, id);
      
      res.status(200).json({ success: unsaved });
    } catch (error) {
      console.error('Error unsaving opportunity:', error);
      res.status(500).json({ message: 'Error unsaving opportunity' });
    }
  });

  app.get('/api/opportunities/saved', requireAuth, requireRole(['student']), async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId!;
      
      // Get student profile
      const studentProfile = await storage.getStudentProfile(userId);
      if (!studentProfile) {
        return res.status(404).json({ message: 'Student profile not found' });
      }
      
      // Get saved opportunities
      const opportunities = await storage.getSavedOpportunities(studentProfile.id);
      
      res.status(200).json(opportunities);
    } catch (error) {
      console.error('Error fetching saved opportunities:', error);
      res.status(500).json({ message: 'Error fetching saved opportunities' });
    }
  });

  // Certificate routes
  app.post('/api/certificates', requireAuth, requireRole(['employer', 'admin']), async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId!;
      
      // Validate request
      const validation = insertCertificateSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: 'Invalid certificate data', errors: validation.error.format() });
      }
      
      // If employer, verify they own the application
      if (req.session.role === 'employer') {
        const employerProfile = await storage.getEmployerProfile(userId);
        if (!employerProfile) {
          return res.status(404).json({ message: 'Employer profile not found' });
        }
        
        // If certificate has applicationId, verify the employer owns the opportunity
        if (req.body.applicationId) {
          const application = await storage.getApplication(req.body.applicationId);
          if (!application) {
            return res.status(404).json({ message: 'Application not found' });
          }
          
          if (application.opportunity.employerId !== employerProfile.id) {
            return res.status(403).json({ message: 'You are not authorized to issue this certificate' });
          }
        }
        // Without applicationId, verify employerId matches
        else if (req.body.employerId !== employerProfile.id) {
          return res.status(403).json({ message: 'You are not authorized to issue this certificate' });
        }
      }
      
      // Create certificate
      const certificate = await storage.createCertificate(validation.data);
      
      // Generate PDF
      const pdfBuffer = await generateCertificatePDF(certificate);
      
      // Save PDF to file
      const pdfFilename = `certificate_${certificate.id}.pdf`;
      const pdfPath = path.join(storage_dir, pdfFilename);
      await fs.writeFile(pdfPath, pdfBuffer);
      
      // Update certificate with PDF URL
      const pdfUrl = `/uploads/${pdfFilename}`;
      await storage.updateCertificate(certificate.id, { pdfUrl });
      
      // Get updated certificate
      const updatedCertificate = await storage.getCertificate(certificate.id);
      
      res.status(201).json(updatedCertificate);
    } catch (error) {
      console.error('Error creating certificate:', error);
      res.status(500).json({ message: 'Error creating certificate' });
    }
  });

  app.get('/api/certificates/student', requireAuth, requireRole(['student']), async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId!;
      
      // Get student profile
      const studentProfile = await storage.getStudentProfile(userId);
      if (!studentProfile) {
        return res.status(404).json({ message: 'Student profile not found' });
      }
      
      // Get certificates
      const certificates = await storage.getStudentCertificates(studentProfile.id);
      
      res.status(200).json(certificates);
    } catch (error) {
      console.error('Error fetching student certificates:', error);
      res.status(500).json({ message: 'Error fetching student certificates' });
    }
  });

  app.get('/api/certificates/:id', async (req: Request, res: Response) => {
    try {
      const id = req.params.id;
      
      // Get certificate
      const certificate = await storage.getCertificate(id);
      
      if (!certificate) {
        return res.status(404).json({ message: 'Certificate not found' });
      }
      
      // Check permissions if not admin
      if (req.session.role !== 'admin') {
        if (req.session.role === 'student') {
          // Students can only view their own certificates
          const studentProfile = await storage.getStudentProfile(req.session.userId!);
          if (!studentProfile || certificate.studentId !== studentProfile.id) {
            return res.status(403).json({ message: 'You are not authorized to view this certificate' });
          }
        } else if (req.session.role === 'employer') {
          // Employers can only view certificates they issued
          const employerProfile = await storage.getEmployerProfile(req.session.userId!);
          if (!employerProfile || certificate.employerId !== employerProfile.id) {
            return res.status(403).json({ message: 'You are not authorized to view this certificate' });
          }
        } else {
          return res.status(403).json({ message: 'You are not authorized to view this certificate' });
        }
      }
      
      res.status(200).json(certificate);
    } catch (error) {
      console.error('Error fetching certificate:', error);
      res.status(500).json({ message: 'Error fetching certificate' });
    }
  });

  // Admin routes
  app.get('/api/admin/stats', requireAuth, requireRole(['admin']), async (req: Request, res: Response) => {
    try {
      const stats = await storage.getStats();
      res.status(200).json(stats);
    } catch (error) {
      console.error('Error fetching admin stats:', error);
      res.status(500).json({ message: 'Error fetching admin stats' });
    }
  });

  app.get('/api/admin/employers', requireAuth, requireRole(['admin']), async (req: Request, res: Response) => {
    try {
      // Get query params
      const verified = req.query.verified === 'true';
      
      const employers = await storage.getAllEmployers(verified);
      res.status(200).json(employers);
    } catch (error) {
      console.error('Error fetching employers:', error);
      res.status(500).json({ message: 'Error fetching employers' });
    }
  });

  app.put('/api/admin/employers/:id/verify', requireAuth, requireRole(['admin']), async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid employer ID' });
      }
      
      // Get user by employer profile ID
      const [profile] = await db
        .select({
          profile: employerProfiles,
          user: users
        })
        .from(employerProfiles)
        .innerJoin(users, eq(employerProfiles.userId, users.id))
        .where(eq(employerProfiles.id, id));
      
      if (!profile) {
        return res.status(404).json({ message: 'Employer not found' });
      }
      
      // Update employer verification status
      await storage.updateEmployerProfile(profile.user.id, { isVerified: true });
      
      // Activate user account if pending
      if (profile.user.status === 'pending') {
        await storage.updateUser(profile.user.id, { status: 'active' });
      }
      
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error verifying employer:', error);
      res.status(500).json({ message: 'Error verifying employer' });
    }
  });

  // Serve uploads
  app.use('/uploads', express.static(storage_dir));

  const httpServer = createServer(app);
  return httpServer;
}
