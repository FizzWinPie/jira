import { GoogleGenAI } from '@google/genai';
import {
  buildChangeMetadata,
  inferChangeType,
  inferEnvironment,
  pickOwningGroup,
} from '../utils/changeRequestDefaults.js';

const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

const SYSTEM_PROMPT = `You are an IT Change Management assistant for Southwest Airlines (SWA).
Given a Jira ticket, produce a structured change request draft suitable for CAB review.
Respond ONLY with valid JSON (no markdown fences) using this exact shape:
{
  "title": "string - concise change title",
  "changeType": "Normal|Standard|Informational|Emergency",
  "environment": "QA|PROD",
  "owningGroup": "one of: adfs_dev, cds_dev, southwest.com, oqs support, network_ops, crew_systems",
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

function isQuotaError(err) {
  const msg = err?.message || String(err);
  return msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED') || msg.includes('quota');
}

function mockDraft(ticket) {
  const env = inferEnvironment(ticket);
  const changeType = inferChangeType(ticket);
  const owningGroup = pickOwningGroup(ticket);
  return {
    title: ticket.summary,
    changeType,
    environment: env,
    owningGroup,
    draft: `Change Request — ${ticket.key}\n\nBusiness context\n${ticket.summary}\n\n${ticket.description}\n\nThis change supports the ${ticket.epic || 'Operations'} program. Systems impacted: ${(ticket.labels || []).join(', ') || 'general'}.\n\nTechnical scope\nImplementation follows SWA change windows. Environment: ${env}. Owning group: ${owningGroup}. Validation against Jira acceptance criteria before PROD promotion.\n\nImpact\nOperations and customer impact assessed as low-to-medium unless IRROPS or customer-facing channels are involved.`,
    implementationPlan: `1. CAB review and approval\n2. Deploy to ${env} in approved window\n3. Execute smoke and regression tests\n4. Monitor for 2 hours post-change\n5. Update state to Completed and attach evidence`,
    rollbackPlan: `1. Halt pipeline if deployment in progress\n2. Revert to previous release/build\n3. Restore last known good configuration\n4. Run automated health checks\n5. Notify owning group and ${ticket.assignee || 'change owner'}`,
  };
}

export async function generateChangeRequestDraft(ticket) {
  const useMock = process.env.USE_MOCK_AI === 'true';
  const apiKey = process.env.GEMINI_API_KEY;

  if (useMock || !apiKey) {
    return { ...mockDraft(ticket), source: 'mock' };
  }

  try {
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
    const meta = buildChangeMetadata(ticket);
    return {
      ...parsed,
      changeType: parsed.changeType || meta.changeType,
      environment: ['QA', 'PROD'].includes(parsed.environment)
        ? parsed.environment
        : meta.environment,
      owningGroup: parsed.owningGroup || meta.owningGroup,
      source: 'gemini',
    };
  } catch (err) {
    if (isQuotaError(err)) {
      return { ...mockDraft(ticket), source: 'mock-quota' };
    }
    throw err;
  }
}
