import {
  pgTable,
  text,
  varchar,
  timestamp,
  integer,
  boolean,
  serial,
  pgEnum,
  json,
  uuid,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// User roles enum
export const userRoleEnum = pgEnum("user_role", ["student", "employer", "admin"]);

// User status enum
export const userStatusEnum = pgEnum("user_status", ["pending", "active", "inactive", "banned"]);

// Application status enum
export const applicationStatusEnum = pgEnum("application_status", ["pending", "accepted", "rejected", "completed"]);

// Opportunity location type enum
export const locationTypeEnum = pgEnum("location_type", ["remote", "in-person", "hybrid"]);

// Opportunity duration type
export const durationTypeEnum = pgEnum("duration_type", ["days", "weeks", "months", "ongoing"]);

// Session storage table for authentication
export const sessions = pgTable("sessions", {
  sid: varchar("sid").primaryKey(),
  sess: json("sess").notNull(),
  expire: timestamp("expire").notNull(),
});

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email").notNull().unique(),
  password: varchar("password").notNull(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  role: userRoleEnum("role").notNull().default("student"),
  status: userStatusEnum("status").notNull().default("pending"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Student profiles table
export const studentProfiles = pgTable("student_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  institution: varchar("institution"),
  program: varchar("program"),
  yearOfStudy: integer("year_of_study"),
  bio: text("bio"),
  cvUrl: varchar("cv_url"),
  isProfileVisible: boolean("is_profile_visible").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Employer profiles table
export const employerProfiles = pgTable("employer_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  companyName: varchar("company_name").notNull(),
  industry: varchar("industry"),
  description: text("description"),
  location: varchar("location"),
  website: varchar("website"),
  logoUrl: varchar("logo_url"),
  contactPhone: varchar("contact_phone"),
  isVerified: boolean("is_verified").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Skills table
export const skills = pgTable("skills", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull().unique(),
  category: varchar("category"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Student skills junction table
export const studentSkills = pgTable("student_skills", {
  id: serial("id").primaryKey(),
  studentProfileId: integer("student_profile_id").notNull().references(() => studentProfiles.id, { onDelete: "cascade" }),
  skillId: integer("skill_id").notNull().references(() => skills.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
});

// Opportunities table
export const opportunities = pgTable("opportunities", {
  id: serial("id").primaryKey(),
  employerId: integer("employer_id").notNull().references(() => employerProfiles.id, { onDelete: "cascade" }),
  title: varchar("title").notNull(),
  description: text("description").notNull(),
  category: varchar("category"),
  locationType: locationTypeEnum("location_type").default("in-person"),
  location: varchar("location"),
  deadline: timestamp("deadline"),
  startDate: timestamp("start_date"),
  durationValue: integer("duration_value"),
  durationType: durationTypeEnum("duration_type"),
  requiredProgram: varchar("required_program"),
  preferredYear: integer("preferred_year"),
  stipend: varchar("stipend"),
  isActive: boolean("is_active").default(true),
  isVerified: boolean("is_verified").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Opportunity skills junction table
export const opportunitySkills = pgTable("opportunity_skills", {
  id: serial("id").primaryKey(),
  opportunityId: integer("opportunity_id").notNull().references(() => opportunities.id, { onDelete: "cascade" }),
  skillId: integer("skill_id").notNull().references(() => skills.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
});

// Applications table
export const applications = pgTable("applications", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull().references(() => studentProfiles.id, { onDelete: "cascade" }),
  opportunityId: integer("opportunity_id").notNull().references(() => opportunities.id, { onDelete: "cascade" }),
  status: applicationStatusEnum("status").default("pending"),
  coverLetter: text("cover_letter"),
  feedback: text("feedback"),
  certificateId: uuid("certificate_id").unique(),
  appliedAt: timestamp("applied_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

// Saved opportunities
export const savedOpportunities = pgTable("saved_opportunities", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull().references(() => studentProfiles.id, { onDelete: "cascade" }),
  opportunityId: integer("opportunity_id").notNull().references(() => opportunities.id, { onDelete: "cascade" }),
  savedAt: timestamp("saved_at").defaultNow(),
});

// Certificates table
export const certificates = pgTable("certificates", {
  id: uuid("id").primaryKey(),
  applicationId: integer("application_id").references(() => applications.id, { onDelete: "cascade" }),
  studentId: integer("student_id").notNull().references(() => studentProfiles.id, { onDelete: "cascade" }),
  employerId: integer("employer_id").notNull().references(() => employerProfiles.id, { onDelete: "cascade" }),
  opportunityTitle: varchar("opportunity_title").notNull(),
  studentName: varchar("student_name").notNull(),
  employerName: varchar("employer_name").notNull(),
  description: text("description"),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  issuedAt: timestamp("issued_at").defaultNow(),
  pdfUrl: varchar("pdf_url"),
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  studentProfile: one(studentProfiles, {
    fields: [users.id],
    references: [studentProfiles.userId],
  }),
  employerProfile: one(employerProfiles, {
    fields: [users.id],
    references: [employerProfiles.userId],
  }),
}));

export const studentProfilesRelations = relations(studentProfiles, ({ one, many }) => ({
  user: one(users, {
    fields: [studentProfiles.userId],
    references: [users.id],
  }),
  skills: many(studentSkills),
  applications: many(applications, {
    fields: [studentProfiles.id],
    references: [applications.studentId],
  }),
  savedOpportunities: many(savedOpportunities, {
    fields: [studentProfiles.id],
    references: [savedOpportunities.studentId],
  }),
  certificates: many(certificates, {
    fields: [studentProfiles.id],
    references: [certificates.studentId],
  }),
}));

export const employerProfilesRelations = relations(employerProfiles, ({ one, many }) => ({
  user: one(users, {
    fields: [employerProfiles.userId],
    references: [users.id],
  }),
  opportunities: many(opportunities, {
    fields: [employerProfiles.id],
    references: [opportunities.employerId],
  }),
  certificates: many(certificates, {
    fields: [employerProfiles.id],
    references: [certificates.employerId],
  }),
}));

export const opportunitiesRelations = relations(opportunities, ({ one, many }) => ({
  employer: one(employerProfiles, {
    fields: [opportunities.employerId],
    references: [employerProfiles.id],
  }),
  skills: many(opportunitySkills),
  applications: many(applications, {
    fields: [opportunities.id],
    references: [applications.opportunityId],
  }),
  savedBy: many(savedOpportunities, {
    fields: [opportunities.id],
    references: [savedOpportunities.opportunityId],
  }),
}));

export const skillsRelations = relations(skills, ({ many }) => ({
  students: many(studentSkills),
  opportunities: many(opportunitySkills),
}));

export const applicationsRelations = relations(applications, ({ one }) => ({
  student: one(studentProfiles, {
    fields: [applications.studentId],
    references: [studentProfiles.id],
  }),
  opportunity: one(opportunities, {
    fields: [applications.opportunityId],
    references: [opportunities.id],
  }),
  certificate: one(certificates, {
    fields: [applications.certificateId],
    references: [certificates.id],
  }),
}));

// Schemas for input validation
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertStudentProfileSchema = createInsertSchema(studentProfiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEmployerProfileSchema = createInsertSchema(employerProfiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertOpportunitySchema = createInsertSchema(opportunities).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertApplicationSchema = createInsertSchema(applications).omit({
  id: true,
  appliedAt: true,
  updatedAt: true,
  completedAt: true,
  certificateId: true,
});

export const insertCertificateSchema = createInsertSchema(certificates);

// Exported types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type StudentProfile = typeof studentProfiles.$inferSelect;
export type InsertStudentProfile = z.infer<typeof insertStudentProfileSchema>;

export type EmployerProfile = typeof employerProfiles.$inferSelect;
export type InsertEmployerProfile = z.infer<typeof insertEmployerProfileSchema>;

export type Skill = typeof skills.$inferSelect;

export type Opportunity = typeof opportunities.$inferSelect;
export type InsertOpportunity = z.infer<typeof insertOpportunitySchema>;

export type Application = typeof applications.$inferSelect;
export type InsertApplication = z.infer<typeof insertApplicationSchema>;

export type Certificate = typeof certificates.$inferSelect;
export type InsertCertificate = z.infer<typeof insertCertificateSchema>;
