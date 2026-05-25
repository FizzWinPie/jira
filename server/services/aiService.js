import { GoogleGenAI } from '@google/genai';

const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

const SYSTEM_PROMPT = `You are an IT Change Management assistant for Southwest Airlines (SWA).
Given a Jira ticket, produce a structured change request draft suitable for CAB review.
Respond ONLY with valid JSON (no markdown fences) using this exact shape:
{
  "title": "string - concise change title",
  "priority": "Low|Medium|High|Critical",
  "environment": "Development|Staging|Production",
  "riskLevel": "Low|Medium|High",
  "draft": "string - 2-4 paragraph narrative: business context, technical change, impact, testing",
  "implementationPlan": "string - numbered steps",
  "rollbackPlan": "string - numbered rollback steps"
}
Use Southwest Airlines terminology (stations, IRROPS, Rapid Rewards, crew, gates).
Be specific to the ticket; do not invent systems not implied by the ticket.`;

function buildTicketContext(ticket) {
  return JSON.stringify(
    {
      key: ticket.key,
      summary: ticket.summary,
      description: ticket.description,
      type: ticket.type,
      priority: ticket.priority,
      status: ticket.status,
      assignee: ticket.assignee,
      epic: ticket.epic,
      labels: ticket.labels,
      storyPoints: ticket.storyPoints,
      acceptanceCriteria: ticket.acceptanceCriteria,
    },
    null,
    2
  );
}

function extractJson(text) {
  if (!text) return null;
  const trimmed = text.trim();
  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = fence ? fence[1].trim() : trimmed;
  try {
    return JSON.parse(raw);
  } catch {
    const start = raw.indexOf('{');
    const end = raw.lastIndexOf('}');
    if (start >= 0 && end > start) {
      return JSON.parse(raw.slice(start, end + 1));
    }
    throw new Error('Could not parse AI response as JSON');
  }
}

function mockDraft(ticket) {
  const env =
    ticket.labels?.includes('finance') || ticket.priority === 'Critical'
      ? 'Production'
      : 'Staging';
  return {
    title: `CR: ${ticket.summary}`,
    priority: ticket.priority === 'Critical' ? 'High' : ticket.priority,
    environment: env,
    riskLevel: ticket.priority === 'Critical' ? 'High' : 'Medium',
    draft: `## Change Request for ${ticket.key}\n\n**Business context:** ${ticket.summary}\n\n${ticket.description}\n\nThis change supports the ${ticket.epic || 'Operations'} initiative at Southwest Airlines. Impacted areas include systems tagged: ${(ticket.labels || []).join(', ') || 'general'}.\n\n**Technical scope:** Implementation will follow SWA change windows (Tue–Thu, 22:00–04:00 CT for Production). Validation will cover acceptance criteria from the Jira story.\n\n**Customer & ops impact:** Minimal expected disruption; communications plan to be coordinated with Operations Control if customer-facing.`,
    implementationPlan: `1. Review and approve change request in ServiceNow\n2. Deploy to ${env} during approved window\n3. Execute smoke tests per acceptance criteria\n4. Monitor for 2 hours post-change\n5. Close CR with evidence attached`,
    rollbackPlan: `1. Stop deployment pipeline if in progress\n2. Revert to previous release artifact\n3. Restore configuration from last known good backup\n4. Validate rollback via automated health checks\n5. Notify CAB and ticket assignee (${ticket.assignee})`,
  };
}

export async function generateChangeRequestDraft(ticket) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return { ...mockDraft(ticket), source: 'mock' };
  }

  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: `Jira ticket:\n${buildTicketContext(ticket)}`,
    config: {
      systemInstruction: SYSTEM_PROMPT,
      temperature: 0.4,
      maxOutputTokens: 2048,
    },
  });

  const content =
    response?.text ?? response?.candidates?.[0]?.content?.parts?.[0]?.text;
  const parsed = extractJson(content);
  if (!parsed?.draft) {
    return { ...mockDraft(ticket), source: 'mock-fallback' };
  }
  return { ...parsed, source: 'gemini' };
}
