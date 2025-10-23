"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { UserPersona, Competitor } from "@/lib/zodSchemas";

type ProjectCreationWizardProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ProjectFormData) => Promise<void>;
  projectId?: string; // Optional: for editing existing drafts
};

export type ProjectFormData = {
  title: string;
  pitch: string;
  problem: string;
  solution: string;
  targetUsers: string[];
  userPersonas: UserPersona[];
  platforms: string[];
  coreFeatures: string[];
  competitors: Competitor[];
  constraints: string[];
  inspiration: string[];
  successMetrics: string[];
};

const STEPS = [
  { id: 0, name: "Discover", description: "Find trending app opportunities" },
  { id: 1, name: "Basics", description: "Project title and pitch" },
  { id: 2, name: "Problem & Solution", description: "What you're solving" },
  { id: 3, name: "Users", description: "Target audience" },
  { id: 4, name: "Features & Platforms", description: "Core capabilities" },
  { id: 5, name: "Competition", description: "Market landscape" },
  { id: 6, name: "Success & Constraints", description: "Goals and limitations" },
];

export function ProjectCreationWizard({ isOpen, onClose, onSubmit, projectId }: ProjectCreationWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState<string | null>(null);
  const [draftProjectId, setDraftProjectId] = useState<string | undefined>(projectId);

  // Step 0: Discovery state
  const [discoverQuery, setDiscoverQuery] = useState("");
  const [discoveredIdeas, setDiscoveredIdeas] = useState<any[]>([]);

  // Form state
  const [title, setTitle] = useState("");
  const [pitch, setPitch] = useState("");
  const [problem, setProblem] = useState("");
  const [solution, setSolution] = useState("");
  const [targetUsers, setTargetUsers] = useState("");
  const [platforms, setPlatforms] = useState<string[]>(["Web"]);
  const [coreFeatures, setCoreFeatures] = useState("");
  const [constraints, setConstraints] = useState("");
  const [inspiration, setInspiration] = useState("");
  const [successMetrics, setSuccessMetrics] = useState("");

  // User Personas
  const [personas, setPersonas] = useState<UserPersona[]>([
    { name: "", role: "", goals: [], painPoints: [] },
  ]);

  // Competitors
  const [competitors, setCompetitors] = useState<Competitor[]>([
    { name: "", strengths: [], weaknesses: [], url: null },
  ]);

  // Load existing draft data if projectId is provided
  useEffect(() => {
    async function loadDraft() {
      if (!projectId || !isOpen) return;

      try {
        const response = await fetch(`/api/projects/draft?projectId=${projectId}`);
        if (!response.ok) {
          throw new Error("Failed to load draft");
        }

        const data = await response.json();
        if (data.wizardData) {
          const wd = data.wizardData;

          // Load all form fields
          if (wd.title) setTitle(wd.title);
          if (wd.pitch) setPitch(wd.pitch);
          if (wd.problem) setProblem(wd.problem);
          if (wd.solution) setSolution(wd.solution);
          if (wd.targetUsers) setTargetUsers(Array.isArray(wd.targetUsers) ? wd.targetUsers.join("\n") : wd.targetUsers);
          if (wd.platforms) setPlatforms(wd.platforms);
          if (wd.coreFeatures) setCoreFeatures(Array.isArray(wd.coreFeatures) ? wd.coreFeatures.join("\n") : wd.coreFeatures);
          if (wd.constraints) setConstraints(Array.isArray(wd.constraints) ? wd.constraints.join("\n") : wd.constraints);
          if (wd.inspiration) setInspiration(Array.isArray(wd.inspiration) ? wd.inspiration.join("\n") : wd.inspiration);
          if (wd.successMetrics) setSuccessMetrics(Array.isArray(wd.successMetrics) ? wd.successMetrics.join("\n") : wd.successMetrics);
          if (wd.userPersonas && wd.userPersonas.length > 0) setPersonas(wd.userPersonas);
          if (wd.competitors && wd.competitors.length > 0) setCompetitors(wd.competitors);
          if (wd.currentStep) setCurrentStep(wd.currentStep);
        }
      } catch (error) {
        console.error("Error loading draft:", error);
      }
    }

    loadDraft();
  }, [projectId, isOpen]);

  const handleSaveDraft = async () => {
    if (!title.trim()) {
      alert("Please enter a project title before saving");
      return;
    }

    setIsSaving(true);

    try {
      const wizardData = {
        title: title.trim(),
        pitch: pitch.trim(),
        problem: problem.trim(),
        solution: solution.trim(),
        targetUsers: targetUsers.split("\n").map(u => u.trim()).filter(Boolean),
        userPersonas: personas.filter(p => p.name.trim()),
        platforms: platforms,
        coreFeatures: coreFeatures.split("\n").map(f => f.trim()).filter(Boolean),
        competitors: competitors.filter(c => c.name.trim()),
        constraints: constraints.split("\n").map(c => c.trim()).filter(Boolean),
        inspiration: inspiration.split("\n").map(i => i.trim()).filter(Boolean),
        successMetrics: successMetrics.split("\n").map(m => m.trim()).filter(Boolean),
        currentStep: currentStep,
      };

      const response = await fetch("/api/projects/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: draftProjectId,
          wizardData,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save draft");
      }

      const data = await response.json();

      // Set the projectId if it's a new draft
      if (!draftProjectId && data.projectId) {
        setDraftProjectId(data.projectId);
      }

      alert("Progress saved! You can resume this project later from the dashboard.");
    } catch (error) {
      console.error("Error saving draft:", error);
      alert("Failed to save progress. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const nextStep = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    // Validate required fields
    if (!title.trim() || !pitch.trim() || !problem.trim() || !solution.trim()) {
      alert("Please fill in all required fields (Title, Pitch, Problem, Solution)");
      return;
    }

    setIsSubmitting(true);

    try {
      const formData: ProjectFormData = {
        title: title.trim(),
        pitch: pitch.trim(),
        problem: problem.trim(),
        solution: solution.trim(),
        targetUsers: targetUsers.split("\n").map(u => u.trim()).filter(Boolean),
        userPersonas: personas.filter(p => p.name.trim()),
        platforms: platforms,
        coreFeatures: coreFeatures.split("\n").map(f => f.trim()).filter(Boolean),
        competitors: competitors.filter(c => c.name.trim()),
        constraints: constraints.split("\n").map(c => c.trim()).filter(Boolean),
        inspiration: inspiration.split("\n").map(i => i.trim()).filter(Boolean),
        successMetrics: successMetrics.split("\n").map(m => m.trim()).filter(Boolean),
      };

      await onSubmit(formData);

      // Reset form
      resetForm();
    } catch (error) {
      console.error("Error submitting form:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setCurrentStep(0);
    setDiscoverQuery("");
    setDiscoveredIdeas([]);
    setTitle("");
    setPitch("");
    setProblem("");
    setSolution("");
    setTargetUsers("");
    setPlatforms(["Web"]);
    setCoreFeatures("");
    setConstraints("");
    setInspiration("");
    setSuccessMetrics("");
    setPersonas([{ name: "", role: "", goals: [], painPoints: [] }]);
    setCompetitors([{ name: "", strengths: [], weaknesses: [], url: null }]);
  };

  const addPersona = () => {
    setPersonas([...personas, { name: "", role: "", goals: [], painPoints: [] }]);
  };

  const updatePersona = (index: number, field: string, value: any) => {
    const updated = [...personas];
    (updated[index] as any)[field] = value;
    setPersonas(updated);
  };

  const removePersona = (index: number) => {
    setPersonas(personas.filter((_, i) => i !== index));
  };

  const addCompetitor = () => {
    setCompetitors([...competitors, { name: "", strengths: [], weaknesses: [], url: null }]);
  };

  const updateCompetitor = (index: number, field: string, value: any) => {
    const updated = [...competitors];
    (updated[index] as any)[field] = value;
    setCompetitors(updated);
  };

  const removeCompetitor = (index: number) => {
    setCompetitors(competitors.filter((_, i) => i !== index));
  };

  const discoverAppIdeas = async () => {
    if (!discoverQuery.trim()) {
      alert("Please enter a search query (e.g., 'trending health apps', 'market gaps in fintech')");
      return;
    }

    setAiLoading("discover");

    try {
      const response = await fetch("/api/ai-discover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: discoverQuery }),
      });

      if (!response.ok) {
        throw new Error("Failed to discover app ideas");
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      setDiscoveredIdeas(data.ideas || []);
    } catch (error) {
      console.error("Error discovering app ideas:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to discover app ideas";
      alert(`Discovery Error: ${errorMessage}. Please try again.`);
    } finally {
      setAiLoading(null);
    }
  };

  const selectDiscoveredIdea = (idea: any) => {
    setTitle(idea.title || "");
    setPitch(idea.pitch || "");
    setProblem(idea.problem || "");
    setSolution(idea.solution || "");
    if (idea.targetUsers) setTargetUsers(Array.isArray(idea.targetUsers) ? idea.targetUsers.join("\n") : idea.targetUsers);
    if (idea.platforms) setPlatforms(idea.platforms);
    nextStep(); // Move to Step 1
  };

  const getAISuggestions = async (fieldType: string) => {
    // Allow Step 0 (discover) to work without title
    if (currentStep > 0 && !title.trim()) {
      alert("Please enter a project title first");
      return;
    }

    setAiLoading(fieldType);

    try {
      const response = await fetch("/api/ai-suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fieldType,
          context: {
            title,
            pitch,
            problem,
            solution,
            targetUsers: targetUsers.split("\n").filter(Boolean),
            platforms,
            coreFeatures: coreFeatures.split("\n").filter(Boolean),
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get AI suggestions");
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      console.log(`AI suggestions for ${fieldType}:`, data.suggestion);

      // Apply suggestions based on field type
      switch (fieldType) {
        case "title":
          setTitle(data.suggestion);
          break;
        case "pitch":
          setPitch(data.suggestion);
          break;
        case "problem":
          setProblem(data.suggestion);
          break;
        case "solution":
          setSolution(data.suggestion);
          break;
        case "targetUsers":
          setTargetUsers(data.suggestion);
          break;
        case "userPersonas":
          if (data.suggestion && Array.isArray(data.suggestion.personas)) {
            setPersonas(data.suggestion.personas);
            alert(`Generated ${data.suggestion.personas.length} user personas!`);
          } else {
            throw new Error("Invalid persona data received");
          }
          break;
        case "coreFeatures":
          setCoreFeatures(data.suggestion);
          break;
        case "competitors":
          if (data.suggestion && Array.isArray(data.suggestion.competitors)) {
            setCompetitors(data.suggestion.competitors);
            alert(`Generated ${data.suggestion.competitors.length} competitors!`);
          } else {
            throw new Error("Invalid competitor data received");
          }
          break;
        case "successMetrics":
          setSuccessMetrics(data.suggestion);
          break;
        case "constraints":
          setConstraints(data.suggestion);
          break;
      }
    } catch (error) {
      console.error("Error getting AI suggestions:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to get AI suggestions";
      alert(`AI Wizard Error: ${errorMessage}. Please try again or fill in manually.`);
    } finally {
      setAiLoading(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>
            Step {currentStep + 1} of {STEPS.length}: {STEPS[currentStep].description}
          </DialogDescription>
        </DialogHeader>

        {/* Progress indicator */}
        <div className="flex gap-2 mb-6">
          {STEPS.map((step) => (
            <div
              key={step.id}
              className={`flex-1 h-2 rounded-full ${
                step.id <= currentStep ? "bg-primary" : "bg-border"
              }`}
            />
          ))}
        </div>

        <div className="space-y-6">
          {/* Step 0: Discover App Ideas */}
          {currentStep === 0 && (
            <>
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold mb-2">Discover Trending App Opportunities</h3>
                <p className="text-sm text-subtext">
                  Use AI to search the web for trending app ideas, market gaps, and opportunities ready to explode
                </p>
              </div>

              <div>
                <Label htmlFor="discoverQuery">What are you interested in?</Label>
                <Textarea
                  id="discoverQuery"
                  value={discoverQuery}
                  onChange={(e) => setDiscoverQuery(e.target.value)}
                  placeholder="e.g., 'trending health apps 2025', 'market gaps in fintech', 'AI opportunities in education'"
                  rows={3}
                />
                <Button
                  type="button"
                  className="mt-3 w-full"
                  onClick={discoverAppIdeas}
                  disabled={aiLoading === "discover"}
                >
                  {aiLoading === "discover" ? "🔍 Searching..." : "🔍 Discover App Ideas"}
                </Button>
              </div>

              {discoveredIdeas.length > 0 && (
                <div className="space-y-4">
                  <h4 className="font-medium">Discovered Opportunities:</h4>
                  {discoveredIdeas.map((idea, index) => (
                    <div
                      key={index}
                      className="border border-border rounded-lg p-4 hover:bg-surface cursor-pointer"
                      onClick={() => selectDiscoveredIdea(idea)}
                    >
                      <h5 className="font-semibold text-lg mb-2">{idea.title}</h5>
                      <p className="text-sm text-subtext mb-2">{idea.pitch}</p>
                      <div className="flex gap-2 flex-wrap">
                        {idea.tags?.map((tag: string, i: number) => (
                          <span key={i} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                            {tag}
                          </span>
                        ))}
                      </div>
                      <p className="text-xs text-primary mt-2">Click to use this idea →</p>
                    </div>
                  ))}
                </div>
              )}

              <div className="text-center pt-4">
                <Button variant="ghost" onClick={nextStep}>
                  Skip & Enter Your Own Idea →
                </Button>
              </div>
            </>
          )}

          {/* Step 1: Basics */}
          {currentStep === 1 && (
            <>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="title">Project Title *</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => getAISuggestions("title")}
                    disabled={aiLoading === "title"}
                  >
                    {aiLoading === "title" ? "✨ Generating..." : "✨ AI Wizard"}
                  </Button>
                </div>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Lone Worker Safety Dashboard"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="pitch">Elevator Pitch *</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => getAISuggestions("pitch")}
                    disabled={aiLoading === "pitch"}
                  >
                    {aiLoading === "pitch" ? "✨ Generating..." : "✨ AI Wizard"}
                  </Button>
                </div>
                <Textarea
                  id="pitch"
                  value={pitch}
                  onChange={(e) => setPitch(e.target.value)}
                  placeholder="A one-sentence description of your project..."
                  rows={2}
                />
              </div>
            </>
          )}

          {/* Step 2: Problem & Solution */}
          {currentStep === 2 && (
            <>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="problem">Problem Statement *</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => getAISuggestions("problem")}
                    disabled={aiLoading === "problem"}
                  >
                    {aiLoading === "problem" ? "✨ Generating..." : "✨ AI Wizard"}
                  </Button>
                </div>
                <Textarea
                  id="problem"
                  value={problem}
                  onChange={(e) => setProblem(e.target.value)}
                  placeholder="Describe the user problem you're solving... What pain points do they face?"
                  rows={4}
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="solution">Solution *</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => getAISuggestions("solution")}
                    disabled={aiLoading === "solution"}
                  >
                    {aiLoading === "solution" ? "✨ Generating..." : "✨ AI Wizard"}
                  </Button>
                </div>
                <Textarea
                  id="solution"
                  value={solution}
                  onChange={(e) => setSolution(e.target.value)}
                  placeholder="How will your product solve this problem? What's your unique approach?"
                  rows={4}
                />
              </div>
            </>
          )}

          {/* Step 3: Users */}
          {currentStep === 3 && (
            <>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="targetUsers">Target Users (one per line)</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => getAISuggestions("targetUsers")}
                    disabled={aiLoading === "targetUsers"}
                  >
                    {aiLoading === "targetUsers" ? "✨ Generating..." : "✨ AI Wizard"}
                  </Button>
                </div>
                <Textarea
                  id="targetUsers"
                  value={targetUsers}
                  onChange={(e) => setTargetUsers(e.target.value)}
                  placeholder="e.g.,&#10;Field Technicians&#10;Safety Supervisors&#10;Operations Managers"
                  rows={4}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>User Personas (detailed)</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => getAISuggestions("userPersonas")}
                    disabled={aiLoading === "userPersonas"}
                  >
                    {aiLoading === "userPersonas" ? "✨ Generating..." : "✨ AI Wizard"}
                  </Button>
                </div>
                <p className="text-sm text-subtext mb-3">Add detailed personas to create better user stories</p>
                {personas.map((persona, index) => (
                  <div key={index} className="border border-border rounded-lg p-4 mb-3 space-y-3">
                    <div className="flex justify-between items-center">
                      <Input
                        placeholder="Persona name (e.g., Field Technician)"
                        value={persona.name}
                        onChange={(e) => updatePersona(index, "name", e.target.value)}
                      />
                      {personas.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removePersona(index)}
                          className="ml-2"
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                    <Input
                      placeholder="Role/Job title"
                      value={persona.role}
                      onChange={(e) => updatePersona(index, "role", e.target.value)}
                    />
                    <Textarea
                      placeholder="Goals (one per line)"
                      value={persona.goals.join("\n")}
                      onChange={(e) =>
                        updatePersona(index, "goals", e.target.value.split("\n").filter(Boolean))
                      }
                      rows={2}
                    />
                    <Textarea
                      placeholder="Pain points (one per line)"
                      value={persona.painPoints.join("\n")}
                      onChange={(e) =>
                        updatePersona(index, "painPoints", e.target.value.split("\n").filter(Boolean))
                      }
                      rows={2}
                    />
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={addPersona}>
                  + Add Another Persona
                </Button>
              </div>
            </>
          )}

          {/* Step 4: Features & Platforms */}
          {currentStep === 4 && (
            <>
              <div>
                <Label>Platforms</Label>
                <div className="flex gap-4 mt-2">
                  {["Web", "iOS", "Android"].map((platform) => (
                    <label key={platform} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={platforms.includes(platform)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setPlatforms([...platforms, platform]);
                          } else {
                            setPlatforms(platforms.filter((p) => p !== platform));
                          }
                        }}
                      />
                      <span>{platform}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="coreFeatures">Core Features (one per line)</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => getAISuggestions("coreFeatures")}
                    disabled={aiLoading === "coreFeatures"}
                  >
                    {aiLoading === "coreFeatures" ? "✨ Generating..." : "✨ AI Wizard"}
                  </Button>
                </div>
                <Textarea
                  id="coreFeatures"
                  value={coreFeatures}
                  onChange={(e) => setCoreFeatures(e.target.value)}
                  placeholder="e.g.,&#10;Real-time location tracking&#10;Emergency alert button&#10;Safety compliance reporting&#10;Team communication"
                  rows={6}
                />
              </div>
            </>
          )}

          {/* Step 5: Competition */}
          {currentStep === 5 && (
            <>
              <div>
                <Label htmlFor="inspiration">Inspiration / Similar Products</Label>
                <Textarea
                  id="inspiration"
                  value={inspiration}
                  onChange={(e) => setInspiration(e.target.value)}
                  placeholder="Product names or URLs that inspire you (one per line)"
                  rows={3}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Competitors (detailed analysis)</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => getAISuggestions("competitors")}
                    disabled={aiLoading === "competitors"}
                  >
                    {aiLoading === "competitors" ? "✨ Generating..." : "✨ AI Wizard"}
                  </Button>
                </div>
                <p className="text-sm text-subtext mb-3">Analyze competitors to differentiate your product</p>
                {competitors.map((competitor, index) => (
                  <div key={index} className="border border-border rounded-lg p-4 mb-3 space-y-3">
                    <div className="flex justify-between items-center">
                      <Input
                        placeholder="Competitor name"
                        value={competitor.name}
                        onChange={(e) => updateCompetitor(index, "name", e.target.value)}
                      />
                      {competitors.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeCompetitor(index)}
                          className="ml-2"
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                    <Input
                      placeholder="Website URL (optional)"
                      value={competitor.url || ""}
                      onChange={(e) => updateCompetitor(index, "url", e.target.value || null)}
                    />
                    <Textarea
                      placeholder="Strengths (one per line)"
                      value={competitor.strengths.join("\n")}
                      onChange={(e) =>
                        updateCompetitor(index, "strengths", e.target.value.split("\n").filter(Boolean))
                      }
                      rows={2}
                    />
                    <Textarea
                      placeholder="Weaknesses (one per line)"
                      value={competitor.weaknesses.join("\n")}
                      onChange={(e) =>
                        updateCompetitor(index, "weaknesses", e.target.value.split("\n").filter(Boolean))
                      }
                      rows={2}
                    />
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={addCompetitor}>
                  + Add Another Competitor
                </Button>
              </div>
            </>
          )}

          {/* Step 6: Success & Constraints */}
          {currentStep === 6 && (
            <>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="successMetrics">Success Metrics / KPIs (one per line)</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => getAISuggestions("successMetrics")}
                    disabled={aiLoading === "successMetrics"}
                  >
                    {aiLoading === "successMetrics" ? "✨ Generating..." : "✨ AI Wizard"}
                  </Button>
                </div>
                <Textarea
                  id="successMetrics"
                  value={successMetrics}
                  onChange={(e) => setSuccessMetrics(e.target.value)}
                  placeholder="How will you measure success?&#10;e.g.,&#10;Reduce incident response time by 50%&#10;95% user adoption within 6 months&#10;Zero workplace accidents in pilot program"
                  rows={5}
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="constraints">Constraints & Limitations (one per line)</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => getAISuggestions("constraints")}
                    disabled={aiLoading === "constraints"}
                  >
                    {aiLoading === "constraints" ? "✨ Generating..." : "✨ AI Wizard"}
                  </Button>
                </div>
                <Textarea
                  id="constraints"
                  value={constraints}
                  onChange={(e) => setConstraints(e.target.value)}
                  placeholder="e.g.,&#10;Must work offline&#10;Budget: $50k&#10;Timeline: 3 months&#10;Must integrate with existing safety systems"
                  rows={5}
                />
              </div>
            </>
          )}
        </div>

        {/* Navigation buttons */}
        <div className="flex justify-between mt-6 pt-6 border-t border-border">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 0}
          >
            Previous
          </Button>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleSaveDraft}
              disabled={isSaving || !title.trim()}
            >
              {isSaving ? "Saving..." : "💾 Save Progress"}
            </Button>

            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>

            {currentStep < STEPS.length - 1 ? (
              <Button onClick={nextStep}>Next</Button>
            ) : (
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Project"}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
