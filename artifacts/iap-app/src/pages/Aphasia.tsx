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
  Send,
  Brain,
  AlertCircle,
  RefreshCw,
  Check,
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
  color: string;
  symbols: Symbol[];
}

const CATEGORIES: Category[] = [
  {
    name: "Emoções",
    emoji: "😊",
    color: "bg-yellow-50 border-yellow-200",
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
    name: "Necessidades",
    emoji: "💧",
    color: "bg-blue-50 border-blue-200",
    symbols: [
      { id: "agua", emoji: "💧", label: "Água", color: "bg-blue-100 hover:bg-blue-200" },
      { id: "comida", emoji: "🍽️", label: "Comida", color: "bg-green-100 hover:bg-green-200" },
      { id: "ajuda", emoji: "🆘", label: "Ajuda", color: "bg-red-100 hover:bg-red-200" },
      { id: "banheiro", emoji: "🚽", label: "Banheiro", color: "bg-teal-100 hover:bg-teal-200" },
      { id: "remedio", emoji: "💊", label: "Remédio", color: "bg-pink-100 hover:bg-pink-200" },
      { id: "dormir", emoji: "🛏️", label: "Dormir", color: "bg-indigo-100 hover:bg-indigo-200" },
      { id: "frio", emoji: "🥶", label: "Frio", color: "bg-sky-100 hover:bg-sky-200" },
      { id: "calor", emoji: "🥵", label: "Calor", color: "bg-orange-100 hover:bg-orange-200" },
    ],
  },
  {
    name: "Respostas",
    emoji: "✅",
    color: "bg-green-50 border-green-200",
    symbols: [
      { id: "sim", emoji: "✅", label: "Sim", color: "bg-green-100 hover:bg-green-200" },
      { id: "nao", emoji: "❌", label: "Não", color: "bg-red-100 hover:bg-red-200" },
      { id: "talvez", emoji: "🤔", label: "Talvez", color: "bg-yellow-100 hover:bg-yellow-200" },
      { id: "quero", emoji: "🙋", label: "Quero", color: "bg-blue-100 hover:bg-blue-200" },
      { id: "nao_quero", emoji: "🙅", label: "Não quero", color: "bg-rose-100 hover:bg-rose-200" },
      { id: "parar", emoji: "✋", label: "Parar", color: "bg-red-100 hover:bg-red-200" },
      { id: "continuar", emoji: "▶️", label: "Continuar", color: "bg-green-100 hover:bg-green-200" },
      { id: "espera", emoji: "⏸️", label: "Esperar", color: "bg-gray-100 hover:bg-gray-200" },
    ],
  },
  {
    name: "Pessoas",
    emoji: "🏠",
    color: "bg-purple-50 border-purple-200",
    symbols: [
      { id: "eu", emoji: "👤", label: "Eu", color: "bg-purple-100 hover:bg-purple-200" },
      { id: "familia", emoji: "👨‍👩‍👧", label: "Família", color: "bg-pink-100 hover:bg-pink-200" },
      { id: "medico", emoji: "👨‍⚕️", label: "Médico", color: "bg-blue-100 hover:bg-blue-200" },
      { id: "casa", emoji: "🏠", label: "Casa", color: "bg-yellow-100 hover:bg-yellow-200" },
      { id: "hospital", emoji: "🏥", label: "Hospital", color: "bg-red-100 hover:bg-red-200" },
      { id: "ligar", emoji: "📞", label: "Ligar", color: "bg-green-100 hover:bg-green-200" },
      { id: "visita", emoji: "🤝", label: "Visita", color: "bg-teal-100 hover:bg-teal-200" },
      { id: "sozinho", emoji: "🧍", label: "Sozinho", color: "bg-gray-100 hover:bg-gray-200" },
    ],
  },
  {
    name: "Corpo",
    emoji: "❤️",
    color: "bg-red-50 border-red-200",
    symbols: [
      { id: "cabeca", emoji: "🤕", label: "Cabeça", color: "bg-red-100 hover:bg-red-200" },
      { id: "estomago", emoji: "🤢", label: "Estômago", color: "bg-green-100 hover:bg-green-200" },
      { id: "coracao", emoji: "❤️", label: "Coração", color: "bg-red-100 hover:bg-red-200" },
      { id: "respirar", emoji: "💨", label: "Respirar", color: "bg-sky-100 hover:bg-sky-200" },
      { id: "fraco", emoji: "😮‍💨", label: "Fraco", color: "bg-gray-100 hover:bg-gray-200" },
      { id: "enjoo", emoji: "🤮", label: "Enjoo", color: "bg-yellow-100 hover:bg-yellow-200" },
      { id: "tontura", emoji: "😵", label: "Tontura", color: "bg-purple-100 hover:bg-purple-200" },
      { id: "febre", emoji: "🌡️", label: "Febre", color: "bg-orange-100 hover:bg-orange-200" },
    ],
  },
];

