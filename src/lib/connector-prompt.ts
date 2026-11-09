// Prompts used to author connector learning content (admin AI generation and bulk authoring).
export const CONNECTOR_SHAPE_A = `{"overview": {"what": string (markdown), "why": string (markdown), "problem": string, "retrieves": [string], "sends": [string], "governance": [string], "whereUsed": string},
"supportNote": string (markdown: HOW Saviynt integrates with this system — dedicated connector, standard connector framework (e.g. REST/DB/LDAP connector), REST/API integration, database integration, file-based or custom integration. Say "verify against current Saviynt documentation" where unsure),
"useCases": [string] (4-6),
"architecture": {"nodes": [{"label": string, "detail": string, "zone": "source"|"security"|"saviynt"|"target"}] (8-11, in data-flow order from source system through auth/network, connector, connection, endpoint, import jobs, correlation, entitlements, governance, provisioning, target), "inbound": [string] (4-6 inbound flow steps), "outbound": [string] (4-6 outbound/provisioning flow steps), "notes": string (markdown explaining each component)},
"parameters": [{"name": string, "description": string, "status": "Required"|"Conditional"|"Optional", "example": string, "source": string (where to obtain it), "security": string, "troubleshooting": string}] (8-14, ONLY parameters relevant to this system and its auth method; describe them as generic technical settings, NOT invented Saviynt JSON property names — if you cite a Saviynt property name you are confident exists (e.g. ConnectionJSON, ImportAccountEntJSON, CreateAccountJSON, URL, USERNAME, PASSWORD, BASECONTAINER) add "(verify in your Saviynt version)"),
"security": {"auth": [string], "serviceAccount": string (markdown), "network": string (markdown: ports, TLS, firewall, allowlisting), "rotation": string (markdown: credential storage/vault and rotation)},
"permissions": [{"operation": string, "permission": string, "purpose": string, "risk": string}] (6-10; distinguish read-only import vs provisioning permissions in the target system),
"endpoint": string (markdown: how the Saviynt application/endpoint/connection relate for this system, account & entitlement types, correlation, ownership; illustrative examples clearly labelled),
"imports": [{"name": string, "purpose": string, "input": string, "sequence": string, "prerequisites": string, "mapping": string, "correlation": string, "output": string, "validation": string, "errors": string}] (4-7, only those applicable),
"provisioning": [{"operation": string, "support": "Supported"|"Conditional"|"Not applicable", "useCase": string, "workflow": string, "permissions": string, "example": string (illustrative payload/config or ""), "response": string, "validation": string, "errorHandling": string}] (6-10, be honest about what is not applicable),
"scheduling": {"sequence": [string] (5-8 ordered job steps), "notes": string (markdown: full vs incremental, dependencies, frequency, history, retries, monitoring; note job names vary by Saviynt version)},
"compare": {"integrationType": string, "auth": string, "primaryData": string, "importCap": string, "provisioningCap": string, "typicalUse": string, "complexity": "Low"|"Medium"|"High"|"Very high"}}`;

export const CONNECTOR_SHAPE_B = `{"troubleshooting": [{"error": string (realistic message/symptom), "cause": string, "investigation": string, "validation": string (commands/API tests e.g. ldapsearch, curl, openssl s_client, nc, SQL), "resolution": string, "prevention": string, "interview": string}] (exactly 10),
"scenarios": [{"title": string, "requirement": string, "architecture": string, "prerequisites": string, "configuration": string, "import": string, "correlation": string, "provisioning": string, "testing": string, "deployment": string, "support": string}] (2),
"lab": [{"title": string, "task": string, "question": string, "options": [string,string,string], "answer": 0|1|2, "expected": string, "explanation": string}] (exactly 10 steps of an illustrative onboarding exercise using simulated, fictional values like corp.example.com),
"interview": [{"level": "Beginner"|"Intermediate"|"Advanced"|"Senior Engineer"|"Architect", "q": string, "a": string (detailed practical answer)}] (exactly 20, 4 per level, covering fundamentals, parameters, auth, endpoint, imports, provisioning, security, troubleshooting, scenarios)}`;

const BASE = `You are a principal Saviynt EIC integration architect writing a technical training reference for IAM consultants. Accuracy is critical:
- Never invent Saviynt-specific JSON keys, job names, API endpoints, permissions or capabilities. Describe standard technology facts (LDAP, OAuth, Graph, JDBC, SSH, SCIM) precisely, and label Saviynt-specific details as "verify against your Saviynt version" when not certain.
- Clearly separate official Saviynt capability, standard technology capability, general implementation practice and illustrative examples.
- Use only fictional values (example.com, contoso-like names, placeholders such as <client-secret-ref>). No real credentials.
Output ONLY one JSON object (no code fences) with exactly this shape:\n`;

export const CONNECTOR_SYSTEM_A = BASE + CONNECTOR_SHAPE_A;
export const CONNECTOR_SYSTEM_B = BASE + CONNECTOR_SHAPE_B;

export function connectorPrompt(c: { name: string; category: string; support_type: string; summary: string }, guidance?: string) {
  return `Connector / integration: ${c.name}\nCategory: ${c.category}\nHow it is typically integrated with Saviynt: ${c.support_type}\nSummary: ${c.summary}\n${guidance ? `Instructor guidance: ${guidance}\n` : ""}Write the JSON.`;
}

export function parseJson(text: string): Record<string, unknown> {
  const t = text.trim();
  return JSON.parse(t.slice(t.indexOf("{"), t.lastIndexOf("}") + 1));
}
