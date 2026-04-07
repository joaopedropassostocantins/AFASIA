import React, { useState } from "react";
import { useRunJpAlgorithm } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Play, Activity, CheckCircle2, ChevronRight, Plus, Trash2, Pencil } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { JpAlgorithmRequest, JpPlanStep } from "@workspace/api-client-react";

const PRESETS: Record<string, JpAlgorithmRequest> = {
  lawyer: {
    goal: "Become a Lawyer",
    startEvent: "High School Grad",
    events: [
      { id: "High School Grad", label: "High School Graduate" },
      { id: "College Student", label: "Pre-Law College Student" },
      { id: "Law Student", label: "Law School Student" },
      { id: "Bar Exam Passed", label: "Passed Bar Exam" },
      { id: "Become a Lawyer", label: "Practicing Lawyer" },
    ],
    edges: [
      { from: "High School Grad", to: "College Student", label: "Enroll in Pre-Law", cost: 4 },
      { from: "College Student", to: "Law Student", label: "Pass LSAT & Enroll", cost: 3 },
      { from: "Law Student", to: "Bar Exam Passed", label: "Take Bar Exam", cost: 2 },
      { from: "Bar Exam Passed", to: "Become a Lawyer", label: "Get Hired", cost: 1 },
    ],
  },
  programmer: {
    goal: "Learn Programming",
    startEvent: "Beginner",
    events: [
      { id: "Beginner", label: "Beginner" },
      { id: "Basics", label: "Syntax & Basics" },
      { id: "DSA", label: "Data Structures" },
      { id: "Projects", label: "Build Projects" },
      { id: "Learn Programming", label: "Job Ready" },
    ],
    edges: [
      { from: "Beginner", to: "Basics", label: "Take Course", cost: 2 },
      { from: "Basics", to: "DSA", label: "Practice LeetCode", cost: 5 },
      { from: "DSA", to: "Projects", label: "Build Portfolio", cost: 4 },
      { from: "Projects", to: "Learn Programming", label: "Apply for Jobs", cost: 2 },
    ],
  },
  business: {
    goal: "Start a Business",
    startEvent: "Idea",
    events: [
      { id: "Idea", label: "Business Idea" },
      { id: "Plan", label: "Business Plan" },
      { id: "Funding", label: "Secure Funding" },
      { id: "MVP", label: "Build MVP" },
      { id: "Start a Business", label: "Launch" },
    ],
    edges: [
      { from: "Idea", to: "Plan", label: "Market Research", cost: 2 },
      { from: "Plan", to: "Funding", label: "Pitch to Investors", cost: 6 },
      { from: "Funding", to: "MVP", label: "Development", cost: 5 },
      { from: "MVP", to: "Start a Business", label: "Marketing", cost: 3 },
    ],
  },
};

interface CustomEvent {
  id: string;
  label: string;
}

interface CustomEdge {
  from: string;
  to: string;
  label: string;
  cost: number;
}

