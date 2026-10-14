import { GoogleGenAI } from '@google/genai';
import { z } from 'zod';

export const TriageOutputSchema = z.object({
  category: z.string(),
  summary: z.string(),
  department: z.string(),
  urgency: z.enum(['Low', 'Medium', 'High', 'Critical']),
  confidence: z.number().min(0).max(100),
  reasoning: z.string(),
  safetyImpactScore: z.number().min(0).max(100),
  severityScore: z.number().min(0).max(100),
  reportCountScore: z.number().min(0).max(100),
  waitingTimeScore: z.number().min(0).max(100),
  evidenceScore: z.number().min(0).max(100),
  calculatedPriority: z.number().min(0).max(100),
});

export type TriageOutput = z.infer<typeof TriageOutputSchema>;

// Rule-based analyzer with Pakistani civic infrastructure knowledge (WASA, K-Electric/LESCO, C&W, Solid Waste)
export function analyzeComplaintRuleBased(
  title: string,
  description: string,
  existingReportCount = 1,
  hasEvidence = false
): TriageOutput {
  const text = `${title} ${description}`.toLowerCase();

  let category = 'Roads and Infrastructure (C&W / KMC)';
  let department = 'Roads & Infrastructure (C&W / KMC)';
  let urgency: 'Low' | 'Medium' | 'High' | 'Critical' = 'Medium';
  let safetyImpact = 50;
  let severity = 55;
  let reasoning = 'Civic issue categorized for municipal action based on Pakistani urban infrastructure guidelines.';

  // 1. Electrical / Power Supply (K-Electric / LESCO / IESCO / WAPDA)
  if (
    text.includes('pmt') ||
    text.includes('transformer') ||
    text.includes('kunda') ||
    text.includes('electric') ||
    text.includes('bijli') ||
    text.includes('wire') ||
    text.includes('tar') ||
    text.includes('shock') ||
    text.includes('spark') ||
    text.includes('pole') ||
    text.includes('streetlight') ||
    text.includes('light') ||
    text.includes('andhera')
  ) {
    category = 'Electric & Public Power (K-Electric / LESCO / WAPDA)';
    department = 'Electric & Public Power (K-Electric / LESCO / WAPDA)';
    if (
      text.includes('spark') ||
      text.includes('live wire') ||
      text.includes('pmt') ||
      text.includes('shock') ||
      text.includes('dangling') ||
      text.includes('exposed')
    ) {
      urgency = 'Critical';
      safetyImpact = 96;
      severity = 92;
      reasoning = 'Exposed high-voltage wire or sparking PMT transformer creates fatal electrocution hazard for pedestrians in residential sector.';
    } else {
      urgency = 'High';
      safetyImpact = 70;
      severity = 65;
      reasoning = 'Faulty streetlights or loose wiring increase nighttime road accident and security risks.';
    }
  }
  // 2. Water & Sanitation Agency (WASA / KWSB) - Gutter covers, sewage, dirty water
  else if (
    text.includes('gutter') ||
    text.includes('manhole') ||
    text.includes('dhakkan') ||
    text.includes('nullah') ||
    text.includes('sewage') ||
    text.includes('sewer') ||
    text.includes('wasa') ||
    text.includes('kwsb') ||
    text.includes('pani') ||
    text.includes('water') ||
    text.includes('leak') ||
    text.includes('pipe') ||
    text.includes('drain') ||
    text.includes('ganda')
  ) {
    category = 'Water & Sanitation Agency (WASA / KWSB)';
    department = 'Water & Sanitation Agency (WASA / KWSB)';
    if (
      text.includes('open gutter') ||
      text.includes('missing cover') ||
      text.includes('manhole') ||
      text.includes('dhakkan') ||
      text.includes('fall') ||
      text.includes('children') ||
      text.includes('school')
    ) {
      urgency = 'Critical';
      safetyImpact = 95;
      severity = 88;
      reasoning = 'Open manhole (missing gutter cover) is an extreme life-threatening hazard where children or motorbikes can fall into deep sewerage.';
    } else if (text.includes('contaminated') || text.includes('ganda pani') || text.includes('mixing') || text.includes('burst')) {
      urgency = 'High';
      safetyImpact = 82;
      severity = 80;
      reasoning = 'Sewage mixing into municipal drinking water lines poses waterborne disease outbreak risks across mohallah.';
    } else {
      urgency = 'Medium';
      safetyImpact = 60;
      severity = 65;
      reasoning = 'Localized water supply line leakage or choked street drain requiring suction truck.';
    }
  }
  // 3. Solid Waste Management (LWMC / SSWMB / Municipal Sanitation)
  else if (
    text.includes('kachra') ||
    text.includes('garbage') ||
    text.includes('trash') ||
    text.includes('kundi') ||
    text.includes('dump') ||
    text.includes('badboo') ||
    text.includes('smell') ||
    text.includes('waste') ||
    text.includes('sanitation')
  ) {
    category = 'Solid Waste Management (LWMC / SSWMB)';
    department = 'Solid Waste Management (LWMC / SSWMB)';
    if (text.includes('hospital') || text.includes('plot') || text.includes('huge') || text.includes('road blocked')) {
      urgency = 'High';
      safetyImpact = 75;
      severity = 78;
      reasoning = 'Uncollected kachra kundi overflowing onto roadway attracting stray animals and blocking neighborhood traffic.';
    } else {
      urgency = 'Medium';
      safetyImpact = 55;
      severity = 60;
      reasoning = 'Street garbage container backlog requiring waste compactor pickup dispatch.';
    }
  }
  // 4. Roads and Infrastructure (C&W / KMC / LDA)
  else {
    category = 'Roads & Infrastructure (C&W / KMC)';
    department = 'Roads & Infrastructure (C&W / KMC)';
    if (text.includes('accident') || text.includes('bike') || text.includes('crater') || text.includes('heavy') || text.includes('monsoon')) {
      urgency = 'High';
      safetyImpact = 84;
      severity = 82;
      reasoning = 'Severe road crater on high-speed traffic lane causing motorcycle skids and vehicle axle breakdown.';
    } else {
      urgency = 'Medium';
      safetyImpact = 60;
      severity = 55;
      reasoning = 'Road surface damage requiring asphalt patchwork and grading.';
    }
  }

  // Weighting factors:
  // Safety impact: 35%
  // Severity: 25%
  // Number of reports: 20%
  // Waiting time: 10%
  // Evidence: 10%
  const reportCountScore = Math.min(100, existingReportCount * 25);
  const waitingTimeScore = 35;
  const evidenceScore = hasEvidence ? 85 : 40;

  const rawScore =
    safetyImpact * 0.35 +
    severity * 0.25 +
    reportCountScore * 0.2 +
    waitingTimeScore * 0.1 +
    evidenceScore * 0.1;

  const calculatedPriority = Math.round(rawScore);

  let summary = title;
  if (description.length > 20) {
    summary = `${title} — ${description.slice(0, 110)}...`;
  }

  return {
    category,
    summary,
    department,
    urgency,
    confidence: 93,
    reasoning,
    safetyImpactScore: safetyImpact,
    severityScore: severity,
    reportCountScore,
    waitingTimeScore,
    evidenceScore,
    calculatedPriority,
  };
}

