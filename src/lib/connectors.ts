import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const CONNECTOR_CATEGORIES = [
  "Directory Services",
  "HR Systems",
  "ERP Systems",
  "Database Connectors",
  "REST and API Connectors",
  "Cloud Applications",
  "File Transfer Integrations",
  "ITSM Applications",
  "Security and Privileged Access Systems",
] as const;

export const INTERVIEW_LEVELS = ["Beginner", "Intermediate", "Advanced", "Senior Engineer", "Architect"] as const;

export type ArchNode = { label: string; detail: string; zone: "source" | "security" | "saviynt" | "target" };
export type ConnectorContent = {
  overview?: { what: string; why: string; problem: string; retrieves: string[]; sends: string[]; governance: string[]; whereUsed: string };
  supportNote?: string;
  useCases?: string[];
  architecture?: { nodes: ArchNode[]; inbound: string[]; outbound: string[]; notes: string };
  parameters?: { name: string; description: string; status: string; example: string; source: string; security: string; troubleshooting: string }[];
  security?: { auth: string[]; serviceAccount: string; network: string; rotation: string };
  permissions?: { operation: string; permission: string; purpose: string; risk: string }[];
  endpoint?: string;
  imports?: { name: string; purpose: string; input: string; sequence: string; prerequisites: string; mapping: string; correlation: string; output: string; validation: string; errors: string }[];
  provisioning?: { operation: string; support: string; useCase: string; workflow: string; permissions: string; example: string; response: string; validation: string; errorHandling: string }[];
  scheduling?: { sequence: string[]; notes: string };
  troubleshooting?: { error: string; cause: string; investigation: string; validation: string; resolution: string; prevention: string; interview: string }[];
  scenarios?: { title: string; requirement: string; architecture: string; prerequisites: string; configuration: string; import: string; correlation: string; provisioning: string; testing: string; deployment: string; support: string }[];
  lab?: { title: string; task: string; question: string; options: string[]; answer: number; expected: string; explanation: string }[];
  interview?: { level: string; q: string; a: string }[];
  compare?: { integrationType: string; auth: string; primaryData: string; importCap: string; provisioningCap: string; typicalUse: string; complexity: string };
};

export type Connector = {
  id: string;
  name: string;
  category: string;
  support_type: string;
  difficulty: string;
  summary: string;
  position: number;
  published: boolean;
  content: ConnectorContent;
};

/** Learning sections tracked for progress on each connector page. */
export const CONNECTOR_SECTIONS = [
  ["intro", "Introduction"],
  ["architecture", "Architecture"],
  ["parameters", "Connection parameters"],
  ["security", "Security"],
  ["endpoint", "Endpoint"],
  ["imports", "Import jobs"],
  ["provisioning", "Provisioning"],
  ["scheduling", "Job scheduling"],
  ["troubleshooting", "Troubleshooting"],
  ["scenarios", "Use cases"],
  ["lab", "Implementation lab"],
  ["interview", "Interview prep"],
] as const;

export function connectorProgressPct(sectionsDone: string[] | undefined) {
  const valid = new Set<string>(CONNECTOR_SECTIONS.map(([k]) => k));
  const done = new Set((sectionsDone ?? []).filter((s) => valid.has(s)));
  return Math.round((done.size / CONNECTOR_SECTIONS.length) * 100);
}

export function useConnectors() {
  return useQuery({
    queryKey: ["connectors"],
    queryFn: async () => {
      const { data, error } = await supabase.from("connectors").select("*").order("position");
      if (error) throw error;
      return (data ?? []) as unknown as Connector[];
    },
  });
}

export function useConnectorProgress() {
  return useQuery({
    queryKey: ["connector-progress"],
    queryFn: async () => {
      const [p, b] = await Promise.all([
        supabase.from("connector_progress").select("connector_id,sections_done,lab_done"),
        supabase.from("connector_bookmarks").select("connector_id"),
      ]);
      return {
        progress: Object.fromEntries((p.data ?? []).map((r) => [r.connector_id, r])) as Record<string, { connector_id: string; sections_done: string[]; lab_done: boolean }>,
        bookmarks: new Set((b.data ?? []).map((r) => r.connector_id)),
      };
    },
  });
}