function CustomScenarioForm({ onSubmit }: { onSubmit: (req: JpAlgorithmRequest) => void }) {
  const [goal, setGoal] = useState("");
  const [startEvent, setStartEvent] = useState("");
  const [events, setEvents] = useState<CustomEvent[]>([
    { id: "", label: "" },
    { id: "", label: "" },
  ]);
  const [edges, setEdges] = useState<CustomEdge[]>([
    { from: "", to: "", label: "", cost: 1 },
  ]);
  const [error, setError] = useState<string | null>(null);

  const addEvent = () => setEvents((prev) => [...prev, { id: "", label: "" }]);
  const removeEvent = (i: number) => setEvents((prev) => prev.filter((_, idx) => idx !== i));
  const updateEvent = (i: number, field: keyof CustomEvent, value: string) =>
    setEvents((prev) => prev.map((ev, idx) => (idx === i ? { ...ev, [field]: value } : ev)));

  const addEdge = () => setEdges((prev) => [...prev, { from: "", to: "", label: "", cost: 1 }]);
  const removeEdge = (i: number) => setEdges((prev) => prev.filter((_, idx) => idx !== i));
  const updateEdge = (i: number, field: keyof CustomEdge, value: string | number) =>
    setEdges((prev) => prev.map((e, idx) => (idx === i ? { ...e, [field]: value } : e)));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!goal.trim()) { setError("Goal is required."); return; }
    if (!startEvent.trim()) { setError("Start event is required."); return; }
    if (events.some((ev) => !ev.id.trim() || !ev.label.trim())) {
      setError("All events must have an ID and label."); return;
    }
    if (edges.some((ed) => !ed.from.trim() || !ed.to.trim() || !ed.label.trim())) {
      setError("All edges must have from, to, and label."); return;
    }

    onSubmit({
      goal: goal.trim(),
      startEvent: startEvent.trim(),
      events: events.map((ev) => ({ id: ev.id.trim(), label: ev.label.trim() })),
      edges: edges.map((ed) => ({
        from: ed.from.trim(),
        to: ed.to.trim(),
        label: ed.label.trim(),
        cost: Number(ed.cost),
      })),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6" data-testid="custom-scenario-form">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="goal-input" className="text-sm font-medium">Goal (event ID)</Label>
          <Input
            id="goal-input"
            data-testid="input-goal"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="e.g. Become a Doctor"
            className="font-mono text-sm"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="start-input" className="text-sm font-medium">Start Event (event ID)</Label>
          <Input
            id="start-input"
            data-testid="input-start"
            value={startEvent}
            onChange={(e) => setStartEvent(e.target.value)}
            placeholder="e.g. High School"
            className="font-mono text-sm"
          />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">Events (States)</Label>
          <Button type="button" variant="outline" size="sm" onClick={addEvent} data-testid="button-add-event">
            <Plus className="h-3 w-3 mr-1" /> Add Event
          </Button>
        </div>
        {events.map((ev, i) => (
          <div key={i} className="flex gap-2 items-center">
            <Input
              data-testid={`input-event-id-${i}`}
              value={ev.id}
              onChange={(e) => updateEvent(i, "id", e.target.value)}
              placeholder="ID (unique)"
              className="font-mono text-sm flex-1"
            />
            <Input
              data-testid={`input-event-label-${i}`}
              value={ev.label}
              onChange={(e) => updateEvent(i, "label", e.target.value)}
              placeholder="Display label"
              className="text-sm flex-1"
            />
            {events.length > 2 && (
              <Button type="button" variant="ghost" size="icon" onClick={() => removeEvent(i)} data-testid={`button-remove-event-${i}`}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            )}
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">Edges (Transitions)</Label>
          <Button type="button" variant="outline" size="sm" onClick={addEdge} data-testid="button-add-edge">
            <Plus className="h-3 w-3 mr-1" /> Add Edge
          </Button>
        </div>
        {edges.map((ed, i) => (
          <div key={i} className="flex gap-2 items-center flex-wrap">
            <Input
              data-testid={`input-edge-from-${i}`}
              value={ed.from}
              onChange={(e) => updateEdge(i, "from", e.target.value)}
              placeholder="From (event ID)"
              className="font-mono text-xs flex-1 min-w-24"
            />
            <Input
              data-testid={`input-edge-to-${i}`}
              value={ed.to}
              onChange={(e) => updateEdge(i, "to", e.target.value)}
              placeholder="To (event ID)"
              className="font-mono text-xs flex-1 min-w-24"
            />
            <Input
              data-testid={`input-edge-label-${i}`}
              value={ed.label}
              onChange={(e) => updateEdge(i, "label", e.target.value)}
              placeholder="Action label"
              className="text-xs flex-1 min-w-24"
            />
            <Input
              data-testid={`input-edge-cost-${i}`}
              type="number"
              min={0}
              step={0.1}
              value={ed.cost}
              onChange={(e) => updateEdge(i, "cost", parseFloat(e.target.value) || 0)}
              placeholder="Cost"
              className="font-mono text-xs w-20"
            />
            {edges.length > 1 && (
              <Button type="button" variant="ghost" size="icon" onClick={() => removeEdge(i)} data-testid={`button-remove-edge-${i}`}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            )}
          </div>
        ))}
      </div>

      {error && (
        <p className="text-sm text-destructive" data-testid="custom-form-error">{error}</p>
      )}

      <Button type="submit" className="bg-primary text-primary-foreground w-full" data-testid="button-run-custom">
        <Play className="mr-2 h-4 w-4" /> Run JP Algorithm
      </Button>
    </form>
  );
}

export default function Algorithm() {
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [mode, setMode] = useState<"presets" | "custom">("presets");

  const runMutation = useRunJpAlgorithm();

  const handleSelectPreset = (key: string) => {
    setSelectedPreset(key);
    runMutation.reset();
  };

  const handleRunPreset = () => {
    if (selectedPreset) {
      runMutation.mutate({ data: PRESETS[selectedPreset] });
    }
  };

  const handleRunCustom = (req: JpAlgorithmRequest) => {
    runMutation.mutate({ data: req });
  };

  const handleModeSwitch = (m: "presets" | "custom") => {
    setMode(m);
    setSelectedPreset(null);
    runMutation.reset();
  };

  return (
    <div className="p-6 lg:p-12 space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-mono text-primary flex items-center gap-3" data-testid="text-page-title">
          <Activity className="h-8 w-8" />
          JP Algorithm
        </h1>
        <p className="text-muted-foreground mt-2 max-w-2xl">
          Regressive planning demonstration. The algorithm works backwards from the goal state
          to the current state to find the optimal path in the topological space.
        </p>
      </div>

      <div className="flex gap-2">
        <Button
          variant={mode === "presets" ? "default" : "outline"}
          size="sm"
          onClick={() => handleModeSwitch("presets")}
          data-testid="button-mode-presets"
        >
          Presets
        </Button>
        <Button
          variant={mode === "custom" ? "default" : "outline"}
          size="sm"
          onClick={() => handleModeSwitch("custom")}
          data-testid="button-mode-custom"
        >
          <Pencil className="h-3 w-3 mr-1" /> Custom Scenario
        </Button>
      </div>

      {mode === "presets" && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Object.entries(PRESETS).map(([key, data]) => (
              <Card
                key={key}
                className={`cursor-pointer transition-all border-2 ${selectedPreset === key ? "border-primary bg-primary/5" : "border-transparent hover:border-primary/50"}`}
                onClick={() => handleSelectPreset(key)}
                data-testid={`card-preset-${key}`}
              >
                <CardHeader>
                  <CardTitle className="text-lg">{data.goal}</CardTitle>
                  <CardDescription>From: {data.startEvent}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>

          {selectedPreset && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="space-y-6"
            >
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Dependency Graph</h2>
                <Button
                  onClick={handleRunPreset}
                  disabled={runMutation.isPending}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                  data-testid="button-run-algorithm"
                >
                  <Play className="mr-2 h-4 w-4" />
                  {runMutation.isPending ? "Computing..." : "Run Algorithm"}
                </Button>
              </div>

              <div className="p-6 bg-card rounded-xl border border-border flex flex-wrap gap-4 items-center justify-center min-h-32" data-testid="graph-visualizer">
                {PRESETS[selectedPreset].events.map((ev, i) => (
                  <React.Fragment key={ev.id}>
                    <div
                      className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md font-mono text-sm border border-border"
                      data-testid={`node-event-${i}`}
                    >
                      {ev.label}
                    </div>
                    {i < PRESETS[selectedPreset].events.length - 1 && (
                      <ChevronRight className="text-muted-foreground h-5 w-5" />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </motion.div>
          )}
        </>
      )}

      {mode === "custom" && (
        <Card className="border-primary/30">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Pencil className="h-5 w-5" /> Define Your Own Scenario
            </CardTitle>
            <CardDescription>
              Create a custom knowledge graph by defining events (states) and edges (transitions).
              The JP Algorithm will find the optimal path from your start event to your goal.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CustomScenarioForm onSubmit={handleRunCustom} />
          </CardContent>
        </Card>
      )}

      <AnimatePresence>
        {runMutation.isSuccess && runMutation.data && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
            data-testid="plan-result"
          >
            <div className="p-4 bg-accent/10 border border-accent/20 rounded-lg flex items-start gap-4">
              <CheckCircle2 className="h-6 w-6 text-accent mt-0.5" />
              <div>
                <h3 className="font-semibold text-accent">Plan Computed Successfully</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Total Cost: {runMutation.data.totalCost} | Iterations: {runMutation.data.iterations}
                </p>
                <p className="text-sm mt-2" data-testid="text-plan-message">{runMutation.data.message}</p>
              </div>
            </div>

            <div className="space-y-3 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
              {runMutation.data.path.map((step: JpPlanStep, index: number) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.2 }}
                  className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active"
                  data-testid={`step-card-${index}`}
                >
                  <div className="flex items-center justify-center w-10 h-10 rounded-full border border-primary bg-background shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10">
                    <span className="text-xs font-mono text-primary">{step.stepNumber}</span>
                  </div>
                  <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-border bg-card shadow">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-semibold text-primary">{step.manu}</span>
                      <span className="text-xs text-muted-foreground font-mono">Cost: {step.cost}</span>
                    </div>
                    <div className="text-sm text-muted-foreground flex items-center gap-2">
                      <span>{step.fromEvent}</span>
                      <ChevronRight className="h-3 w-3" />
                      <span>{step.toEvent}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {runMutation.isError && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg"
            data-testid="plan-error"
          >
            <p className="text-sm text-destructive">Failed to compute plan. Please check your inputs.</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
