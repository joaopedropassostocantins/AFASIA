import React, { useState } from "react";
import { usePictorialChat } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  Smile, Frown, HeartPulse, BatteryWarning, AlertTriangle, 
  Droplet, Utensils, LifeBuoy, Bath, Pill, 
  Hand, Ban, Play, Check, X,
  Home, Hospital, School, Briefcase,
  User, Users, Stethoscope, MessageSquare
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const CATEGORIES = [
  {
    name: "Emotions",
    symbols: [
      { id: "happy", icon: Smile, label: "Happy" },
      { id: "sad", icon: Frown, label: "Sad" },
      { id: "pain", icon: HeartPulse, label: "Pain" },
      { id: "tired", icon: BatteryWarning, label: "Tired" },
      { id: "afraid", icon: AlertTriangle, label: "Afraid" },
    ]
  },
  {
    name: "Needs",
    symbols: [
      { id: "water", icon: Droplet, label: "Water" },
      { id: "food", icon: Utensils, label: "Food" },
      { id: "help", icon: LifeBuoy, label: "Help" },
      { id: "bathroom", icon: Bath, label: "Bathroom" },
      { id: "medicine", icon: Pill, label: "Medicine" },
    ]
  },
  {
    name: "Actions",
    symbols: [
      { id: "want", icon: Hand, label: "Want" },
      { id: "stop", icon: Ban, label: "Stop" },
      { id: "go", icon: Play, label: "Go" },
      { id: "yes", icon: Check, label: "Yes" },
      { id: "no", icon: X, label: "No" },
    ]
  },
  {
    name: "Places & People",
    symbols: [
      { id: "home", icon: Home, label: "Home" },
      { id: "hospital", icon: Hospital, label: "Hospital" },
      { id: "me", icon: User, label: "Me" },
      { id: "family", icon: Users, label: "Family" },
      { id: "doctor", icon: Stethoscope, label: "Doctor" },
    ]
  }
];

export default function Aphasia() {
  const [selectedSymbols, setSelectedSymbols] = useState<string[]>([]);
  const [language, setLanguage] = useState<"en" | "pt">("en");
  
  const chatMutation = usePictorialChat();

  const handleAddSymbol = (id: string) => {
    setSelectedSymbols(prev => [...prev, id]);
  };

  const handleClear = () => {
    setSelectedSymbols([]);
    chatMutation.reset();
  };

  const handleTranslate = () => {
    if (selectedSymbols.length > 0) {
      chatMutation.mutate({
        data: {
          symbols: selectedSymbols,
          language
        }
      });
    }
  };

  // Helper to find symbol definition
  const getSymbolDef = (id: string) => {
    for (const cat of CATEGORIES) {
      const sym = cat.symbols.find(s => s.id === id);
      if (sym) return sym;
    }
    return null;
  };

  return (
    <div className="p-6 lg:p-12 space-y-8 max-w-5xl mx-auto w-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-mono text-primary flex items-center gap-3">
            <MessageSquare className="h-8 w-8" />
            Pictorial Communication
          </h1>
          <p className="text-muted-foreground mt-2">
            Accessible interface for aphasia using topological meaning mapping.
          </p>
        </div>
        <div className="flex bg-secondary rounded-lg p-1">
          <button 
            className={`px-4 py-2 rounded-md text-sm font-semibold transition-colors ${language === 'en' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'}`}
            onClick={() => setLanguage('en')}
          >
            EN
          </button>
          <button 
            className={`px-4 py-2 rounded-md text-sm font-semibold transition-colors ${language === 'pt' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'}`}
            onClick={() => setLanguage('pt')}
          >
            PT
          </button>
        </div>
      </div>

      {/* Sentence Strip */}
      <div className="bg-card border-2 border-primary/30 rounded-xl p-6 min-h-[140px] flex flex-col justify-between">
        <div className="flex flex-wrap gap-4 mb-6">
          <AnimatePresence>
            {selectedSymbols.length === 0 && (
              <motion.span 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }}
                className="text-muted-foreground text-lg flex items-center h-16"
              >
                Select symbols below to build a sentence...
              </motion.span>
            )}
            {selectedSymbols.map((id, index) => {
              const sym = getSymbolDef(id);
              const Icon = sym?.icon || Smile;
              return (
                <motion.div
                  key={`${id}-${index}`}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  className="bg-primary text-primary-foreground p-4 rounded-xl flex flex-col items-center justify-center w-24 h-24 shadow-md"
                >
                  <Icon size={32} className="mb-2" />
                  <span className="text-xs font-bold uppercase tracking-wider">{sym?.label}</span>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
        
        <div className="flex justify-end gap-4">
          <Button variant="outline" onClick={handleClear} disabled={selectedSymbols.length === 0}>
            Clear
          </Button>
          <Button 
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-8" 
            onClick={handleTranslate}
            disabled={selectedSymbols.length === 0 || chatMutation.isPending}
          >
            {chatMutation.isPending ? "Translating..." : "Translate (Gemma 4)"}
          </Button>
        </div>
      </div>

      {/* Translation Result */}
      <AnimatePresence>
        {chatMutation.isSuccess && chatMutation.data && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="bg-accent/10 border-2 border-accent/30 rounded-xl p-6 relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-1 h-full bg-accent"></div>
            <h3 className="text-sm font-semibold text-accent mb-2 uppercase tracking-wider">Natural Language Interpretation</h3>
            <p className="text-2xl md:text-4xl font-medium text-foreground mb-4">
              "{chatMutation.data.naturalLanguage}"
            </p>
            <p className="text-sm text-muted-foreground font-mono">
              Topological Confidence: {(chatMutation.data.confidence * 100).toFixed(1)}%
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Symbol Grid */}
      <div className="space-y-8">
        {CATEGORIES.map(category => (
          <div key={category.name}>
            <h2 className="text-lg font-semibold mb-4 text-muted-foreground">{category.name}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
              {category.symbols.map(sym => {
                const Icon = sym.icon;
                return (
                  <Card 
                    key={sym.id}
                    className="cursor-pointer hover:border-primary transition-colors flex flex-col items-center justify-center aspect-square bg-card hover:bg-secondary/50 border-border"
                    onClick={() => handleAddSymbol(sym.id)}
                  >
                    <Icon size={40} className="mb-3 text-foreground" strokeWidth={1.5} />
                    <span className="font-medium text-sm">{sym.label}</span>
                  </Card>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
