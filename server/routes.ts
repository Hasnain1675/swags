import { Router, Response } from 'express';
import { z } from 'zod';
import { db } from '../src/db/index.ts';
import {
  aiAnalysis,
  auditLogs,
  complaints,
  departments,
  statusHistory,
  users,
} from '../src/db/schema.ts';
import { eq, desc, and, count, sql } from 'drizzle-orm';
import { AuthRequest, requireAuth, requireRole } from './auth.ts';
import { analyzeComplaint } from './aiTriage.ts';
import { detectDuplicates } from './duplicateDetection.ts';
import { seedDatabase } from './seed.ts';

const router = Router();

// Zod Schema for Complaint Submission
const CreateComplaintSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  category: z.string().min(2, 'Category is required'),
  location: z.string().min(3, 'Location is required'),
  latitude: z.number().default(1.3521),
  longitude: z.number().default(103.8198),
  evidenceUrls: z.array(z.string().url()).optional(),
});

// Health & Me
router.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'CivicFlow AI Engine', timestamp: new Date().toISOString() });
});

router.get('/me', requireAuth, (req: AuthRequest, res) => {
  res.json({ user: req.user });
});

// Seed endpoint
router.post('/seed/reset', async (req, res) => {
  try {
    await seedDatabase(true);
    res.json({ success: true, message: 'Database initialized/seeded with Pakistani civic dataset successfully.' });
  } catch (err: any) {
    console.error('Seed error:', err);
    res.status(500).json({ error: 'Failed to seed database: ' + err.message });
  }
});

// Departments list
router.get('/departments', async (req, res) => {
  try {
    const list = await db.select().from(departments);
    res.json(list);
  } catch (err: any) {
    console.error('Error fetching departments:', err);
    res.status(500).json({ error: 'Failed to fetch departments' });
  }
});

// Aggregate Platform Statistics
router.get('/stats', async (req, res) => {
  try {
    const all = await db.select().from(complaints);
    const total = all.length;
    const urgent = all.filter((c) => c.priorityScore >= 80 || c.priorityTier === 'Critical').length;
    const resolved = all.filter((c) => c.status === 'Resolved Awaiting Verification' || c.status === 'Closed').length;
    const inProgress = all.filter((c) => c.status === 'In Progress' || c.status === 'Assigned').length;
    const duplicates = all.filter((c) => c.isDuplicate).length;

    // Categories Breakdown
    const categoryMap: Record<string, number> = {};
    for (const c of all) {
      categoryMap[c.category] = (categoryMap[c.category] || 0) + 1;
    }
    const categoryBreakdown = Object.entries(categoryMap).map(([name, count]) => ({ name, count }));

    // Status Breakdown
    const statusMap: Record<string, number> = {};
    for (const c of all) {
      statusMap[c.status] = (statusMap[c.status] || 0) + 1;
    }
    const statusBreakdown = Object.entries(statusMap).map(([name, count]) => ({ name, count }));

    // Priority Distribution
    const priorityDistribution = [
      { tier: 'Low (0-40)', count: all.filter((c) => c.priorityScore <= 40).length },
      { tier: 'Medium (41-70)', count: all.filter((c) => c.priorityScore > 40 && c.priorityScore <= 70).length },
      { tier: 'High (71-85)', count: all.filter((c) => c.priorityScore > 70 && c.priorityScore <= 85).length },
      { tier: 'Critical (86-100)', count: all.filter((c) => c.priorityScore > 85).length },
    ];

    res.json({
      total,
      urgent,
      resolved,
      inProgress,
      duplicates,
      categoryBreakdown,
      statusBreakdown,
      priorityDistribution,
    });
  } catch (err: any) {
    console.error('Error fetching stats:', err);
    res.status(500).json({ error: 'Failed to fetch platform metrics' });
  }
});

// Complaints Listing
router.get('/complaints', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { category, status, departmentId, viewMine } = req.query;

    const all = await db.select().from(complaints).orderBy(desc(complaints.createdAt));

    let filtered = all;

    // If citizen requests only their complaints
    if (viewMine === 'true' && req.user) {
      filtered = filtered.filter((c) => c.citizenId === req.user?.uid);
    } else if (req.user?.role === 'officer' && req.user.departmentId) {
      // Officer dashboard: by default highlight department complaints
      if (req.query.all !== 'true') {
        filtered = filtered.filter((c) => c.departmentId === req.user?.departmentId);
      }
    }

    if (category) {
      filtered = filtered.filter((c) => c.category === category);
    }
    if (status) {
      filtered = filtered.filter((c) => c.status === status);
    }
    if (departmentId) {
      filtered = filtered.filter((c) => c.departmentId === Number(departmentId));
    }

    res.json(filtered);
  } catch (err: any) {
    console.error('Error fetching complaints:', err);
    res.status(500).json({ error: 'Failed to query complaints' });
  }
});

