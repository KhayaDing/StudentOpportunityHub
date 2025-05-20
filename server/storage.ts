import {
  users,
  studentProfiles,
  employerProfiles,
  skills,
  studentSkills,
  opportunities,
  opportunitySkills,
  applications,
  savedOpportunities,
  certificates,
  type User,
  type InsertUser,
  type StudentProfile,
  type InsertStudentProfile,
  type EmployerProfile,
  type InsertEmployerProfile,
  type Skill,
  type Opportunity,
  type InsertOpportunity,
  type Application,
  type InsertApplication,
  type Certificate,
  type InsertCertificate,
  userRoleEnum,
  applicationStatusEnum,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, or, inArray, like, gte, lte, desc, asc, count, SQL, sql } from "drizzle-orm";
import * as bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, data: Partial<User>): Promise<User | undefined>;

  // Student profile operations
  getStudentProfile(userId: number): Promise<StudentProfile | undefined>;
  createStudentProfile(profile: InsertStudentProfile): Promise<StudentProfile>;
  updateStudentProfile(
    userId: number,
    data: Partial<InsertStudentProfile>
  ): Promise<StudentProfile | undefined>;
  getStudentWithSkills(userId: number): Promise<any | undefined>;
  
  // Employer profile operations
  getEmployerProfile(userId: number): Promise<EmployerProfile | undefined>;
  createEmployerProfile(profile: InsertEmployerProfile): Promise<EmployerProfile>;
  updateEmployerProfile(
    userId: number,
    data: Partial<InsertEmployerProfile>
  ): Promise<EmployerProfile | undefined>;
  getAllEmployers(verified?: boolean): Promise<any[]>;
  
  // Skills operations
  getAllSkills(): Promise<Skill[]>;
  getSkillsByIds(ids: number[]): Promise<Skill[]>;
  getOrCreateSkill(name: string): Promise<Skill>;
  addSkillsToStudent(studentProfileId: number, skillIds: number[]): Promise<void>;
  removeSkillFromStudent(studentProfileId: number, skillId: number): Promise<void>;
  getStudentSkills(studentProfileId: number): Promise<Skill[]>;
  
  // Opportunity operations
  createOpportunity(opportunity: InsertOpportunity): Promise<Opportunity>;
  getOpportunity(id: number): Promise<any | undefined>;
  updateOpportunity(
    id: number,
    data: Partial<InsertOpportunity>
  ): Promise<Opportunity | undefined>;
  deleteOpportunity(id: number): Promise<boolean>;
  getAllOpportunities(filters?: {
    category?: string;
    locationType?: string;
    skills?: number[];
    isActive?: boolean;
    isVerified?: boolean;
    employerId?: number;
    search?: string;
  }): Promise<any[]>;
  getRecommendedOpportunitiesForStudent(studentId: number, limit?: number): Promise<any[]>;
  addSkillsToOpportunity(opportunityId: number, skillIds: number[]): Promise<void>;
  
  // Application operations
  createApplication(application: InsertApplication): Promise<Application>;
  getApplication(id: number): Promise<any | undefined>;
  getApplicationByIds(studentId: number, opportunityId: number): Promise<Application | undefined>;
  updateApplication(
    id: number,
    data: Partial<Application>
  ): Promise<Application | undefined>;
  getStudentApplications(studentId: number, status?: string): Promise<any[]>;
  getOpportunityApplications(opportunityId: number, status?: string): Promise<any[]>;
  
  // Saved opportunity operations
  saveOpportunity(studentId: number, opportunityId: number): Promise<boolean>;
  unsaveOpportunity(studentId: number, opportunityId: number): Promise<boolean>;
  getSavedOpportunities(studentId: number): Promise<any[]>;
  
  // Certificate operations
  createCertificate(certificate: InsertCertificate): Promise<Certificate>;
  getCertificate(id: string): Promise<Certificate | undefined>;
  getStudentCertificates(studentId: number): Promise<Certificate[]>;

  // Dashboard operations
  getStats(): Promise<any>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(userData: InsertUser): Promise<User> {
    // Hash password before storing
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    
    const [user] = await db
      .insert(users)
      .values({
        ...userData,
        password: hashedPassword,
      })
      .returning();
    
    return user;
  }

  async updateUser(id: number, data: Partial<User>): Promise<User | undefined> {
    // If password is being updated, hash it
    if (data.password) {
      data.password = await bcrypt.hash(data.password, 10);
    }
    
    const [updatedUser] = await db
      .update(users)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();
    
    return updatedUser;
  }

  // Student profile operations
  async getStudentProfile(userId: number): Promise<StudentProfile | undefined> {
    const [profile] = await db
      .select()
      .from(studentProfiles)
      .where(eq(studentProfiles.userId, userId));
    
    return profile;
  }

  async createStudentProfile(profileData: InsertStudentProfile): Promise<StudentProfile> {
    const [profile] = await db
      .insert(studentProfiles)
      .values(profileData)
      .returning();
    
    return profile;
  }

  async updateStudentProfile(
    userId: number,
    data: Partial<InsertStudentProfile>
  ): Promise<StudentProfile | undefined> {
    const [profile] = await db
      .select()
      .from(studentProfiles)
      .where(eq(studentProfiles.userId, userId));
    
    if (!profile) return undefined;
    
    const [updatedProfile] = await db
      .update(studentProfiles)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(studentProfiles.id, profile.id))
      .returning();
    
    return updatedProfile;
  }

  async getStudentWithSkills(userId: number): Promise<any | undefined> {
    const [profile] = await db
      .select()
      .from(studentProfiles)
      .where(eq(studentProfiles.userId, userId));
    
    if (!profile) return undefined;
    
    const studentSkillsList = await db
      .select({
        skill: skills,
      })
      .from(studentSkills)
      .innerJoin(skills, eq(studentSkills.skillId, skills.id))
      .where(eq(studentSkills.studentProfileId, profile.id));
    
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId));
    
    return {
      ...profile,
      user,
      skills: studentSkillsList.map(item => item.skill),
    };
  }

  // Employer profile operations
  async getEmployerProfile(userId: number): Promise<EmployerProfile | undefined> {
    const [profile] = await db
      .select()
      .from(employerProfiles)
      .where(eq(employerProfiles.userId, userId));
    
    return profile;
  }

  async createEmployerProfile(profileData: InsertEmployerProfile): Promise<EmployerProfile> {
    const [profile] = await db
      .insert(employerProfiles)
      .values(profileData)
      .returning();
    
    return profile;
  }

  async updateEmployerProfile(
    userId: number,
    data: Partial<InsertEmployerProfile>
  ): Promise<EmployerProfile | undefined> {
    const [profile] = await db
      .select()
      .from(employerProfiles)
      .where(eq(employerProfiles.userId, userId));
    
    if (!profile) return undefined;
    
    const [updatedProfile] = await db
      .update(employerProfiles)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(employerProfiles.id, profile.id))
      .returning();
    
    return updatedProfile;
  }

  async getAllEmployers(verified?: boolean): Promise<any[]> {
    let query = db
      .select({
        profile: employerProfiles,
        user: users,
      })
      .from(employerProfiles)
      .innerJoin(users, eq(employerProfiles.userId, users.id));
    
    if (verified !== undefined) {
      query = query.where(eq(employerProfiles.isVerified, verified));
    }
    
    const results = await query;
    
    return results.map(({ profile, user }) => ({
      ...profile,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    }));
  }

  // Skills operations
  async getAllSkills(): Promise<Skill[]> {
    return db.select().from(skills);
  }

  async getSkillsByIds(ids: number[]): Promise<Skill[]> {
    return db.select().from(skills).where(inArray(skills.id, ids));
  }

  async getOrCreateSkill(name: string): Promise<Skill> {
    const [existingSkill] = await db
      .select()
      .from(skills)
      .where(eq(skills.name, name.trim().toLowerCase()));
    
    if (existingSkill) return existingSkill;
    
    const [newSkill] = await db
      .insert(skills)
      .values({ name: name.trim().toLowerCase() })
      .returning();
    
    return newSkill;
  }

  async addSkillsToStudent(studentProfileId: number, skillIds: number[]): Promise<void> {
    // Remove duplicates
    const uniqueSkillIds = [...new Set(skillIds)];
    
    // Get existing skills for this student
    const existingSkills = await db
      .select()
      .from(studentSkills)
      .where(eq(studentSkills.studentProfileId, studentProfileId));
    
    const existingSkillIds = existingSkills.map(s => s.skillId);
    
    // Find skills to add (ones that don't already exist)
    const skillIdsToAdd = uniqueSkillIds.filter(id => !existingSkillIds.includes(id));
    
    if (skillIdsToAdd.length > 0) {
      await db.insert(studentSkills).values(
        skillIdsToAdd.map(skillId => ({
          studentProfileId,
          skillId,
        }))
      );
    }
  }

  async removeSkillFromStudent(studentProfileId: number, skillId: number): Promise<void> {
    await db
      .delete(studentSkills)
      .where(
        and(
          eq(studentSkills.studentProfileId, studentProfileId),
          eq(studentSkills.skillId, skillId)
        )
      );
  }

  async getStudentSkills(studentProfileId: number): Promise<Skill[]> {
    const results = await db
      .select({
        skill: skills,
      })
      .from(studentSkills)
      .innerJoin(skills, eq(studentSkills.skillId, skills.id))
      .where(eq(studentSkills.studentProfileId, studentProfileId));
    
    return results.map(r => r.skill);
  }

  // Opportunity operations
  async createOpportunity(opportunityData: InsertOpportunity): Promise<Opportunity> {
    const [opportunity] = await db
      .insert(opportunities)
      .values(opportunityData)
      .returning();
    
    return opportunity;
  }

  async getOpportunity(id: number): Promise<any | undefined> {
    const [opportunity] = await db
      .select({
        opportunity: opportunities,
        employer: employerProfiles,
        company: employerProfiles,
      })
      .from(opportunities)
      .innerJoin(employerProfiles, eq(opportunities.employerId, employerProfiles.id))
      .where(eq(opportunities.id, id));
    
    if (!opportunity) return undefined;
    
    const opportunitySkillsList = await db
      .select({
        skill: skills,
      })
      .from(opportunitySkills)
      .innerJoin(skills, eq(opportunitySkills.skillId, skills.id))
      .where(eq(opportunitySkills.opportunityId, id));
    
    return {
      ...opportunity.opportunity,
      employer: opportunity.employer,
      company: opportunity.company,
      skills: opportunitySkillsList.map(item => item.skill),
    };
  }

  async updateOpportunity(
    id: number,
    data: Partial<InsertOpportunity>
  ): Promise<Opportunity | undefined> {
    const [updatedOpportunity] = await db
      .update(opportunities)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(opportunities.id, id))
      .returning();
    
    return updatedOpportunity;
  }

  async deleteOpportunity(id: number): Promise<boolean> {
    const deleted = await db
      .delete(opportunities)
      .where(eq(opportunities.id, id))
      .returning();
    
    return deleted.length > 0;
  }

  async getAllOpportunities(filters?: {
    category?: string;
    locationType?: string;
    skills?: number[];
    isActive?: boolean;
    isVerified?: boolean;
    employerId?: number;
    search?: string;
  }): Promise<any[]> {
    let query = db
      .select({
        opportunity: opportunities,
        employer: employerProfiles,
      })
      .from(opportunities)
      .innerJoin(employerProfiles, eq(opportunities.employerId, employerProfiles.id));
    
    const conditions: SQL[] = [];
    
    if (filters) {
      if (filters.category) {
        conditions.push(eq(opportunities.category, filters.category));
      }
      
      if (filters.locationType) {
        conditions.push(eq(opportunities.locationType, filters.locationType));
      }
      
      if (filters.isActive !== undefined) {
        conditions.push(eq(opportunities.isActive, filters.isActive));
      }
      
      if (filters.isVerified !== undefined) {
        conditions.push(eq(opportunities.isVerified, filters.isVerified));
      }
      
      if (filters.employerId) {
        conditions.push(eq(opportunities.employerId, filters.employerId));
      }
      
      if (filters.search) {
        conditions.push(
          or(
            like(opportunities.title, `%${filters.search}%`),
            like(opportunities.description, `%${filters.search}%`),
            like(employerProfiles.companyName, `%${filters.search}%`)
          )
        );
      }
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    // Add order by most recent first
    query = query.orderBy(desc(opportunities.createdAt));
    
    let results = await query;
    
    // Filter by skills if needed
    if (filters?.skills && filters.skills.length > 0) {
      // Get all opportunity IDs that have all these skills
      const opportunityIdsBySkills = await this.getOpportunityIdsWithSkills(filters.skills);
      
      // Filter results to only those opportunities
      results = results.filter(r => 
        opportunityIdsBySkills.includes(r.opportunity.id)
      );
    }
    
    // Get skills for each opportunity
    const enrichedResults = await Promise.all(
      results.map(async (r) => {
        const opportunitySkillsList = await db
          .select({
            skill: skills,
          })
          .from(opportunitySkills)
          .innerJoin(skills, eq(opportunitySkills.skillId, skills.id))
          .where(eq(opportunitySkills.opportunityId, r.opportunity.id));
        
        return {
          ...r.opportunity,
          employer: r.employer,
          company: r.employer,
          skills: opportunitySkillsList.map(item => item.skill),
        };
      })
    );
    
    return enrichedResults;
  }

  private async getOpportunityIdsWithSkills(skillIds: number[]): Promise<number[]> {
    // Get all opportunities that have any of these skills
    const opportunitiesWithSkills = await db
      .select({
        opportunityId: opportunitySkills.opportunityId,
        skillId: opportunitySkills.skillId,
      })
      .from(opportunitySkills)
      .where(inArray(opportunitySkills.skillId, skillIds));
    
    // Group by opportunity to count how many skills match
    const opportunitySkillCounts: Record<number, number> = {};
    opportunitiesWithSkills.forEach(o => {
      opportunitySkillCounts[o.opportunityId] = (opportunitySkillCounts[o.opportunityId] || 0) + 1;
    });
    
    // Return only opportunity IDs that have all requested skills
    return Object.entries(opportunitySkillCounts)
      .filter(([_, count]) => count === skillIds.length)
      .map(([id, _]) => parseInt(id));
  }

  async getRecommendedOpportunitiesForStudent(studentId: number, limit: number = 5): Promise<any[]> {
    // Get student profile and skills
    const studentProfile = await this.getStudentProfile(studentId);
    if (!studentProfile) return [];
    
    const studentSkillsList = await this.getStudentSkills(studentProfile.id);
    if (!studentSkillsList.length) return [];
    
    const studentSkillIds = studentSkillsList.map(skill => skill.id);
    
    // Get active verified opportunities
    const opportunities = await this.getAllOpportunities({
      isActive: true,
      isVerified: true,
    });
    
    // Score opportunities based on matching criteria
    const scoredOpportunities = opportunities.map(opportunity => {
      let score = 0;
      
      // Score by matching skills
      const opportunitySkillIds = opportunity.skills.map((s: Skill) => s.id);
      const matchingSkills = opportunitySkillIds.filter(id => studentSkillIds.includes(id));
      score += matchingSkills.length * 2;
      
      // Score by matching program
      if (opportunity.requiredProgram && 
          studentProfile.program &&
          opportunity.requiredProgram.toLowerCase() === studentProfile.program.toLowerCase()) {
        score += 3;
      }
      
      // Score by preferred year (exact match or higher year)
      if (opportunity.preferredYear && 
          studentProfile.yearOfStudy &&
          studentProfile.yearOfStudy >= opportunity.preferredYear) {
        score += 2;
      }
      
      return {
        opportunity,
        score,
      };
    });
    
    // Sort by score (highest first) and limit results
    scoredOpportunities.sort((a, b) => b.score - a.score);
    
    return scoredOpportunities
      .slice(0, limit)
      .map(item => item.opportunity);
  }

  async addSkillsToOpportunity(opportunityId: number, skillIds: number[]): Promise<void> {
    // Remove duplicates
    const uniqueSkillIds = [...new Set(skillIds)];
    
    // Get existing skills for this opportunity
    const existingSkills = await db
      .select()
      .from(opportunitySkills)
      .where(eq(opportunitySkills.opportunityId, opportunityId));
    
    const existingSkillIds = existingSkills.map(s => s.skillId);
    
    // Find skills to add (ones that don't already exist)
    const skillIdsToAdd = uniqueSkillIds.filter(id => !existingSkillIds.includes(id));
    
    if (skillIdsToAdd.length > 0) {
      await db.insert(opportunitySkills).values(
        skillIdsToAdd.map(skillId => ({
          opportunityId,
          skillId,
        }))
      );
    }
  }

  // Application operations
  async createApplication(applicationData: InsertApplication): Promise<Application> {
    const [application] = await db
      .insert(applications)
      .values(applicationData)
      .returning();
    
    return application;
  }

  async getApplication(id: number): Promise<any | undefined> {
    const [application] = await db
      .select({
        application: applications,
        opportunity: opportunities,
        employer: employerProfiles,
        student: studentProfiles,
        user: users
      })
      .from(applications)
      .innerJoin(opportunities, eq(applications.opportunityId, opportunities.id))
      .innerJoin(employerProfiles, eq(opportunities.employerId, employerProfiles.id))
      .innerJoin(studentProfiles, eq(applications.studentId, studentProfiles.id))
      .innerJoin(users, eq(studentProfiles.userId, users.id))
      .where(eq(applications.id, id));
    
    if (!application) return undefined;
    
    return {
      ...application.application,
      opportunity: application.opportunity,
      employer: application.employer,
      student: {
        ...application.student,
        firstName: application.user.firstName,
        lastName: application.user.lastName,
        email: application.user.email,
      },
    };
  }

  async getApplicationByIds(studentId: number, opportunityId: number): Promise<Application | undefined> {
    const [application] = await db
      .select()
      .from(applications)
      .where(
        and(
          eq(applications.studentId, studentId),
          eq(applications.opportunityId, opportunityId)
        )
      );
    
    return application;
  }

  async updateApplication(
    id: number,
    data: Partial<Application>
  ): Promise<Application | undefined> {
    const [updatedApplication] = await db
      .update(applications)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(applications.id, id))
      .returning();
    
    return updatedApplication;
  }

  async getStudentApplications(studentId: number, status?: string): Promise<any[]> {
    let query = db
      .select({
        application: applications,
        opportunity: opportunities,
        employer: employerProfiles,
      })
      .from(applications)
      .innerJoin(opportunities, eq(applications.opportunityId, opportunities.id))
      .innerJoin(employerProfiles, eq(opportunities.employerId, employerProfiles.id))
      .where(eq(applications.studentId, studentId));
    
    if (status) {
      query = query.where(eq(applications.status, status as any));
    }
    
    // Order by most recent first
    query = query.orderBy(desc(applications.appliedAt));
    
    const results = await query;
    
    return results.map(r => ({
      ...r.application,
      opportunity: r.opportunity,
      employer: r.employer,
    }));
  }

  async getOpportunityApplications(opportunityId: number, status?: string): Promise<any[]> {
    let query = db
      .select({
        application: applications,
        student: studentProfiles,
        user: users,
      })
      .from(applications)
      .innerJoin(studentProfiles, eq(applications.studentId, studentProfiles.id))
      .innerJoin(users, eq(studentProfiles.userId, users.id))
      .where(eq(applications.opportunityId, opportunityId));
    
    if (status) {
      query = query.where(eq(applications.status, status as any));
    }
    
    // Order by most recent first
    query = query.orderBy(desc(applications.appliedAt));
    
    const results = await query;
    
    return results.map(r => ({
      ...r.application,
      student: {
        ...r.student,
        firstName: r.user.firstName,
        lastName: r.user.lastName,
        email: r.user.email,
      },
    }));
  }

  // Saved opportunity operations
  async saveOpportunity(studentId: number, opportunityId: number): Promise<boolean> {
    // Check if already saved
    const [existing] = await db
      .select()
      .from(savedOpportunities)
      .where(
        and(
          eq(savedOpportunities.studentId, studentId),
          eq(savedOpportunities.opportunityId, opportunityId)
        )
      );
    
    if (existing) return true; // Already saved
    
    const [saved] = await db
      .insert(savedOpportunities)
      .values({
        studentId,
        opportunityId,
      })
      .returning();
    
    return !!saved;
  }

  async unsaveOpportunity(studentId: number, opportunityId: number): Promise<boolean> {
    const deleted = await db
      .delete(savedOpportunities)
      .where(
        and(
          eq(savedOpportunities.studentId, studentId),
          eq(savedOpportunities.opportunityId, opportunityId)
        )
      )
      .returning();
    
    return deleted.length > 0;
  }

  async getSavedOpportunities(studentId: number): Promise<any[]> {
    const results = await db
      .select({
        savedOpportunity: savedOpportunities,
        opportunity: opportunities,
        employer: employerProfiles,
      })
      .from(savedOpportunities)
      .innerJoin(opportunities, eq(savedOpportunities.opportunityId, opportunities.id))
      .innerJoin(employerProfiles, eq(opportunities.employerId, employerProfiles.id))
      .where(eq(savedOpportunities.studentId, studentId))
      .orderBy(desc(savedOpportunities.savedAt));
    
    // Get skills for each opportunity
    const enrichedResults = await Promise.all(
      results.map(async (r) => {
        const opportunitySkillsList = await db
          .select({
            skill: skills,
          })
          .from(opportunitySkills)
          .innerJoin(skills, eq(opportunitySkills.skillId, skills.id))
          .where(eq(opportunitySkills.opportunityId, r.opportunity.id));
        
        return {
          ...r.opportunity,
          employer: r.employer,
          savedAt: r.savedOpportunity.savedAt,
          skills: opportunitySkillsList.map(item => item.skill),
        };
      })
    );
    
    return enrichedResults;
  }

  // Certificate operations
  async createCertificate(certificateData: InsertCertificate): Promise<Certificate> {
    // Generate UUID if not provided
    if (!certificateData.id) {
      certificateData.id = uuidv4();
    }
    
    const [certificate] = await db
      .insert(certificates)
      .values(certificateData)
      .returning();
    
    // Update the application with the certificate ID
    if (certificateData.applicationId) {
      await db
        .update(applications)
        .set({
          certificateId: certificate.id,
          status: 'completed' as any,
          completedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(applications.id, certificateData.applicationId));
    }
    
    return certificate;
  }

  async getCertificate(id: string): Promise<Certificate | undefined> {
    const [certificate] = await db
      .select()
      .from(certificates)
      .where(eq(certificates.id, id));
    
    return certificate;
  }

  async getStudentCertificates(studentId: number): Promise<Certificate[]> {
    return db
      .select()
      .from(certificates)
      .where(eq(certificates.studentId, studentId))
      .orderBy(desc(certificates.issuedAt));
  }

  // Dashboard operations
  async getStats(): Promise<any> {
    const [userCounts] = await db
      .select({
        students: count(users.id).filterWhere(eq(users.role, 'student')),
        employers: count(users.id).filterWhere(eq(users.role, 'employer')),
        admins: count(users.id).filterWhere(eq(users.role, 'admin')),
      })
      .from(users);
    
    const [opportunityCounts] = await db
      .select({
        total: count(opportunities.id),
        active: count(opportunities.id).filterWhere(eq(opportunities.isActive, true)),
        verified: count(opportunities.id).filterWhere(eq(opportunities.isVerified, true)),
      })
      .from(opportunities);
    
    const [applicationCounts] = await db
      .select({
        total: count(applications.id),
        pending: count(applications.id).filterWhere(eq(applications.status, 'pending')),
        accepted: count(applications.id).filterWhere(eq(applications.status, 'accepted')),
        rejected: count(applications.id).filterWhere(eq(applications.status, 'rejected')),
        completed: count(applications.id).filterWhere(eq(applications.status, 'completed')),
      })
      .from(applications);
    
    const [certificateCount] = await db
      .select({
        total: count(certificates.id),
      })
      .from(certificates);
    
    // Get most active employers (by number of opportunities)
    const activeEmployers = await db
      .select({
        employerId: opportunities.employerId,
        companyName: employerProfiles.companyName,
        count: count(opportunities.id).as('count'),
      })
      .from(opportunities)
      .innerJoin(employerProfiles, eq(opportunities.employerId, employerProfiles.id))
      .groupBy(opportunities.employerId, employerProfiles.companyName)
      .orderBy(desc(sql`count`))
      .limit(5);
    
    // Get most popular skills (by opportunities requiring them)
    const popularSkills = await db
      .select({
        skillId: opportunitySkills.skillId,
        skillName: skills.name,
        count: count(opportunitySkills.id).as('count'),
      })
      .from(opportunitySkills)
      .innerJoin(skills, eq(opportunitySkills.skillId, skills.id))
      .groupBy(opportunitySkills.skillId, skills.name)
      .orderBy(desc(sql`count`))
      .limit(5);
    
    return {
      users: userCounts,
      opportunities: opportunityCounts,
      applications: applicationCounts,
      certificates: certificateCount,
      activeEmployers,
      popularSkills,
    };
  }
}

export const storage = new DatabaseStorage();
