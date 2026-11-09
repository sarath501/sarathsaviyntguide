import { createFileRoute, redirect } from "@tanstack/react-router";

// The AI Tutor is temporarily unavailable because its AI provider is not confirmed
// to be configured and working. Keep the legacy URL safe by sending learners to
// the Learning Center rather than showing a broken page.
export const Route = createFileRoute("/_authenticated/tutor")({
  beforeLoad: () => {
    throw redirect({ to: "/learn" });
  },
});
