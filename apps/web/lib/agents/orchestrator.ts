import { Idea, ProjectGraph, ResearchReport } from "../zodSchemas";
import { pmAgent } from "./pmAgent";
import { beAgent } from "./beAgent";
import { feAgent } from "./feAgent";
import { uiAgent } from "./uiAgent";
import { researchAgent } from "./researchAgent";

/**
 * Orchestrator Agent
 * Coordinates all other agents and manages the overall generation flow
 */

export type GenerationRequest = {
  idea: Idea;
  graph: ProjectGraph;
  research?: ResearchReport;
};

export type GenerationResult = {
  prd: any;
  backendSpec: any;
  frontendSpec: any;
  uiSpec: any;
  research?: ResearchReport;
};

export const orchestrator = {
  /**
   * Full generation pipeline
   * 1. (Optional) Research
   * 2. PRD
   * 3. Backend Spec
   * 4. Frontend Spec
   * 5. UI Spec
   */
  async generate(request: GenerationRequest): Promise<GenerationResult> {
    console.log("[Orchestrator] Starting generation pipeline...");

    // Step 1: Research (if needed)
    let research = request.research;
    if (!research) {
      console.log("[Orchestrator] Running research agent...");
      research = await researchAgent.generate({
        query: request.idea.pitch,
        topics: request.idea.coreFeatures,
      });
    }

    // Step 2: PRD
    console.log("[Orchestrator] Generating PRD...");
    const prd = await pmAgent.generate({
      idea: request.idea,
      graph: request.graph,
      research,
    });

    // Step 3: Backend Spec
    console.log("[Orchestrator] Generating Backend Spec...");
    const backendSpec = await beAgent.generate({
      prd,
      graph: request.graph,
    });

    // Step 4: Frontend Spec
    console.log("[Orchestrator] Generating Frontend Spec...");
    const frontendSpec = await feAgent.generate({
      prd,
      backendSpec,
      graph: request.graph,
    });

    // Step 5: UI Spec
    console.log("[Orchestrator] Generating UI Spec...");
    const uiSpec = await uiAgent.generate({
      prd,
      frontendSpec,
    });

    console.log("[Orchestrator] Generation complete!");

    return {
      prd,
      backendSpec,
      frontendSpec,
      uiSpec,
      research,
    };
  },
};
