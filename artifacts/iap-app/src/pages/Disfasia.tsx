import React, { useState, useRef, useEffect, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import {
  AlertTriangle,
  X,
  Volume2,
  VolumeX,
  Trash2,
  MessageSquare,
  AlertCircle,
  Network,
  ChevronDown,
  ChevronRight,
  GripHorizontal,
  RefreshCw,
  LayoutGrid,
  Grid3x3,
  ArrowRight,
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
    name: "Fluência",
    emoji: "🎙️",
    borderColor: "border-cyan-400",
    symbols: [
      { id: "parar", emoji: "⏸️", label: "Parar", color: "bg-red-100 hover:bg-red-200" },
      { id: "continuar", emoji: "▶️", label: "Continuar", color: "bg-green-100 hover:bg-green-200" },
      { id: "devagar", emoji: "🐢", label: "Devagar", color: "bg-blue-100 hover:bg-blue-200" },
      { id: "rapido", emoji: "🐇", label: "Rápido", color: "bg-orange-100 hover:bg-orange-200" },
      { id: "esperar", emoji: "⏳", label: "Esperar", color: "bg-yellow-100 hover:bg-yellow-200" },
      { id: "repetir", emoji: "🔁", label: "Repetir", color: "bg-purple-100 hover:bg-purple-200" },
      { id: "vez", emoji: "☝️", label: "Minha vez", color: "bg-teal-100 hover:bg-teal-200" },
      { id: "vez_tu", emoji: "👉", label: "Tua vez", color: "bg-indigo-100 hover:bg-indigo-200" },
      { id: "mais_devagar", emoji: "🐌", label: "Mais devagar", color: "bg-sky-100 hover:bg-sky-200" },
      { id: "alto", emoji: "🔊", label: "Mais alto", color: "bg-amber-100 hover:bg-amber-200" },
      { id: "silencio", emoji: "🤫", label: "Silêncio", color: "bg-gray-100 hover:bg-gray-200" },
      { id: "pronto", emoji: "👍", label: "Pronto", color: "bg-lime-100 hover:bg-lime-200" },
    ],
  },
  {
    name: "Sequência",
    emoji: "🔢",
    borderColor: "border-amber-400",
    symbols: [
      { id: "primeiro", emoji: "1️⃣", label: "Primeiro", color: "bg-blue-100 hover:bg-blue-200" },
      { id: "depois", emoji: "2️⃣", label: "Depois", color: "bg-indigo-100 hover:bg-indigo-200" },
      { id: "agora", emoji: "⏰", label: "Agora", color: "bg-yellow-100 hover:bg-yellow-200" },
      { id: "antes", emoji: "⬅️", label: "Antes", color: "bg-gray-100 hover:bg-gray-200" },
      { id: "amanha", emoji: "☀️", label: "Amanhã", color: "bg-orange-100 hover:bg-orange-200" },
      { id: "ontem", emoji: "🌙", label: "Ontem", color: "bg-slate-100 hover:bg-slate-200" },
      { id: "logo", emoji: "🔜", label: "Logo", color: "bg-cyan-100 hover:bg-cyan-200" },
      { id: "fim", emoji: "⏹️", label: "Fim", color: "bg-rose-100 hover:bg-rose-200" },
      { id: "inicio", emoji: "🏁", label: "Início", color: "bg-green-100 hover:bg-green-200" },
      { id: "semana", emoji: "📅", label: "Esta semana", color: "bg-teal-100 hover:bg-teal-200" },
      { id: "sempre", emoji: "♾️", label: "Sempre", color: "bg-blue-100 hover:bg-blue-200" },
      { id: "nunca", emoji: "🚫", label: "Nunca", color: "bg-red-100 hover:bg-red-200" },
    ],
  },
  {
    name: "Emoção",
    emoji: "💜",
    borderColor: "border-purple-400",
    symbols: [
      { id: "frustrado", emoji: "😤", label: "Frustrado", color: "bg-red-100 hover:bg-red-200" },
      { id: "tranquilo", emoji: "😌", label: "Tranquilo", color: "bg-green-100 hover:bg-green-200" },
      { id: "ansioso", emoji: "😰", label: "Ansioso", color: "bg-amber-100 hover:bg-amber-200" },
      { id: "feliz", emoji: "😊", label: "Feliz", color: "bg-yellow-100 hover:bg-yellow-200" },
      { id: "triste", emoji: "😢", label: "Triste", color: "bg-blue-100 hover:bg-blue-200" },
      { id: "nervoso", emoji: "😬", label: "Nervoso", color: "bg-orange-100 hover:bg-orange-200" },
      { id: "calmo", emoji: "😎", label: "Calmo", color: "bg-sky-100 hover:bg-sky-200" },
      { id: "confuso", emoji: "😕", label: "Confuso", color: "bg-gray-100 hover:bg-gray-200" },
      { id: "orgulhoso", emoji: "🥲", label: "Orgulhoso", color: "bg-pink-100 hover:bg-pink-200" },
      { id: "com_medo", emoji: "😨", label: "Com medo", color: "bg-purple-100 hover:bg-purple-200" },
      { id: "surpreso", emoji: "😲", label: "Surpreso", color: "bg-yellow-100 hover:bg-yellow-200" },
      { id: "animado", emoji: "🤩", label: "Animado", color: "bg-fuchsia-100 hover:bg-fuchsia-200" },
    ],
  },
  {
    name: "Espaço",
    emoji: "📍",
    borderColor: "border-green-400",
    symbols: [
      { id: "aqui", emoji: "📍", label: "Aqui", color: "bg-red-100 hover:bg-red-200" },
      { id: "ali", emoji: "📌", label: "Ali", color: "bg-pink-100 hover:bg-pink-200" },
      { id: "perto", emoji: "🤏", label: "Perto", color: "bg-green-100 hover:bg-green-200" },
      { id: "longe", emoji: "🚀", label: "Longe", color: "bg-blue-100 hover:bg-blue-200" },
      { id: "dentro", emoji: "⬇️", label: "Dentro", color: "bg-indigo-100 hover:bg-indigo-200" },
      { id: "fora", emoji: "⬆️", label: "Fora", color: "bg-teal-100 hover:bg-teal-200" },
      { id: "cima", emoji: "🔼", label: "Cima", color: "bg-amber-100 hover:bg-amber-200" },
      { id: "baixo", emoji: "🔽", label: "Baixo", color: "bg-slate-100 hover:bg-slate-200" },
      { id: "lado", emoji: "↔️", label: "Ao lado", color: "bg-green-100 hover:bg-green-200" },
      { id: "frente", emoji: "⏩", label: "À frente", color: "bg-cyan-100 hover:bg-cyan-200" },
      { id: "atras", emoji: "⏪", label: "Atrás", color: "bg-orange-100 hover:bg-orange-200" },
      { id: "meio", emoji: "⚪", label: "No meio", color: "bg-gray-100 hover:bg-gray-200" },
    ],
  },
  {
    name: "Comunicação",
    emoji: "💬",
    borderColor: "border-blue-400",
    symbols: [
      { id: "falar", emoji: "💬", label: "Falar", color: "bg-blue-100 hover:bg-blue-200" },
      { id: "ouvir", emoji: "👂", label: "Ouvir", color: "bg-teal-100 hover:bg-teal-200" },
      { id: "entender", emoji: "🧠", label: "Entender", color: "bg-purple-100 hover:bg-purple-200" },
      { id: "perguntar", emoji: "❓", label: "Perguntar", color: "bg-yellow-100 hover:bg-yellow-200" },
      { id: "responder", emoji: "💡", label: "Responder", color: "bg-green-100 hover:bg-green-200" },
      { id: "nao_entendi", emoji: "🤷", label: "Não entendi", color: "bg-rose-100 hover:bg-rose-200" },
      { id: "ajuda", emoji: "🆘", label: "Ajuda", color: "bg-red-100 hover:bg-red-200" },
      { id: "sim", emoji: "✅", label: "Sim", color: "bg-emerald-100 hover:bg-emerald-200" },
      { id: "explicar", emoji: "📖", label: "Explicar", color: "bg-amber-100 hover:bg-amber-200" },
      { id: "nao", emoji: "❌", label: "Não", color: "bg-rose-100 hover:bg-rose-200" },
      { id: "mostrar", emoji: "👁️", label: "Mostrar", color: "bg-sky-100 hover:bg-sky-200" },
      { id: "escrever", emoji: "✏️", label: "Escrever", color: "bg-indigo-100 hover:bg-indigo-200" },
    ],
  },
];