// Complaint Details with AI Analysis, Status History, and Audit Logs
router.get('/complaints/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const found = await db.select().from(complaints).where(eq(complaints.complaintId, id)).limit(1);
    if (found.length === 0) {
      return res.status(404).json({ error: `Complaint ${id} not found` });
    }

    const complaint = found[0];

    // Fetch related AI Analysis
    const analysisRows = await db
      .select()
      .from(aiAnalysis)
      .where(eq(aiAnalysis.complaintId, id))
      .limit(1);

    // Fetch History & Logs
    const historyRows = await db
      .select()
      .from(statusHistory)
      .where(eq(statusHistory.complaintId, id))
      .orderBy(desc(statusHistory.createdAt));

    const logRows = await db
      .select()
      .from(auditLogs)
      .where(eq(auditLogs.complaintId, id))
      .orderBy(desc(auditLogs.createdAt));

    // Fetch duplicate parent if duplicate
    let duplicateParent = null;
    if (complaint.duplicateOfId) {
      const parent = await db
        .select()
        .from(complaints)
        .where(eq(complaints.complaintId, complaint.duplicateOfId))
        .limit(1);
      if (parent.length > 0) {
        duplicateParent = parent[0];
      }
    }

    res.json({
      complaint,
      analysis: analysisRows[0] || null,
      history: historyRows,
      logs: logRows,
      duplicateParent,
    });
  } catch (err: any) {
    console.error('Error fetching complaint details:', err);
    res.status(500).json({ error: 'Failed to fetch complaint details' });
  }
});

// Submit Complaint (Citizen flow with AI triage and duplicate detection)
router.post('/complaints', requireAuth, async (req: AuthRequest, res) => {
  try {
    const parseResult = CreateComplaintSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: parseResult.error.flatten(),
      });
    }

    const { title, description, category: userCat, location, latitude, longitude, evidenceUrls } =
      parseResult.data;

    const user = req.user!;

    // 1. Generate Next Complaint ID: PK-CIV-2026-XXXX
    const countResult = await db.select({ count: count() }).from(complaints);
    const nextSeq = (countResult[0]?.count || 0) + 1;
    const complaintId = `PK-CIV-2026-${String(nextSeq).padStart(4, '0')}`;

    // 2. Query existing active complaints for duplicate detection
    const existing = await db
      .select({
        complaintId: complaints.complaintId,
        title: complaints.title,
        description: complaints.description,
        category: complaints.category,
        latitude: complaints.latitude,
        longitude: complaints.longitude,
        status: complaints.status,
      })
      .from(complaints);

    // 3. Duplicate Detection Engine
    const duplicateCheck = detectDuplicates(
      {
        title,
        description,
        category: userCat,
        latitude,
        longitude,
      },
      existing
    );

    // 4. Run AI Triage Engine
    const hasEvidence = Boolean(evidenceUrls && evidenceUrls.length > 0);
    const existingCount = duplicateCheck.isDuplicateSuspect ? 2 : 1;
    const triage = await analyzeComplaint(title, description, existingCount, hasEvidence);

    // 5. Match department
    const depts = await db.select().from(departments);
    const triageDeptLower = (triage.department || '').toLowerCase();
    let matchedDept = depts.find(
      (d) =>
        d.name.toLowerCase().includes(triageDeptLower) ||
        triageDeptLower.includes(d.name.toLowerCase()) ||
        (triageDeptLower.includes('water') && d.name.toLowerCase().includes('water')) ||
        (triageDeptLower.includes('road') && d.name.toLowerCase().includes('road')) ||
        (triageDeptLower.includes('waste') && d.name.toLowerCase().includes('waste')) ||
        (triageDeptLower.includes('electric') && d.name.toLowerCase().includes('electric')) ||
        (triageDeptLower.includes('power') && d.name.toLowerCase().includes('power'))
    );

    if (!matchedDept) {
      matchedDept = depts[0];
    }

    // Determine priority tier
    let priorityTier = 'Medium';
    if (triage.calculatedPriority >= 85) priorityTier = 'Critical';
    else if (triage.calculatedPriority >= 70) priorityTier = 'High';
    else if (triage.calculatedPriority <= 40) priorityTier = 'Low';

    // 6. Save Complaint in PostgreSQL
    const newComplaintRecord = {
      complaintId,
      title,
      description,
      category: triage.category || userCat,
      location,
      latitude,
      longitude,
      citizenId: user.uid,
      citizenName: user.name,
      citizenEmail: user.email,
      departmentId: matchedDept ? matchedDept.id : null,
      departmentName: matchedDept ? matchedDept.name : triage.department,
      status: 'Submitted',
      priorityScore: triage.calculatedPriority,
      priorityTier,
      isDuplicate: duplicateCheck.isDuplicateSuspect,
      duplicateOfId: duplicateCheck.suspectComplaintId,
      duplicateConfidence: duplicateCheck.similarityPercentage,
      evidenceUrls: evidenceUrls ? JSON.stringify(evidenceUrls) : null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.insert(complaints).values(newComplaintRecord);

    // 7. Save AI Analysis
    await db.insert(aiAnalysis).values({
      complaintId,
      category: triage.category,
      summary: triage.summary,
      department: triage.department,
      urgency: triage.urgency,
      confidence: triage.confidence,
      reasoning: triage.reasoning,
      safetyImpactScore: triage.safetyImpactScore,
      severityScore: triage.severityScore,
      reportCountScore: triage.reportCountScore,
      waitingTimeScore: triage.waitingTimeScore,
      evidenceScore: triage.evidenceScore,
      calculatedPriority: triage.calculatedPriority,
      duplicateSuspectId: duplicateCheck.suspectComplaintId,
      duplicateScore: duplicateCheck.similarityPercentage,
      duplicateReason: duplicateCheck.reason,
      createdAt: new Date(),
    });

    // 8. Write Audit Log
    await db.insert(auditLogs).values({
      complaintId,
      actorId: user.uid,
      actorName: user.name,
      actorRole: user.role,
      action: 'SUBMITTED',
      details: `Citizen submitted complaint ${complaintId}. AI calculated priority: ${triage.calculatedPriority}/100. ${
        duplicateCheck.isDuplicateSuspect
          ? `[DUPLICATE DETECTED] ${duplicateCheck.similarityPercentage}% similarity to ${duplicateCheck.suspectComplaintId}`
          : ''
      }`,
    });

    // 9. Write Status History
    await db.insert(statusHistory).values({
      complaintId,
      previousStatus: null,
      newStatus: 'Submitted',
      changedBy: user.name,
      changedByRole: user.role,
      note: 'Initial citizen intake verified and indexed by CivicFlow AI Engine.',
    });

    res.status(201).json({
      success: true,
      complaintId,
      complaint: newComplaintRecord,
      triage,
      duplicateCheck,
    });
  } catch (err: any) {
    console.error('Error submitting complaint:', err);
    res.status(500).json({ error: 'Failed to process and store complaint: ' + err.message });
  }
});