const URGENCY_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  "baixa": { label: "Baixa", color: "text-green-700", bg: "bg-green-100 border-green-300", icon: <Check className="w-4 h-4" /> },
  "média": { label: "Média", color: "text-yellow-700", bg: "bg-yellow-100 border-yellow-300", icon: <AlertTriangle className="w-4 h-4" /> },
  "alta": { label: "Alta", color: "text-orange-700", bg: "bg-orange-100 border-orange-300", icon: <AlertTriangle className="w-4 h-4" /> },
  "emergência": { label: "EMERGÊNCIA", color: "text-red-700", bg: "bg-red-100 border-red-400", icon: <AlertCircle className="w-4 h-4" /> },
};

interface HistoryEntry {
  symbols: string[];
  intencao: string;
  urgencia: string;
  emocao: string;
  time: string;
}

export default function Aphasia() {
  const [selectedCategory, setSelectedCategory] = useState<number>(0);
  const [selectedSymbols, setSelectedSymbols] = useState<string[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [speakEnabled, setSpeakEnabled] = useState(true);
  const [urgencyMode, setUrgencyMode] = useState(false);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      synthRef.current = window.speechSynthesis;
    }
  }, []);

  const speak = useCallback(
    (text: string) => {
      if (!speakEnabled || !synthRef.current) return;
      synthRef.current.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = "pt-BR";
      utter.rate = 0.85;
      utter.pitch = 1.0;
      synthRef.current.speak(utter);
    },
    [speakEnabled],
  );

  const mutation = usePictorialChat({
    mutation: {
      onSuccess: (data) => {
        speak(data.intencao);
        const entry: HistoryEntry = {
          symbols: [...selectedSymbols],
          intencao: data.intencao,
          urgencia: data.urgencia,
          emocao: data.emocao,
          time: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
        };
        setHistory((prev) => [entry, ...prev].slice(0, 10));
        if (data.urgencia === "emergência") {
          setUrgencyMode(true);
        }
      },
    },
  });

  const handleSymbolClick = (symbol: Symbol) => {
    setSelectedSymbols((prev) =>
      prev.includes(symbol.id) ? prev.filter((s) => s !== symbol.id) : [...prev, symbol.id],
    );
  };

  const handleSend = () => {
    if (selectedSymbols.length === 0) return;
    const historicoTexts = history.slice(0, 3).map((h) => h.intencao);
    mutation.mutate({
      data: {
        symbols: selectedSymbols,
        historico: historicoTexts,
      },
    });
  };

  const handleClear = () => {
    setSelectedSymbols([]);
    mutation.reset();
    setUrgencyMode(false);
  };

  const handleSpeakResult = () => {
    if (mutation.data?.intencao) {
      speak(mutation.data.intencao);
    }
  };

  const urgencyConf = mutation.data
    ? (URGENCY_CONFIG[mutation.data.urgencia] ?? URGENCY_CONFIG["baixa"])
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50/40 to-white">
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Brain className="h-7 w-7 text-primary" />
              Comunicador AAC
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Inteligência Artificial Pictórica — Afasia em Português
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
          </div>
        </div>

        <AnimatePresence>
          {urgencyMode && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="rounded-xl border-2 border-red-400 bg-red-50 p-4 flex items-center gap-3"
            >
              <AlertCircle className="h-8 w-8 text-red-600 shrink-0 animate-pulse" />
              <div className="flex-1">
                <p className="font-bold text-red-700 text-lg">EMERGÊNCIA DETECTADA</p>
                <p className="text-red-600 text-sm">Chame ajuda imediatamente ou ligue para o SAMU: 192</p>
              </div>
              <Button variant="destructive" size="sm" onClick={() => setUrgencyMode(false)}>
                Fechar
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 space-y-4">
            <Card className="border shadow-sm">
              <CardHeader className="pb-2 pt-4 px-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    Símbolos selecionados
                  </CardTitle>
                  {selectedSymbols.length > 0 && (
                    <Button variant="ghost" size="sm" onClick={handleClear} className="h-7 text-xs">
                      <Trash2 className="h-3.5 w-3.5 mr-1" />
                      Limpar
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="min-h-[60px] flex flex-wrap gap-2 items-center">
                  <AnimatePresence>
                    {selectedSymbols.length === 0 ? (
                      <p className="text-muted-foreground text-sm italic">
                        Toque nos símbolos abaixo para compor sua mensagem...
                      </p>
                    ) : (
                      selectedSymbols.map((id) => {
                        const sym = CATEGORIES.flatMap((c) => c.symbols).find((s) => s.id === id);
                        if (!sym) return null;
                        return (
                          <motion.button
                            key={id}
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            onClick={() => handleSymbolClick(sym)}
                            className="flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10 border border-primary/30 text-sm font-medium hover:bg-red-100 hover:border-red-300 transition-colors"
                          >
                            <span className="text-base">{sym.emoji}</span>
                            <span>{sym.label}</span>
                            <X className="h-3 w-3 text-muted-foreground ml-0.5" />
                          </motion.button>
                        );
                      })
                    )}
                  </AnimatePresence>
                </div>

                <div className="mt-3 flex gap-2">
                  <Button
                    onClick={handleSend}
                    disabled={selectedSymbols.length === 0 || mutation.isPending}
                    className="flex-1"
                    size="lg"
                  >
                    {mutation.isPending ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Interpretando...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Enviar mensagem
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <AnimatePresence>
              {mutation.data && (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                >
                  <Card className={`border-2 ${urgencyConf?.bg ?? "border-border"} shadow-sm`}>
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-xl font-semibold text-foreground leading-tight">
                          &ldquo;{mutation.data.intencao}&rdquo;
                        </p>
                        <Button
                          variant="outline"
                          size="icon"
                          className="shrink-0"
                          onClick={handleSpeakResult}
                          title="Ouvir"
                        >
                          <Volume2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {urgencyConf && (
                          <Badge
                            variant="outline"
                            className={`${urgencyConf.color} ${urgencyConf.bg} border flex items-center gap-1`}
                          >
                            {urgencyConf.icon}
                            Urgência: {urgencyConf.label}
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-purple-700 bg-purple-50 border-purple-200">
                          Emoção: {mutation.data.emocao}
                        </Badge>
                        <Badge variant="outline" className="text-blue-700 bg-blue-50 border-blue-200">
                          Confiança: {Math.round(mutation.data.confianca * 100)}%
                        </Badge>
                      </div>

                      {mutation.data.nota_cuidador && (
                        <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
                          <p className="text-xs font-semibold text-amber-700 mb-0.5 uppercase tracking-wide">
                            Nota para o cuidador
                          </p>
                          <p className="text-sm text-amber-800">{mutation.data.nota_cuidador}</p>
                        </div>
                      )}

                      {mutation.data.sugestoes.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
                            Próximas sugestões
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {mutation.data.sugestoes.map((s, i) => (
                              <Badge
                                key={i}
                                variant="secondary"
                                className="text-xs cursor-pointer hover:bg-primary/20"
                              >
                                {s}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            {mutation.isError && (
              <Card className="border-red-200 bg-red-50">
                <CardContent className="p-4">
                  <p className="text-red-700 text-sm flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Erro ao processar. Verifique a conexão e tente novamente.
                  </p>
                </CardContent>
              </Card>
            )}

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
            </div>

            <Card className={`border-2 ${CATEGORIES[selectedCategory].color} shadow-sm`}>
              <CardContent className="p-4">
                <div className="grid grid-cols-4 gap-2">
                  {CATEGORIES[selectedCategory].symbols.map((sym) => {
                    const isSelected = selectedSymbols.includes(sym.id);
                    return (
                      <motion.button
                        key={sym.id}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => handleSymbolClick(sym)}
                        className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all text-center ${
                          isSelected
                            ? "border-primary bg-primary/10 shadow-sm"
                            : `${sym.color} border-transparent`
                        }`}
                      >
                        <span className="text-3xl leading-none">{sym.emoji}</span>
                        <span className="text-xs font-medium text-foreground leading-tight">{sym.label}</span>
                        {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
                      </motion.button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card className="border shadow-sm">
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Histórico
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                {history.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">
                    Mensagens enviadas aparecerão aqui.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {history.map((entry, i) => {
                      const uc = URGENCY_CONFIG[entry.urgencia] ?? URGENCY_CONFIG["baixa"];
                      return (
                        <div key={i} className={`rounded-lg p-2 border text-xs ${uc.bg}`}>
                          <div className="flex items-center justify-between mb-0.5">
                            <span className={`font-semibold ${uc.color} flex items-center gap-1`}>
                              {uc.icon}
                              {entry.urgencia}
                            </span>
                            <span className="text-muted-foreground">{entry.time}</span>
                          </div>
                          <p className="text-foreground font-medium leading-snug">{entry.intencao}</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {entry.symbols.slice(0, 4).map((s) => {
                              const sym = CATEGORIES.flatMap((c) => c.symbols).find((x) => x.id === s);
                              return sym ? (
                                <span key={s} title={sym.label} className="text-sm">
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
            </Card>

            <Card className="border shadow-sm bg-gradient-to-b from-red-50 to-rose-50">
              <CardHeader className="pb-1 pt-4 px-4">
                <CardTitle className="text-sm font-semibold text-red-700 uppercase tracking-wide flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  Emergência
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 space-y-2">
                <p className="text-xs text-red-600">Em caso de urgência:</p>
                <div className="space-y-1.5">
                  <a
                    href="tel:192"
                    className="block w-full text-center rounded-lg bg-red-100 border border-red-300 text-red-700 font-bold py-2 text-sm hover:bg-red-200 transition-colors"
                  >
                    📞 SAMU — 192
                  </a>
                  <a
                    href="tel:193"
                    className="block w-full text-center rounded-lg bg-orange-100 border border-orange-300 text-orange-700 font-bold py-2 text-sm hover:bg-orange-200 transition-colors"
                  >
                    🔥 Bombeiros — 193
                  </a>
                  <a
                    href="tel:190"
                    className="block w-full text-center rounded-lg bg-blue-100 border border-blue-300 text-blue-700 font-bold py-2 text-sm hover:bg-blue-200 transition-colors"
                  >
                    🚔 Polícia — 190
                  </a>
                </div>
              </CardContent>
            </Card>

            <Card className="border shadow-sm bg-gradient-to-b from-slate-50 to-white">
              <CardContent className="px-4 py-3 space-y-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Sobre o IAP</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  A teoria IAP propõe que o pensamento ocorre em espaços topológicos pré-linguísticos. Esta
                  interface usa o modelo{" "}
                  <span className="font-medium text-foreground">Gemini 2.5 Flash</span> para interpretar
                  sequências pictóricas e traduzi-las em linguagem natural em português.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
