import React, { useState, useEffect, useCallback } from "react";
import { useComputeTopology } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Network, ActivitySquare } from "lucide-react";
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, ZAxis } from "recharts";
import { motion } from "framer-motion";
import type { TopologyRequest } from "@workspace/api-client-react/src/generated/api.schemas";

// Custom debounce hook for slider
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export default function Topology() {
  const [currentState, setCurrentState] = useState<number[]>([5, 5, 5]);
  const [goalState, setGoalState] = useState<number[]>([8, 8, 8]);

  const debouncedCurrent = useDebounce(currentState, 500);
  const debouncedGoal = useDebounce(goalState, 500);

  const topologyMutation = useComputeTopology();

  useEffect(() => {
    topologyMutation.mutate({
      data: {
        currentState: debouncedCurrent,
        goalState: debouncedGoal,
        numPoints: 50
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedCurrent, debouncedGoal]);

  const handleCurrentChange = (index: number, value: number[]) => {
    const newState = [...currentState];
    newState[index] = value[0];
    setCurrentState(newState);
  };

  const handleGoalChange = (index: number, value: number[]) => {
    const newState = [...goalState];
    newState[index] = value[0];
    setGoalState(newState);
  };

  const renderPersistenceDiagram = (data: any[], title: string, color: string) => {
    if (!data || data.length === 0) return null;
    
    // Format data for Recharts scatter plot (Birth vs Death)
    const plotData = data.map(d => ({
      x: d.birth,
      y: d.death,
      z: d.lifetime, // Used for bubble size
      dim: d.dimension
    }));

    return (
      <div className="h-[300px] w-full mt-4">
        <h4 className="text-sm font-mono text-center mb-2">{title}</h4>
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis type="number" dataKey="x" name="Birth" domain={[0, 'auto']} stroke="hsl(var(--muted-foreground))" />
            <YAxis type="number" dataKey="y" name="Death" domain={[0, 'auto']} stroke="hsl(var(--muted-foreground))" />
            <ZAxis type="number" dataKey="z" range={[20, 200]} name="Lifetime" />
            <RechartsTooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }} />
            {/* Diagonal line y=x */}
            <Scatter name="Diagonal" data={[{x:0, y:0}, {x:10, y:10}]} line={{stroke: 'hsl(var(--muted-foreground))', strokeWidth: 1}} shape={() => null} />
            <Scatter name="Features" data={plotData} fill={color} opacity={0.7} />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    );
  };

  return (
    <div className="p-6 lg:p-12 space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-mono text-primary flex items-center gap-3">
          <Network className="h-8 w-8" />
          Topological Analysis
        </h1>
        <p className="text-muted-foreground mt-2 max-w-2xl">
          Visual representation of the Wasserstein distance between two knowledge states in the IAP framework.
        </p>
      </div>

      {topologyMutation.isSuccess && topologyMutation.data && (
        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-primary/10 border border-primary/30 rounded-2xl p-8 text-center"
        >
          <h2 className="text-sm uppercase tracking-widest text-primary font-semibold mb-2">Wasserstein Distance</h2>
          <div className="text-6xl md:text-8xl font-bold font-mono text-foreground">
            {topologyMutation.data.wassersteinDistance.toFixed(3)}
          </div>
          <p className="mt-4 text-muted-foreground max-w-3xl mx-auto">
            {topologyMutation.data.interpretation}
          </p>
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ActivitySquare className="h-5 w-5 text-chart-1" />
              Current State
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {['Syntax', 'Logic', 'Architecture'].map((dim, i) => (
              <div key={`curr-${i}`} className="space-y-3">
                <div className="flex justify-between text-sm">
                  <label className="font-medium text-muted-foreground">{dim}</label>
                  <span className="font-mono">{currentState[i]}</span>
                </div>
                <Slider
                  value={[currentState[i]]}
                  max={10}
                  step={0.1}
                  onValueChange={(val) => handleCurrentChange(i, val)}
                  className="py-2"
                />
              </div>
            ))}
            
            {topologyMutation.data && renderPersistenceDiagram(
              topologyMutation.data.persistenceDiagramCurrent, 
              "Persistence Diagram (Current)", 
              "hsl(var(--chart-1))"
            )}
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ActivitySquare className="h-5 w-5 text-chart-2" />
              Goal State
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {['Syntax', 'Logic', 'Architecture'].map((dim, i) => (
              <div key={`goal-${i}`} className="space-y-3">
                <div className="flex justify-between text-sm">
                  <label className="font-medium text-muted-foreground">{dim}</label>
                  <span className="font-mono">{goalState[i]}</span>
                </div>
                <Slider
                  value={[goalState[i]]}
                  max={10}
                  step={0.1}
                  onValueChange={(val) => handleGoalChange(i, val)}
                  className="py-2"
                />
              </div>
            ))}

            {topologyMutation.data && renderPersistenceDiagram(
              topologyMutation.data.persistenceDiagramGoal, 
              "Persistence Diagram (Goal)", 
              "hsl(var(--chart-2))"
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
