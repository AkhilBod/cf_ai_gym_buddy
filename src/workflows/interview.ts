import { WorkflowEntrypoint, WorkflowStep, WorkflowEvent } from "cloudflare:workers";

export class InterviewWorkflow extends WorkflowEntrypoint {
  async run(event: WorkflowEvent, step: WorkflowStep) {
    // Step 1: send initial question (placeholder – real app would integrate with DO or notifications)
    const role = event.params?.role || "software";
    await step.do("generate question", async () => {
      // noop: In a full app you'd call env.AI here; Workflows can't access env directly in this stub
      return `What's a recent project where you used ${role} skills?`;
    });

    // Step 2: wait for "answer" event (demo)
    await step.sleep("wait for answer", "10 seconds");

    // Step 3: evaluate (placeholder scoring to demonstrate orchestration)
    const result = await step.do("evaluate", async () => {
      return { score: 4, pros: "Clear structure", cons: "Could be more specific" };
    });

    // Step 4: save/emit
    await step.do("persist", async () => result);
  }
}