// Authority Dashboard: Triage Override / Assign / Priority Change
router.patch('/complaints/:id/triage', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { departmentId, priorityScore, status, notes } = req.body;

    const found = await db.select().from(complaints).where(eq(complaints.complaintId, id)).limit(1);
    if (found.length === 0) {
      return res.status(404).json({ error: 'Complaint not found' });
    }

    const current = found[0];
    const user = req.user!;

    let newDeptName = current.departmentName;
    if (departmentId) {
      const depts = await db.select().from(departments).where(eq(departments.id, Number(departmentId)));
      if (depts.length > 0) {
        newDeptName = depts[0].name;
      }
    }

    let priorityTier = current.priorityTier;
    if (priorityScore !== undefined) {
      const score = Number(priorityScore);
      if (score >= 85) priorityTier = 'Critical';
      else if (score >= 70) priorityTier = 'High';
      else if (score <= 40) priorityTier = 'Low';
      else priorityTier = 'Medium';
    }

    const newStatus = status || (current.status === 'Submitted' ? 'Assigned' : current.status);

    await db
      .update(complaints)
      .set({
        departmentId: departmentId ? Number(departmentId) : current.departmentId,
        departmentName: newDeptName,
        priorityScore: priorityScore !== undefined ? Number(priorityScore) : current.priorityScore,
        priorityTier,
        status: newStatus,
        updatedAt: new Date(),
      })
      .where(eq(complaints.complaintId, id));

    // Audit Log
    await db.insert(auditLogs).values({
      complaintId: id,
      actorId: user.uid,
      actorName: user.name,
      actorRole: user.role,
      action: 'AUTHORITY_TRIAGE_UPDATE',
      details: `Authority updated complaint: Dept=${newDeptName}, Priority=${priorityScore || current.priorityScore}, Status=${newStatus}. Notes: ${notes || 'Reviewed by Authority.'}`,
    });

    if (newStatus !== current.status) {
      await db.insert(statusHistory).values({
        complaintId: id,
        previousStatus: current.status,
        newStatus,
        changedBy: user.name,
        changedByRole: user.role,
        note: notes || `Authority reassigned complaint to ${newDeptName}.`,
      });
    }

    res.json({ success: true, message: 'Complaint triage updated successfully' });
  } catch (err: any) {
    console.error('Error updating triage:', err);
    res.status(500).json({ error: 'Failed to update complaint triage' });
  }
});

