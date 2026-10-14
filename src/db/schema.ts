import { relations } from 'drizzle-orm';
import {
  boolean,
  doublePrecision,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase UID or demo user ID
  name: text('name').notNull(),
  email: text('email').notNull(),
  role: text('role').notNull().default('citizen'), // 'citizen' | 'authority' | 'officer'
  departmentId: integer('department_id'),
  avatarUrl: text('avatar_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const departments = pgTable('departments', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(),
  code: text('code').notNull().unique(),
  contactEmail: text('contact_email').notNull(),
  headOfficerName: text('head_officer_name'),
  activeIncidentsCount: integer('active_incidents_count').default(0).notNull(),
  slaHours: integer('sla_hours').default(48).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const complaints = pgTable('complaints', {
  id: serial('id').primaryKey(),
  complaintId: text('complaint_id').notNull().unique(), // e.g. CIV-2026-0001
  title: text('title').notNull(),
  description: text('description').notNull(),
  category: text('category').notNull(),
  location: text('location').notNull(),
  latitude: doublePrecision('latitude').notNull().default(1.3521),
  longitude: doublePrecision('longitude').notNull().default(103.8198),
  citizenId: text('citizen_id').notNull(),
  citizenName: text('citizen_name').notNull(),
  citizenEmail: text('citizen_email').notNull(),
  departmentId: integer('department_id').references(() => departments.id),
  departmentName: text('department_name'),
  status: text('status').notNull().default('Submitted'), // 'Submitted' | 'Under Review' | 'Assigned' | 'In Progress' | 'Resolved Awaiting Verification' | 'Closed'
  priorityScore: integer('priority_score').notNull().default(50), // 0-100
  priorityTier: text('priority_tier').notNull().default('Medium'), // 'Low' | 'Medium' | 'High' | 'Critical'
  isDuplicate: boolean('is_duplicate').notNull().default(false),
  duplicateOfId: text('duplicate_of_id'),
  duplicateConfidence: integer('duplicate_confidence'),
  evidenceUrls: text('evidence_urls'), // JSON string array of URLs
  resolutionNotes: text('resolution_notes'),
  resolutionEvidenceUrl: text('resolution_evidence_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const aiAnalysis = pgTable('ai_analysis', {
  id: serial('id').primaryKey(),
  complaintId: text('complaint_id').notNull().references(() => complaints.complaintId),
  category: text('category').notNull(),
  summary: text('summary').notNull(),
  department: text('department').notNull(),
  urgency: text('urgency').notNull(), // 'Low' | 'Medium' | 'High' | 'Critical'
  confidence: integer('confidence').notNull(), // percentage 0-100
  reasoning: text('reasoning').notNull(),
  // Explainable Score Breakdown
  safetyImpactScore: integer('safety_impact_score').notNull().default(0), // 35%
  severityScore: integer('severity_score').notNull().default(0), // 25%
  reportCountScore: integer('report_count_score').notNull().default(0), // 20%
  waitingTimeScore: integer('waiting_time_score').notNull().default(0), // 10%
  evidenceScore: integer('evidence_score').notNull().default(0), // 10%
  calculatedPriority: integer('calculated_priority').notNull().default(50),
  duplicateSuspectId: text('duplicate_suspect_id'),
  duplicateScore: integer('duplicate_score'),
  duplicateReason: text('duplicate_reason'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const auditLogs = pgTable('audit_logs', {
  id: serial('id').primaryKey(),
  complaintId: text('complaint_id').notNull(),
  actorId: text('actor_id').notNull(),
  actorName: text('actor_name').notNull(),
  actorRole: text('actor_role').notNull(),
  action: text('action').notNull(),
  details: text('details').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const statusHistory = pgTable('status_history', {
  id: serial('id').primaryKey(),
  complaintId: text('complaint_id').notNull(),
  previousStatus: text('previous_status'),
  newStatus: text('new_status').notNull(),
  changedBy: text('changed_by').notNull(),
  changedByRole: text('changed_by_role').notNull(),
  note: text('note'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Relations
export const complaintsRelations = relations(complaints, ({ one, many }) => ({
  department: one(departments, {
    fields: [complaints.departmentId],
    references: [departments.id],
  }),
  analysis: one(aiAnalysis, {
    fields: [complaints.complaintId],
    references: [aiAnalysis.complaintId],
  }),
  logs: many(auditLogs),
  history: many(statusHistory),
}));

export const aiAnalysisRelations = relations(aiAnalysis, ({ one }) => ({
  complaint: one(complaints, {
    fields: [aiAnalysis.complaintId],
    references: [complaints.complaintId],
  }),
}));