export async function analyzeComplaint(
  title: string,
  description: string,
  existingReportCount = 1,
  hasEvidence = false
): Promise<TriageOutput> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `You are CivicFlow AI Pakistan, an automated civic complaint triage system for municipal government across Pakistan (Karachi, Lahore, Islamabad, Rawalpindi, Peshawar, etc.).
Analyze this Pakistani civic complaint:
Title: "${title}"
Description: "${description}"
Has Evidence Photo: ${hasEvidence ? 'Yes' : 'No'}
Nearby Citizen Reports: ${existingReportCount}

Available Departments:
- "Roads & Infrastructure (C&W / KMC)" (potholes, road damage, footpaths, bridges)
- "Water & Sanitation Agency (WASA / KWSB)" (open gutters, missing manhole covers, dirty tap water, burst pipes, sewage overflow)
- "Solid Waste Management (LWMC / SSWMB)" (uncollected garbage, kachra kundi, illegal dumping)
- "Electric & Public Power (K-Electric / LESCO / WAPDA)" (sparking PMT transformers, live wires, kunda hazard, streetlights)

Important: Open manholes (missing gutter covers) and sparking PMT/wires must be marked 'Critical' due to extreme danger of drowning/electrocution in Pakistan!

Return valid JSON conforming to:
{
  "category": "Roads & Infrastructure (C&W / KMC)" | "Water & Sanitation Agency (WASA / KWSB)" | "Solid Waste Management (LWMC / SSWMB)" | "Electric & Public Power (K-Electric / LESCO / WAPDA)",
  "department": "Roads & Infrastructure (C&W / KMC)" | "Water & Sanitation Agency (WASA / KWSB)" | "Solid Waste Management (LWMC / SSWMB)" | "Electric & Public Power (K-Electric / LESCO / WAPDA)",
  "summary": "Concise 1 sentence summary",
  "urgency": "Low" | "Medium" | "High" | "Critical",
  "confidence": integer 75-99,
  "reasoning": "Clear explanation of Pakistani civic priority",
  "safetyImpactScore": integer 0-100 (weight 35%),
  "severityScore": integer 0-100 (weight 25%),
  "reportCountScore": integer 0-100 (weight 20%),
  "waitingTimeScore": integer 0-100 (weight 10%),
  "evidenceScore": integer 0-100 (weight 10%),
  "calculatedPriority": integer 0-100
}
Return only JSON with no markdown tags.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      const text = response.text?.trim() || '';
      const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);
      const validated = TriageOutputSchema.parse(parsed);
      return validated;
    } catch (err) {
      console.warn('Gemini triage fallback triggered:', err);
    }
  }

  // Rule-based fallback
  return analyzeComplaintRuleBased(title, description, existingReportCount, hasEvidence);
}
