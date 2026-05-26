import { GoogleGenAI } from '@google/genai';
import {
  buildChangeMetadata,
  buildPlanningContent,
  inferChangeType,
  inferEnvironment,
  pickOwningGroup,
} from '../utils/changeRequestDefaults.js';

const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

const SYSTEM_PROMPT = `You are an IT Change Management assistant for Southwest Airlines (SWA).
Given a Jira ticket, produce change request planning content for CAB review.
Respond ONLY with valid JSON (no markdown fences) using this exact shape:
{
  "title": "string - concise change title",
  "changeType": "Normal|Standard|Informational|Emergency",
  "environment": "QA|PROD",
  "owningGroup": "one of: adfs_dev, cds_dev, southwest.com, oqs support, network_ops, crew_systems",
  "planning": {
    "detailedDescription": "string - multi-paragraph technical and business detail from the Jira ticket",
    "businessJustification": "string - additional CAB narrative only (business drivers, stakeholders, impact). Do NOT include the seven RAISE questions (Who raised, Reason, Return, Risks, Resources, Responsible, Relationship); the system adds those automatically.",
    "implementationPlan": "string - numbered implementation steps",
    "changeValidationPlan": "string - numbered validation and test steps tied to acceptance criteria",
    "remediationBackoutPlan": "string - numbered rollback/remediation steps"
  }
}
Every planning field MUST be non-empty, specific to the Jira ticket, and use SWA terminology (stations, IRROPS, Rapid Rewards, crew, gates).`;

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

/** Map legacy flat AI keys into planning shape */
function normalizeAiPayload(parsed) {
  const p = parsed.planning || {};
  return {
    draft: p.detailedDescription || parsed.draft || parsed.detailedDescription,
    businessJustification: p.businessJustification || parsed.businessJustification,
    implementationPlan: p.implementationPlan || parsed.implementationPlan,
    changeValidationPlan: p.changeValidationPlan || parsed.changeValidationPlan,
    rollbackPlan:
      p.remediationBackoutPlan || parsed.rollbackPlan || parsed.remediationBackoutPlan,
  };
}

function mockAiPayload(ticket) {
  const env = inferEnvironment(ticket);
  const owningGroup = pickOwningGroup(ticket);
  return {
    draft: `Detailed description — ${ticket.key}\n\n${ticket.summary}\n\n${ticket.description}\n\nEpic: ${ticket.epic || 'N/A'}. Type: ${ticket.type}. Priority: ${ticket.priority}.\n\nTechnical scope: Change will be implemented by ${owningGroup} in the ${env} environment during an approved SWA maintenance window. Work is traced to Jira ${ticket.key} and must satisfy all acceptance criteria before production promotion.\n\nSystems and labels: ${(ticket.labels || []).join(', ') || 'general application stack'}.`,
    businessJustification: `Additional context — ${ticket.key}\n\n${ticket.description}\n\nSupports ${ticket.epic || 'Operations'} at ${ticket.priority} priority.`,
    implementationPlan: `1. Review ${ticket.key} requirements with ${ticket.assignee || 'change owner'}\n2. Obtain CAB approval for ${env} deployment\n3. Execute pre-change checklist for ${owningGroup}\n4. Deploy during approved maintenance window\n5. Run post-deploy validation\n6. Update change state to Completed`,
    changeValidationPlan:
      (ticket.acceptanceCriteria || []).length > 0
        ? `Validation for ${ticket.key}:\n${(ticket.acceptanceCriteria || []).map((c, i) => `${i + 1}. ${c}`).join('\n')}\n\nAdditional checks: smoke tests, monitoring for 2 hours, confirm no IRROPS regression.`
        : `1. Smoke test core flows in ${env}\n2. Verify monitoring dashboards green for 2 hours\n3. Confirm rollback artifact available\n4. Document results in change record`,
    rollbackPlan: `1. Stop in-progress deployment for ${ticket.key}\n2. Revert to previous known-good build/config\n3. Validate service health in ${env}\n4. Notify ${owningGroup} and ${ticket.assignee || 'change owner'}\n5. Open problem record if customer impact detected`,
  };
}

function buildResult(ticket, parsed, source, options = {}) {
  const meta = buildChangeMetadata(ticket);
  const aiFields = normalizeAiPayload(parsed);
  const planning = buildPlanningContent(ticket, aiFields, options);

  return {
    title: parsed.title || ticket.summary,
    changeType: parsed.changeType || meta.changeType,
    environment: ['QA', 'PROD'].includes(parsed.environment)
      ? parsed.environment
      : meta.environment,
    owningGroup: parsed.owningGroup || meta.owningGroup,
    planning,
    source,
  };
}

/**
 * Generate all planning fields from Jira via AI (Gemini) or Jira-aware mock.
 */
export async function generatePlanningFromJira(ticket, options = {}) {
  const useMock = process.env.USE_MOCK_AI === 'true';
  const apiKey = process.env.GEMINI_API_KEY;

  if (useMock || !apiKey) {
    return buildResult(ticket, { ...mockAiPayload(ticket) }, 'mock', options);
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: `Jira ticket:\n${buildTicketContext(ticket)}`,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        temperature: 0.4,
        maxOutputTokens: 3072,
      },
    });

    const content =
      response?.text ?? response?.candidates?.[0]?.content?.parts?.[0]?.text;
    const parsed = extractJson(content);
    const planning = parsed?.planning || parsed;
    const hasPlanning =
      planning?.detailedDescription ||
      parsed?.draft ||
      planning?.implementationPlan;

    if (!hasPlanning) {
      return buildResult(ticket, mockAiPayload(ticket), 'mock-fallback', options);
    }

    return buildResult(ticket, parsed, 'gemini', options);
  } catch (err) {
    if (isQuotaError(err)) {
      return buildResult(ticket, mockAiPayload(ticket), 'mock-quota', options);
    }
    throw err;
  }
}

/** @deprecated alias */
export const generateChangeRequestDraft = generatePlanningFromJira;
