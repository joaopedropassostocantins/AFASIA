import React, { useState, useRef, useEffect, useCallback } from "react";
import { usePictorialChat } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  X,
  Volume2,
  VolumeX,
  Trash2,
  Brain,
  AlertCircle,
  Check,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  LayoutGrid,
  Grid3x3,
} from "lucide-react";

interface Symbol {
  id: string;
  emoji: string;
  label: string;
  color: string;
}

interface Category {
  name: string;
  emoji: string;
  borderColor: string;
  symbols: Symbol[];
}

const CATEGORIES: Category[] = [
  {
    name: "Necessidades",
    emoji: "💧",
    borderColor: "border-blue-300",
    symbols: [
      { id: "agua", emoji: "💧", label: "Água", color: "bg-blue-100 hover:bg-blue-200" },
      { id: "comida", emoji: "🍽️", label: "Comida", color: "bg-green-100 hover:bg-green-200" },
      { id: "banheiro", emoji: "🚽", label: "Banheiro", color: "bg-teal-100 hover:bg-teal-200" },
      { id: "remedio", emoji: "💊", label: "Remédio", color: "bg-pink-100 hover:bg-pink-200" },
      { id: "ajuda", emoji: "🆘", label: "Ajuda", color: "bg-red-100 hover:bg-red-200" },
      { id: "dormir", emoji: "🛏️", label: "Dormir", color: "bg-indigo-100 hover:bg-indigo-200" },
      { id: "frio", emoji: "🥶", label: "Frio", color: "bg-sky-100 hover:bg-sky-200" },
      { id: "calor", emoji: "🥵", label: "Calor", color: "bg-orange-100 hover:bg-orange-200" },
    ],
  },
  {
    name: "Sentimentos",
    emoji: "😊",
    borderColor: "border-yellow-300",
    symbols: [
      { id: "feliz", emoji: "😊", label: "Feliz", color: "bg-yellow-100 hover:bg-yellow-200" },
      { id: "triste", emoji: "😢", label: "Triste", color: "bg-blue-100 hover:bg-blue-200" },
      { id: "com_dor", emoji: "😣", label: "Com dor", color: "bg-red-100 hover:bg-red-200" },
      { id: "cansado", emoji: "😴", label: "Cansado", color: "bg-purple-100 hover:bg-purple-200" },
      { id: "com_medo", emoji: "😨", label: "Com medo", color: "bg-orange-100 hover:bg-orange-200" },
      { id: "ansioso", emoji: "😰", label: "Ansioso", color: "bg-amber-100 hover:bg-amber-200" },
      { id: "irritado", emoji: "😠", label: "Irritado", color: "bg-rose-100 hover:bg-rose-200" },
      { id: "confuso", emoji: "😕", label: "Confuso", color: "bg-gray-100 hover:bg-gray-200" },
    ],
  },
  {
    name: "Lugares",
    emoji: "🏠",
    borderColor: "border-purple-300",
    symbols: [
      { id: "casa", emoji: "🏠", label: "Casa", color: "bg-yellow-100 hover:bg-yellow-200" },
      { id: "hospital", emoji: "🏥", label: "Hospital", color: "bg-red-100 hover:bg-red-200" },
      { id: "escola", emoji: "🏫", label: "Escola", color: "bg-blue-100 hover:bg-blue-200" },
      { id: "trabalho", emoji: "🏢", label: "Trabalho", color: "bg-gray-100 hover:bg-gray-200" },
      { id: "parque", emoji: "🌳", label: "Parque", color: "bg-green-100 hover:bg-green-200" },
      { id: "quarto", emoji: "🛏️", label: "Quarto", color: "bg-indigo-100 hover:bg-indigo-200" },
      { id: "fora", emoji: "🚪", label: "Fora", color: "bg-teal-100 hover:bg-teal-200" },
      { id: "dentro", emoji: "🏡", label: "Dentro", color: "bg-amber-100 hover:bg-amber-200" },
    ],
  },
  {
    name: "Pessoas",
    emoji: "👥",
    borderColor: "border-pink-300",
    symbols: [
      { id: "eu", emoji: "👤", label: "Eu", color: "bg-purple-100 hover:bg-purple-200" },
      { id: "familia", emoji: "👨‍👩‍👧", label: "Família", color: "bg-pink-100 hover:bg-pink-200" },
      { id: "medico", emoji: "👨‍⚕️", label: "Médico", color: "bg-blue-100 hover:bg-blue-200" },
      { id: "enfermeiro", emoji: "🧑‍⚕️", label: "Enfermeiro", color: "bg-teal-100 hover:bg-teal-200" },
      { id: "amigo", emoji: "🤝", label: "Amigo", color: "bg-green-100 hover:bg-green-200" },
      { id: "cuidador", emoji: "🧑‍🦽", label: "Cuidador", color: "bg-yellow-100 hover:bg-yellow-200" },
      { id: "filhos", emoji: "👧", label: "Filhos", color: "bg-orange-100 hover:bg-orange-200" },
      { id: "mae", emoji: "👩", label: "Mãe", color: "bg-rose-100 hover:bg-rose-200" },
    ],
  },
  {
    name: "Ações",
    emoji: "✅",
    borderColor: "border-green-300",
    symbols: [
      { id: "quero", emoji: "🙋", label: "Quero", color: "bg-blue-100 hover:bg-blue-200" },
      { id: "nao_quero", emoji: "🙅", label: "Não quero", color: "bg-rose-100 hover:bg-rose-200" },
      { id: "parar", emoji: "✋", label: "Parar", color: "bg-red-100 hover:bg-red-200" },
      { id: "ir", emoji: "▶️", label: "Ir", color: "bg-green-100 hover:bg-green-200" },
      { id: "sim", emoji: "✅", label: "Sim", color: "bg-green-100 hover:bg-green-200" },
      { id: "nao", emoji: "❌", label: "Não", color: "bg-red-100 hover:bg-red-200" },
      { id: "dar", emoji: "🤲", label: "Dar", color: "bg-amber-100 hover:bg-amber-200" },
      { id: "chamar", emoji: "📞", label: "Chamar", color: "bg-indigo-100 hover:bg-indigo-200" },
    ],
  },
];