const ALL_SYMBOLS = CATEGORIES.flatMap((c) => c.symbols);

const EMERGENCY_SYMBOLS: Symbol[] = [
  { id: "ajuda", emoji: "🆘", label: "AJUDA", color: "bg-red-200" },
  { id: "parar", emoji: "⏸️", label: "PARAR", color: "bg-rose-200" },
  { id: "sim", emoji: "✅", label: "SIM", color: "bg-green-200" },
  { id: "nao_entendi", emoji: "🤷", label: "NÃO ENTENDI", color: "bg-gray-200" },
];

function getUrgencyLevel(n: number): { label: string; color: string; bg: string; ring: string } {
  if (n >= 10) return { label: "EMERGÊNCIA", color: "text-red-700", bg: "bg-red-100 border-red-400", ring: "ring-red-400" };
  if (n >= 8) return { label: "Alta", color: "text-red-700", bg: "bg-red-100 border-red-400", ring: "ring-red-400" };
  if (n >= 5) return { label: "Média", color: "text-orange-700", bg: "bg-orange-100 border-orange-300", ring: "ring-orange-300" };
  return { label: "Baixa", color: "text-green-700", bg: "bg-green-100 border-green-300", ring: "ring-green-300" };
}

interface ChatResponse {
  intencao: string;
  urgencia: number;
  emocao: string;
  confianca: number;
  sugestoes: string[];
  nota_cuidador: string;
}

