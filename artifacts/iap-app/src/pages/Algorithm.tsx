import React, { useState } from "react";
import { useRunJpAlgorithm } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Play, Activity, CheckCircle2, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { JpAlgorithmRequest, JpPlanStep } from "@workspace/api-client-react/src/generated/api.schemas";

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

export default function Algorithm() {
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  
  const runMutation = useRunJpAlgorithm();

  const handleSelectPreset = (key: string) => {
    setSelectedPreset(key);
    runMutation.reset();
  };

  const handleRun = () => {
    if (selectedPreset) {
      runMutation.mutate({ data: PRESETS[selectedPreset] });
    }
  };

  return (
    <div className="p-6 lg:p-12 space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-mono text-primary flex items-center gap-3">
          <Activity className="h-8 w-8" />
          JP Algorithm
        </h1>
        <p className="text-muted-foreground mt-2 max-w-2xl">
          Regressive planning demonstration. The algorithm works backwards from the goal state
          to the current state to find the optimal path in the topological space.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Object.entries(PRESETS).map(([key, data]) => (
          <Card 
            key={key} 
            className={`cursor-pointer transition-all border-2 ${selectedPreset === key ? 'border-primary bg-primary/5' : 'border-transparent hover:border-primary/50'}`}
            onClick={() => handleSelectPreset(key)}
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
          animate={{ opacity: 1, height: 'auto' }}
          className="space-y-6"
        >
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Dependency Graph</h2>
            <Button 
              onClick={handleRun} 
              disabled={runMutation.isPending}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Play className="mr-2 h-4 w-4" />
              {runMutation.isPending ? "Computing..." : "Run Algorithm"}
            </Button>
          </div>

          {/* Simple Visualizer for the Graph */}
          <div className="p-6 bg-card rounded-xl border border-border flex flex-wrap gap-4 items-center justify-center min-h-32">
             {PRESETS[selectedPreset].events.map((ev, i) => (
                <React.Fragment key={ev.id}>
                  <div className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md font-mono text-sm border border-border">
                    {ev.label}
                  </div>
                  {i < PRESETS[selectedPreset].events.length - 1 && (
                    <ChevronRight className="text-muted-foreground h-5 w-5" />
                  )}
                </React.Fragment>
             ))}
          </div>

          <AnimatePresence>
            {runMutation.isSuccess && runMutation.data && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className="p-4 bg-accent/10 border border-accent/20 rounded-lg flex items-start gap-4">
                  <CheckCircle2 className="h-6 w-6 text-accent mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-accent">Plan Computed Successfully</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Total Cost: {runMutation.data.totalCost} | Iterations: {runMutation.data.iterations}
                    </p>
                    <p className="text-sm mt-2">{runMutation.data.message}</p>
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
          </AnimatePresence>

        </motion.div>
      )}
    </div>
  );
}