const ALL_SYMBOLS = CATEGORIES.flatMap((c) => c.symbols);

const EMERGENCY_SYMBOLS: Symbol[] = [
  { id: "ajuda", emoji: "🆘", label: "AJUDA", color: "bg-red-200" },
  { id: "com_dor", emoji: "😣", label: "DOR FORTE", color: "bg-rose-200" },
  { id: "sim", emoji: "✅", label: "SIM", color: "bg-green-200" },
  { id: "nao", emoji: "❌", label: "NÃO", color: "bg-gray-200" },
];

function getUrgencyLevel(n: number): { label: string; color: string; bg: string; ring: string } {
  if (n >= 10) return { label: "EMERGÊNCIA", color: "text-red-700", bg: "bg-red-100 border-red-400", ring: "ring-red-400" };
  if (n >= 8) return { label: "Alta", color: "text-orange-700", bg: "bg-orange-100 border-orange-300", ring: "ring-orange-300" };
  if (n >= 5) return { label: "Média", color: "text-yellow-700", bg: "bg-yellow-100 border-yellow-300", ring: "ring-yellow-300" };
  return { label: "Baixa", color: "text-green-700", bg: "bg-green-100 border-green-300", ring: "ring-green-300" };
}

interface HistoryEntry {
  id: number;
  symbols: string[];
  intencao: string;
  urgencia: number;
  emocao: string;
  time: string;
}