interface HistoryEntry {
  id: number;
  symbols: string[];
  intencao: string;
  urgencia: number;
  emocao: string;
  time: string;
}

const BASE_URL = import.meta.env.BASE_URL.replace(/\/$/, "");

async function callDisfasiaChat(symbols: string[], historico: string[]): Promise<ChatResponse> {
  const res = await fetch(`${BASE_URL}/api/iap/disfasia-chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ symbols, historico }),
  });
  if (!res.ok) throw new Error(`Erro ${res.status}: ${res.statusText}`);
  return res.json() as Promise<ChatResponse>;
}

export default function Disfasia() {
  const [selectedCategory, setSelectedCategory] = useState<number>(0);
  const [selectedSymbols, setSelectedSymbols] = useState<string[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [speakEnabled, setSpeakEnabled] = useState(true);
  const [emergencyOpen, setEmergencyOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [gridLarge, setGridLarge] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const historyCounter = useRef(0);
  const pendingReorderRef = useRef<string[]>([]);

  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      synthRef.current = window.speechSynthesis;
    }
  }, []);

  const speak = useCallback((text: string) => {
    if (!synthRef.current) return;
    synthRef.current.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "pt-BR";
    utter.rate = 0.8;
    utter.pitch = 1.0;
    utter.onstart = () => setIsSpeaking(true);
    utter.onend = () => setIsSpeaking(false);
    utter.onerror = () => setIsSpeaking(false);
    synthRef.current.speak(utter);
  }, []);

  const mutation = useMutation<ChatResponse, Error, { symbols: string[]; historico: string[] }>({
    mutationFn: ({ symbols, historico }) => callDisfasiaChat(symbols, historico),
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
      if (data.urgencia >= 8) setEmergencyOpen(true);
    },
  });

  const triggerInference = useCallback(
    (symbols: string[]) => {
      if (symbols.length === 0) return;
      const historicoTexts = history.slice(0, 3).map((h) => h.intencao);
      mutation.mutate({ symbols, historico: historicoTexts });
    },
    [history, mutation],
  );

  const scheduleInference = (symbols: string[]) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (symbols.length === 0) return;
    debounceRef.current = setTimeout(() => triggerInference(symbols), 600);
  };

  const handleSymbolClick = (symbol: Symbol) => {
    if (selectedSymbols.includes(symbol.id)) {
      setSelectedSymbols((prev) => {
        const next = prev.filter((s) => s !== symbol.id);
        scheduleInference(next);
        return next;
      });
      return;
    }
    if (selectedSymbols.length >= 10) return;
    setSelectedSymbols((prev) => {
      const next = [...prev, symbol.id];
      scheduleInference(next);
      return next;
    });
  };

  const handleRemoveSymbol = (id: string) => {
    setSelectedSymbols((prev) => {
      const next = prev.filter((s) => s !== id);
      scheduleInference(next);
      return next;
    });
  };

  const handleReorderSymbols = (newOrder: string[]) => {
    pendingReorderRef.current = newOrder;
    setSelectedSymbols(newOrder);
  };

  const handleReorderDragEnd = () => {
    if (pendingReorderRef.current.length > 0) {
      scheduleInference(pendingReorderRef.current);
    }
  };

  const handleClear = () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setSelectedSymbols([]);
    mutation.reset();
  };

  const handleSuggestionClick = (symbolId: string) => {
    if (selectedSymbols.includes(symbolId)) return;
    if (selectedSymbols.length >= 10) return;
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
    <div className="min-h-screen bg-gradient-to-b from-violet-50/30 to-white pb-48">
      <div className="max-w-4xl mx-auto px-4 py-5 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <MessageSquare className="h-6 w-6 text-primary" />
              VOZ — COMUNICAÇÃO ESTRUTURADA
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Inteligência Artificial Pictórica · Disfasia em Português
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
            <div className={`grid gap-2 ${gridLarge ? "grid-cols-3" : "grid-cols-2"}`}>
              {currentCat.symbols.map((sym) => {
                const isSelected = selectedSymbols.includes(sym.id);
                const isDisabled = !isSelected && selectedSymbols.length >= 10;
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

        <div className="flex items-center gap-2 min-h-[44px] flex-wrap">
          {selectedSymbols.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">
              Selecione até 10 símbolos para comunicar…
            </p>
          ) : (
            <Reorder.Group
              axis="x"
              values={selectedSymbols}
              onReorder={handleReorderSymbols}
              className="flex items-center gap-1.5 flex-wrap"
              as="div"
            >
              {selectedSymbols.map((id) => {
                const sym = ALL_SYMBOLS.find((s) => s.id === id);
                return (
                  <Reorder.Item
                    key={id}
                    value={id}
                    as="div"
                    onDragEnd={handleReorderDragEnd}
                    className="flex items-center gap-0.5 bg-primary/10 border border-primary/30 rounded-full px-1.5 py-1 text-sm font-medium select-none touch-none"
                    whileDrag={{ scale: 1.08, boxShadow: "0 4px 16px rgba(0,0,0,0.15)", zIndex: 50 }}
                    initial={{ scale: 0.7, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.7, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  >
                    <GripHorizontal className="h-3 w-3 text-muted-foreground/40 cursor-grab shrink-0" />
                    <span className="px-0.5">{sym?.emoji ?? "?"}</span>
                    <span className="text-xs">{sym?.label ?? id}</span>
                    <button
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={() => handleRemoveSymbol(id)}
                      className="text-muted-foreground hover:text-foreground ml-0.5"
                      title="Remover"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Reorder.Item>
                );
              })}
            </Reorder.Group>
          )}

          {selectedSymbols.length > 0 && (
            <div className="ml-auto flex items-center gap-1.5">
              {mutation.isPending && <RefreshCw className="h-4 w-4 animate-spin text-primary" />}
              <Button variant="ghost" size="sm" onClick={handleClear} className="h-7 px-2">
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </div>

        <AnimatePresence>
          {mutation.data && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.25 }}
            >
              <Card className={`border-2 shadow-md ${urgencyLevel?.ring ? `ring-1 ${urgencyLevel.ring}` : ""} ${urgencyLevel?.bg ?? ""}`}>
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-lg font-semibold text-foreground leading-snug flex-1">
                      {mutation.data.intencao}
                    </p>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {isSpeaking ? (
                        <VolumeX className="h-4 w-4 text-primary animate-pulse" />
                      ) : (
                        <button
                          onClick={() => mutation.data && speak(mutation.data.intencao)}
                          title="Ouvir"
                          className="text-muted-foreground hover:text-primary transition-colors"
                        >
                          <Volume2 className="h-4 w-4" />
                        </button>
                      )}
                      <Badge
                        variant="secondary"
                        className={`text-xs font-semibold ${urgencyLevel?.color}`}
                      >
                        {urgencyLevel?.label}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>Emoção: <strong>{mutation.data.emocao}</strong></span>
                    <span>Confiança: <strong>{Math.round(mutation.data.confianca * 100)}%</strong></span>
                    {mutation.data.nota_cuidador && (
                      <span className="flex items-center gap-1 text-amber-700">
                        <AlertCircle className="h-3 w-3" />
                        {mutation.data.nota_cuidador}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {mutation.data && mutation.data.sugestoes.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">
              Sugestões:
            </span>
            {mutation.data.sugestoes.map((sid) => {
              const sym = ALL_SYMBOLS.find((s) => s.id === sid);
              const disabled = selectedSymbols.length >= 10 || selectedSymbols.includes(sid);
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
                              {entry.symbols.slice(0, 10).map((sid) => {
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

        <Card className="border shadow-sm bg-violet-50/40">
          <CardContent className="px-4 py-3 space-y-3">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                Sobre a Disfasia e o IAP
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                A disfasia afeta a fluência e organização da fala, não a compreensão. A pessoa compreende
                tudo, mas tem dificuldade em organizar e articular as palavras. A teoria IAP (Inteligência
                Artificial Pictórica) modela o pensamento em espaços topológicos pré-linguísticos — ideal
                para apoiar utilizadores com disfasia via símbolos pictóricos e Gemini.
              </p>
            </div>
            <Link href="/disfasia-atlas">
              <Button variant="outline" size="sm" className="w-full border-violet-400/40 hover:border-violet-400 text-xs">
                <Network className="h-3.5 w-3.5 mr-1.5" />
                Ver Atlas Semântico da Disfasia
                <ArrowRight className="h-3.5 w-3.5 ml-auto" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <AnimatePresence>
        {emergencyOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              transition={{ type: "spring", stiffness: 350, damping: 30 }}
              className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border-2 border-red-400"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-red-700 flex items-center gap-2">
                  🆘 Acesso Rápido
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEmergencyOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {EMERGENCY_SYMBOLS.map((sym) => (
                  <button
                    key={sym.id}
                    onClick={() => {
                      handleSymbolClick(sym);
                      setEmergencyOpen(false);
                    }}
                    className={`${sym.color} rounded-xl p-4 flex flex-col items-center gap-2 border-2 border-transparent hover:border-primary transition-all`}
                  >
                    <span className="text-4xl">{sym.emoji}</span>
                    <span className="text-sm font-bold">{sym.label}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