// Officer / Authority: Status Update
router.patch('/complaints/:id/status', requireAuth, requireRole(['authority', 'officer']), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { newStatus, note } = req.body;

    const validStatuses = [
      'Submitted',
      'Under Review',
      'Assigned',
      'In Progress',
      'Resolved Awaiting Verification',
      'Closed',
    ];

    if (!validStatuses.includes(newStatus)) {
      return res.status(400).json({ error: `Invalid status: ${newStatus}` });
    }

    const found = await db.select().from(complaints).where(eq(complaints.complaintId, id)).limit(1);
    if (found.length === 0) {
      return res.status(404).json({ error: 'Complaint not found' });
    }

    const current = found[0];
    const user = req.user!;

    await db
      .update(complaints)
      .set({
        status: newStatus,
        updatedAt: new Date(),
      })
      .where(eq(complaints.complaintId, id));

    // Audit log
    await db.insert(auditLogs).values({
      complaintId: id,
      actorId: user.uid,
      actorName: user.name,
      actorRole: user.role,
      action: 'STATUS_CHANGE',
      details: `Status changed from '${current.status}' to '${newStatus}'. Note: ${note || 'Status updated.'}`,
    });

    // Status history
    await db.insert(statusHistory).values({
      complaintId: id,
      previousStatus: current.status,
      newStatus,
      changedBy: user.name,
      changedByRole: user.role,
      note: note || `Status progressed to ${newStatus}.`,
    });

    res.json({ success: true, newStatus });
  } catch (err: any) {
    console.error('Error updating status:', err);
    res.status(500).json({ error: 'Failed to update complaint status' });
  }
});

// Department Officer: Submit Resolution Evidence
router.post('/complaints/:id/resolve', requireAuth, requireRole(['officer', 'authority']), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { resolutionNotes, resolutionEvidenceUrl } = req.body;

    if (!resolutionNotes || resolutionNotes.length < 5) {
      return res.status(400).json({ error: 'Resolution notes must be at least 5 characters' });
    }

    const found = await db.select().from(complaints).where(eq(complaints.complaintId, id)).limit(1);
    if (found.length === 0) {
      return res.status(404).json({ error: 'Complaint not found' });
    }

    const current = found[0];
    const user = req.user!;

    const newStatus = 'Resolved Awaiting Verification';

    await db
      .update(complaints)
      .set({
        status: newStatus,
        resolutionNotes,
        resolutionEvidenceUrl: resolutionEvidenceUrl || null,
        updatedAt: new Date(),
      })
      .where(eq(complaints.complaintId, id));

    // Audit log
    await db.insert(auditLogs).values({
      complaintId: id,
      actorId: user.uid,
      actorName: user.name,
      actorRole: user.role,
      action: 'RESOLUTION_SUBMITTED',
      details: `Officer ${user.name} submitted resolution evidence and marked awaiting citizen verification. Notes: ${resolutionNotes}`,
    });

    // Status history
    await db.insert(statusHistory).values({
      complaintId: id,
      previousStatus: current.status,
      newStatus,
      changedBy: user.name,
      changedByRole: user.role,
      note: `Field work completed: ${resolutionNotes}`,
    });

    res.json({ success: true, message: 'Resolution submitted for verification.' });
  } catch (err: any) {
    console.error('Error resolving complaint:', err);
    res.status(500).json({ error: 'Failed to submit resolution' });
  }
});

// Citizen or Authority: Verify and Close
router.post('/complaints/:id/verify', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { rating, feedback } = req.body;

    const found = await db.select().from(complaints).where(eq(complaints.complaintId, id)).limit(1);
    if (found.length === 0) {
      return res.status(404).json({ error: 'Complaint not found' });
    }

    const current = found[0];
    const user = req.user!;

    const newStatus = 'Closed';

    await db
      .update(complaints)
      .set({
        status: newStatus,
        updatedAt: new Date(),
      })
      .where(eq(complaints.complaintId, id));

    await db.insert(auditLogs).values({
      complaintId: id,
      actorId: user.uid,
      actorName: user.name,
      actorRole: user.role,
      action: 'VERIFIED_AND_CLOSED',
      details: `Complaint verified and closed by ${user.name}. Citizen rating: ${rating || '5/5 stars'}. Feedback: ${feedback || 'Resolution confirmed satisfied.'}`,
    });

    await db.insert(statusHistory).values({
      complaintId: id,
      previousStatus: current.status,
      newStatus,
      changedBy: user.name,
      changedByRole: user.role,
      note: `Citizen verification confirmed. Case successfully closed.`,
    });

    res.json({ success: true, message: 'Complaint successfully verified and closed!' });
  } catch (err: any) {
    console.error('Error closing complaint:', err);
    res.status(500).json({ error: 'Failed to verify and close complaint' });
  }
});

export default router;