export default function Aphasia() {
  const [selectedCategory, setSelectedCategory] = useState<number>(0);
  const [selectedSymbols, setSelectedSymbols] = useState<string[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [speakEnabled, setSpeakEnabled] = useState(true);
  const [emergencyOpen, setEmergencyOpen] = useState(false);
  const [cartaoOpen, setCartaoOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [gridLarge, setGridLarge] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const historyCounter = useRef(0);

  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      synthRef.current = window.speechSynthesis;
    }
  }, []);

  const speak = useCallback(
    (text: string) => {
      if (!synthRef.current) return;
      synthRef.current.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = "pt-BR";
      utter.rate = 0.85;
      utter.pitch = 1.0;
      utter.onstart = () => setIsSpeaking(true);
      utter.onend = () => setIsSpeaking(false);
      utter.onerror = () => setIsSpeaking(false);
      synthRef.current.speak(utter);
    },
    [],
  );

  const mutation = usePictorialChat({
    mutation: {
      onSuccess: (data) => {
        if (speakEnabled) speak(data.intencao);
        historyCounter.current += 1;
        const entry: HistoryEntry = {
          id: historyCounter.current,
          symbols: [...selectedSymbols],
          intencao: data.intencao,
          urgencia: data.urgencia,
          emocao: data.emocao,
          time: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
        };
        setHistory((prev) => [entry, ...prev].slice(0, 15));
        if (data.urgencia >= 8) {
          setEmergencyOpen(true);
        }
      },
    },
  });

  const triggerInference = useCallback(
    (symbols: string[]) => {
      if (symbols.length === 0) return;
      const historicoTexts = history.slice(0, 3).map((h) => h.intencao);
      mutation.mutate({
        data: { symbols, historico: historicoTexts },
      });
    },
    [history, mutation],
  );

  const handleSymbolClick = (symbol: Symbol) => {
    if (selectedSymbols.includes(symbol.id)) {
      setSelectedSymbols((prev) => {
        const next = prev.filter((s) => s !== symbol.id);
        scheduleInference(next);
        return next;
      });
      return;
    }
    if (selectedSymbols.length >= 4) return;
    setSelectedSymbols((prev) => {
      const next = [...prev, symbol.id];
      scheduleInference(next);
      return next;
    });
  };

  const scheduleInference = (symbols: string[]) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (symbols.length === 0) return;
    debounceRef.current = setTimeout(() => {
      triggerInference(symbols);
    }, 600);
  };

  const handleRemoveSymbol = (id: string) => {
    setSelectedSymbols((prev) => {
      const next = prev.filter((s) => s !== id);
      scheduleInference(next);
      return next;
    });
  };

  const handleClear = () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setSelectedSymbols([]);
    mutation.reset();
  };

  const handleSpeak = (text: string) => {
    speak(text);
  };

  const handleSuggestionClick = (symbolId: string) => {
    if (selectedSymbols.includes(symbolId)) return;
    if (selectedSymbols.length >= 4) return;
    setSelectedSymbols((prev) => {
      const next = [...prev, symbolId];
      scheduleInference(next);
      return next;
    });
  };

  const handleRepeatHistory = (entry: HistoryEntry) => {
    if (speakEnabled) speak(entry.intencao);
  };

  const urgencyLevel = mutation.data ? getUrgencyLevel(mutation.data.urgencia) : null;
  const currentCat = CATEGORIES[selectedCategory];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50/30 to-white pb-48">
      <div className="max-w-4xl mx-auto px-4 py-5 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Brain className="h-6 w-6 text-primary" />
              Comunicador AAC
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Inteligência Artificial Pictórica · Afasia em Português
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={speakEnabled ? "default" : "outline"}
              size="sm"
              onClick={() => setSpeakEnabled(!speakEnabled)}
              title={speakEnabled ? "Desativar voz" : "Ativar voz"}
            >
              {speakEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setEmergencyOpen(true)}
              className="font-bold"
            >
              🆘
            </Button>
          </div>
        </div>

        <div className="flex gap-1 flex-wrap">
          {CATEGORIES.map((cat, i) => (
            <button
              key={cat.name}
              onClick={() => setSelectedCategory(i)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                selectedCategory === i
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "bg-background text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
              }`}
            >
              <span>{cat.emoji}</span>
              <span className="hidden sm:inline">{cat.name}</span>
            </button>
          ))}
          <button
            onClick={() => setGridLarge((v) => !v)}
            className="ml-auto flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium border border-border bg-background text-muted-foreground hover:text-foreground transition-all"
            title="Alternar tamanho da grade"
          >
            {gridLarge ? <LayoutGrid className="h-4 w-4" /> : <Grid3x3 className="h-4 w-4" />}
            <span className="hidden sm:inline text-xs">Aa</span>
          </button>
        </div>

        <Card className={`border-2 ${currentCat.borderColor} shadow-sm`}>
          <CardContent className="p-3">
            <div className={`grid gap-2 ${gridLarge ? "grid-cols-4" : "grid-cols-4 sm:grid-cols-8"}`}>
              {currentCat.symbols.map((sym) => {
                const isSelected = selectedSymbols.includes(sym.id);
                const isDisabled = !isSelected && selectedSymbols.length >= 4;
                return (
                  <motion.button
                    key={sym.id}
                    whileHover={isDisabled ? {} : { scale: 1.04 }}
                    whileTap={isDisabled ? {} : { scale: 0.96 }}
                    onClick={() => handleSymbolClick(sym)}
                    disabled={isDisabled}
                    className={`flex flex-col items-center gap-1 rounded-xl border-2 transition-all text-center ${
                      gridLarge ? "p-3" : "p-2"
                    } ${
                      isSelected
                        ? "border-primary bg-primary/10 shadow-sm ring-2 ring-primary/30"
                        : isDisabled
                          ? `${sym.color} border-transparent opacity-40 cursor-not-allowed`
                          : `${sym.color} border-transparent`
                    }`}
                  >
                    <span className={gridLarge ? "text-3xl leading-none" : "text-xl leading-none"}>
                      {sym.emoji}
                    </span>
                    <span className="text-xs font-medium text-foreground leading-tight">{sym.label}</span>
                    {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
                  </motion.button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {mutation.data && mutation.data.sugestoes.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">
              Sugestões:
            </span>
            {mutation.data.sugestoes.map((sid) => {
              const sym = ALL_SYMBOLS.find((s) => s.id === sid);
              const disabled = selectedSymbols.length >= 4 || selectedSymbols.includes(sid);
              return (
                <button
                  key={sid}
                  onClick={() => handleSuggestionClick(sid)}
                  disabled={disabled}
                  className={`flex items-center gap-1 px-2 py-1 rounded-full border text-xs font-medium transition-all ${
                    disabled
                      ? "opacity-40 cursor-not-allowed bg-secondary border-border"
                      : "bg-primary/5 border-primary/30 hover:bg-primary/15 text-foreground"
                  }`}
                >
                  {sym ? (
                    <>
                      <span>{sym.emoji}</span>
                      <span>{sym.label}</span>
                    </>
                  ) : (
                    <span>{sid}</span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {mutation.isError && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-3">
              <p className="text-red-700 text-sm flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                Erro ao processar. Verifique a conexão.
              </p>
            </CardContent>
          </Card>
        )}

        <Card className="border shadow-sm">
          <CardHeader className="pb-2 pt-3 px-4">
            <button
              className="flex items-center justify-between w-full"
              onClick={() => setHistoryOpen((v) => !v)}
            >
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Histórico ({history.length})
              </CardTitle>
              {historyOpen ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
            </button>
          </CardHeader>
          <AnimatePresence>
            {historyOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                style={{ overflow: "hidden" }}
              >
                <CardContent className="px-4 pb-4">
                  {history.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic">Nenhuma mensagem ainda.</p>
                  ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {history.map((entry) => {
                        const uc = getUrgencyLevel(entry.urgencia);
                        return (
                          <div key={entry.id} className={`rounded-lg p-2 border text-xs ${uc.bg}`}>
                            <div className="flex items-center justify-between mb-0.5">
                              <span className={`font-semibold ${uc.color}`}>
                                {uc.label} · {entry.time}
                              </span>
                              <button
                                onClick={() => handleRepeatHistory(entry)}
                                className="text-muted-foreground hover:text-foreground transition-colors p-0.5"
                                title="Repetir"
                              >
                                <Volume2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                            <p className="text-foreground font-medium">{entry.intencao}</p>
                            <div className="flex gap-1 mt-1">
                              {entry.symbols.slice(0, 4).map((sid) => {
                                const sym = ALL_SYMBOLS.find((s) => s.id === sid);
                                return sym ? (
                                  <span key={sid} title={sym.label} className="text-base">
                                    {sym.emoji}
                                  </span>
                                ) : null;
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>

        <Card className="border shadow-sm bg-slate-50/60">
          <CardContent className="px-4 py-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
              Sobre o IAP
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              A teoria IAP propõe que o pensamento ocorre em espaços topológicos pré-linguísticos. Esta
              interface usa o modelo{" "}
              <span className="font-medium text-foreground">Gemini 2.5 Flash</span> para interpretar
              sequências pictóricas e traduzi-las para linguagem natural em português.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur border-t border-border shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-3 space-y-2">
          <div className="flex flex-wrap gap-1.5 min-h-[28px] items-center">
            <AnimatePresence>
              {selectedSymbols.length === 0 ? (
                <span className="text-sm text-muted-foreground italic">Toque nos símbolos acima...</span>
              ) : (
                selectedSymbols.map((id) => {
                  const sym = ALL_SYMBOLS.find((s) => s.id === id);
                  if (!sym) return null;
                  return (
                    <motion.button
                      key={id}
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.8, opacity: 0 }}
                      onClick={() => handleRemoveSymbol(id)}
                      className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 border border-primary/30 text-sm font-medium hover:bg-red-100 hover:border-red-300 transition-colors"
                    >
                      <span>{sym.emoji}</span>
                      <span className="text-xs">{sym.label}</span>
                      <X className="h-3 w-3 text-muted-foreground" />
                    </motion.button>
                  );
                })
              )}
            </AnimatePresence>
            {selectedSymbols.length >= 4 && (
              <span className="text-xs text-amber-600 font-medium ml-1">máx. 4</span>
            )}
          </div>

          <AnimatePresence>
            {mutation.isPending && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-3.5 w-3.5 animate-spin text-primary" />
                <span className="text-sm text-muted-foreground">Interpretando...</span>
              </motion.div>
            )}
            {mutation.data && !mutation.isPending && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={`rounded-lg border p-2 ${urgencyLevel?.bg ?? "border-border bg-background"}`}
              >
                <div className="flex items-center gap-2">
                  <p className="text-base font-semibold text-foreground flex-1 leading-snug">
                    &ldquo;{mutation.data.intencao}&rdquo;
                  </p>
                  {urgencyLevel && (
                    <Badge
                      variant="outline"
                      className={`${urgencyLevel.color} ${urgencyLevel.bg} border shrink-0 text-xs`}
                    >
                      {urgencyLevel.label}
                    </Badge>
                  )}
                </div>
                {mutation.data.nota_cuidador && (
                  <p className="text-xs text-amber-700 mt-1 font-medium">
                    Cuidador: {mutation.data.nota_cuidador}
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleClear}
              disabled={selectedSymbols.length === 0}
              className="px-3"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Limpar
            </Button>
            <Button
              size="sm"
              onClick={() => mutation.data && handleSpeak(mutation.data.intencao)}
              disabled={!mutation.data || mutation.isPending}
              className={`flex-1 font-bold ${isSpeaking ? "animate-pulse" : ""}`}
            >
              <Volume2 className="h-4 w-4 mr-2" />
              FALAR
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCartaoOpen(true)}
              disabled={!mutation.data}
              className="px-3"
            >
              📋
            </Button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {emergencyOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-red-50 flex flex-col items-center justify-center p-6"
          >
            <div className="w-full max-w-sm space-y-4">
              <div className="text-center">
                <span className="text-5xl">🆘</span>
                <h2 className="text-2xl font-bold text-red-700 mt-2">Modo Emergência</h2>
                <p className="text-red-600 text-sm mt-1">Toque para comunicar imediatamente</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {EMERGENCY_SYMBOLS.map((sym) => (
                  <motion.button
                    key={sym.id}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      speak(sym.label);
                      const historicoTexts = history.slice(0, 2).map((h) => h.intencao);
                      mutation.mutate({ data: { symbols: [sym.id], historico: historicoTexts } });
                    }}
                    className={`flex flex-col items-center justify-center p-6 rounded-2xl ${sym.color} border-2 border-transparent hover:border-red-400 transition-all`}
                  >
                    <span className="text-5xl">{sym.emoji}</span>
                    <span className="text-lg font-bold mt-2">{sym.label}</span>
                  </motion.button>
                ))}
              </div>

              <div className="space-y-2 mt-4">
                <p className="text-xs text-red-700 font-semibold text-center uppercase tracking-wide">
                  Emergências
                </p>
                <a
                  href="tel:192"
                  className="block w-full text-center rounded-xl bg-red-600 text-white font-bold py-3 text-lg hover:bg-red-700 transition-colors"
                >
                  📞 SAMU — 192
                </a>
                <a
                  href="tel:193"
                  className="block w-full text-center rounded-xl bg-orange-500 text-white font-bold py-2.5 text-base hover:bg-orange-600 transition-colors"
                >
                  🔥 Bombeiros — 193
                </a>
              </div>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => setEmergencyOpen(false)}
              >
                ← Voltar ao comunicador
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {cartaoOpen && mutation.data && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
            onClick={() => setCartaoOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white border-4 border-red-500 rounded-2xl p-8 max-w-sm w-full shadow-2xl text-center space-y-4"
            >
              <p className="text-xs font-bold text-red-600 uppercase tracking-widest">
                Cartão de Comunicação — IAP
              </p>
              <div className="flex justify-center gap-3 text-3xl">
                {selectedSymbols.map((id) => {
                  const sym = ALL_SYMBOLS.find((s) => s.id === id);
                  return sym ? <span key={id}>{sym.emoji}</span> : null;
                })}
              </div>
              <p className="text-3xl font-bold text-foreground leading-tight">
                {mutation.data.intencao}
              </p>
              <div className="flex justify-center gap-2 flex-wrap">
                <Badge variant="outline" className="text-sm">
                  Emoção: {mutation.data.emocao}
                </Badge>
                {urgencyLevel && (
                  <Badge variant="outline" className={`${urgencyLevel.color} text-sm`}>
                    Urgência: {urgencyLevel.label}
                  </Badge>
                )}
              </div>
              {mutation.data.nota_cuidador && (
                <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-left">
                  <p className="text-xs font-bold text-amber-700 uppercase mb-1">Nota ao cuidador</p>
                  <p className="text-sm text-amber-800">{mutation.data.nota_cuidador}</p>
                </div>
              )}
              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  onClick={() => mutation.data && handleSpeak(mutation.data.intencao)}
                >
                  <Volume2 className="h-4 w-4 mr-2" />
                  Falar
                </Button>
                <Button variant="outline" onClick={() => setCartaoOpen(false)}>
                  Fechar
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
