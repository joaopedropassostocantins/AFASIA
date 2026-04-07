import React, { useState, useCallback } from "react";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Map, X, RefreshCw, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface AtlasPictogram {
  id: number;
  palavra: string;
  imagemUrl: string;
  categoria: string;
  coordX: number;
  coordY: number;
  vizinhos: { id: number; palavra: string; distancia: number }[];
}

const CAT_COLOR: Record<string, string> = {
  necessidades: "#f97316",
  sentimentos: "#a855f7",
  lugares: "#22c55e",
  pessoas: "#3b82f6",
  acoes: "#ef4444",
  outros: "#6b7280",
};

const CAT_LABEL: Record<string, string> = {
  necessidades: "Necessidades",
  sentimentos: "Sentimentos",
  lugares: "Lugares",
  pessoas: "Pessoas",
  acoes: "Ações",
  outros: "Outros",
};

const BASE_URL = import.meta.env.BASE_URL.replace(/\/$/, "");

async function fetchAtlas(query: string): Promise<AtlasPictogram[]> {
  const res = await fetch(`${BASE_URL}/api/iap/atlas?query=${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error("Erro ao buscar atlas");
  const data = await res.json() as { pictos: AtlasPictogram[] };
  return data.pictos;
}

async function fetchAtlasCategorias(): Promise<AtlasPictogram[]> {
  const res = await fetch(`${BASE_URL}/api/iap/atlas/categorias`);
  if (!res.ok) throw new Error("Erro ao carregar atlas completo");
  const data = await res.json() as { pictos: AtlasPictogram[] };
  return data.pictos;
}

function ScatterDot(props: {
  cx?: number;
  cy?: number;
  fill?: string;
  payload?: AtlasPictogram;
  selected?: boolean;
  onClick?: (p: AtlasPictogram) => void;
}) {
  const { cx = 0, cy = 0, fill = "#ccc", payload, selected, onClick } = props;
  if (!payload) return null;
  return (
    <circle
      cx={cx}
      cy={cy}
      r={selected ? 10 : 7}
      fill={fill}
      stroke={selected ? "#fff" : "transparent"}
      strokeWidth={selected ? 2.5 : 0}
      style={{ cursor: "pointer", transition: "r 0.15s" }}
      onClick={() => onClick?.(payload)}
    />
  );
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: { payload: AtlasPictogram }[] }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="bg-white border border-border rounded-lg shadow-lg p-2 text-xs max-w-[140px]">
      <div className="flex items-center gap-1.5 mb-1">
        <div
          className="w-2 h-2 rounded-full shrink-0"
          style={{ backgroundColor: CAT_COLOR[p.categoria] ?? "#ccc" }}
        />
        <span className="font-semibold text-foreground truncate">{p.palavra}</span>
      </div>
      <span className="text-muted-foreground">{CAT_LABEL[p.categoria] ?? p.categoria}</span>
    </div>
  );
}

const CATEGORIES = Object.keys(CAT_LABEL);

export default function Atlas() {
  const [searchQuery, setSearchQuery] = useState("");
  const [pictos, setPictos] = useState<AtlasPictogram[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<AtlasPictogram | null>(null);
  const [searched, setSearched] = useState(false);

  const doSearch = useCallback(async (query: string) => {
    setLoading(true);
    setError(null);
    setSelected(null);
    try {
      const result = await fetchAtlas(query);
      setPictos(result);
      setSearched(true);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  const doLoadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    setSelected(null);
    try {
      const result = await fetchAtlasCategorias();
      setPictos(result);
      setSearched(true);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) doSearch(searchQuery.trim());
  };

  const catGroups = CATEGORIES.reduce<Record<string, AtlasPictogram[]>>((acc, cat) => {
    acc[cat] = pictos.filter((p) => p.categoria === cat);
    return acc;
  }, {});

  const legendPayload = CATEGORIES.filter((cat) => (catGroups[cat]?.length ?? 0) > 0).map((cat) => ({
    value: CAT_LABEL[cat],
    color: CAT_COLOR[cat],
    type: "circle" as const,
  }));

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50/40 to-white pb-12">
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Map className="h-7 w-7 text-primary" />
            Atlas Topológico da Afasia
          </h1>
          <p className="text-sm text-muted-foreground">
            Mapa semântico-topológico de pictogramas ARASAAC, calculado via Distância de Wasserstein e teoria IAP
          </p>
        </div>

        <Card className="border border-border/60">
          <CardContent className="p-4">
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder="Buscar palavra em português (ex: água, dor, família...)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  disabled={loading}
                />
              </div>
              <Button type="submit" disabled={loading || !searchQuery.trim()}>
                {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : "Buscar"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={doLoadAll}
                disabled={loading}
                className="whitespace-nowrap"
              >
                {loading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <BookOpen className="h-4 w-4 mr-2" />}
                Carregar Atlas Completo
              </Button>
            </form>
            {error && (
              <p className="text-red-600 text-sm mt-2">⚠ {error}</p>
            )}
          </CardContent>
        </Card>

        <AnimatePresence>
          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3"
            >
              <RefreshCw className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm">Consultando ARASAAC e calculando distâncias topológicas...</p>
            </motion.div>
          )}
        </AnimatePresence>

        {!loading && searched && pictos.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p>Nenhum pictograma encontrado. Tente outra palavra.</p>
          </div>
        )}

        {!loading && pictos.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card className="border border-border/60">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                      Mapa Topológico
                      <Badge variant="secondary" className="text-xs font-normal">
                        {pictos.length} pictogramas
                      </Badge>
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">
                      Cada ponto é um pictograma posicionado por distância de Wasserstein (IAP-MDS). Clique para ver detalhes.
                    </p>
                  </CardHeader>
                  <CardContent className="p-0 pb-4">
                    <ResponsiveContainer width="100%" height={400}>
                      <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 10 }}>
                        <XAxis
                          type="number"
                          dataKey="coordX"
                          name="Eixo 1"
                          tick={false}
                          axisLine={false}
                          tickLine={false}
                          label={{ value: "Dimensão Topológica 1", position: "insideBottom", offset: -8, fontSize: 11, fill: "#94a3b8" }}
                        />
                        <YAxis
                          type="number"
                          dataKey="coordY"
                          name="Eixo 2"
                          tick={false}
                          axisLine={false}
                          tickLine={false}
                          label={{ value: "Dim. 2", angle: -90, position: "insideLeft", fontSize: 11, fill: "#94a3b8" }}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend
                          payload={legendPayload}
                          wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                        />
                        {CATEGORIES.map((cat) => {
                          const catData = catGroups[cat];
                          if (!catData || catData.length === 0) return null;
                          return (
                            <Scatter
                              key={cat}
                              name={CAT_LABEL[cat]}
                              data={catData}
                              fill={CAT_COLOR[cat]}
                              shape={(props: unknown) => (
                                <ScatterDot
                                  {...(props as {
                                    cx?: number;
                                    cy?: number;
                                    fill?: string;
                                    payload?: AtlasPictogram;
                                  })}
                                  selected={selected?.id === (props as { payload?: AtlasPictogram }).payload?.id}
                                  onClick={setSelected}
                                />
                              )}
                            />
                          );
                        })}
                      </ScatterChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              <div>
                <AnimatePresence mode="wait">
                  {selected ? (
                    <motion.div
                      key={selected.id}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                    >
                      <Card className="border-2" style={{ borderColor: CAT_COLOR[selected.categoria] ?? "#ccc" }}>
                        <CardHeader className="pb-2">
                          <div className="flex items-start justify-between">
                            <div>
                              <Badge
                                style={{ backgroundColor: CAT_COLOR[selected.categoria] ?? "#ccc", color: "#fff" }}
                                className="text-xs mb-2"
                              >
                                {CAT_LABEL[selected.categoria] ?? selected.categoria}
                              </Badge>
                              <CardTitle className="text-xl capitalize">{selected.palavra}</CardTitle>
                              <p className="text-xs text-muted-foreground mt-0.5">ARASAAC #{selected.id}</p>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => setSelected(null)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex justify-center">
                            <img
                              src={selected.imagemUrl}
                              alt={selected.palavra}
                              className="w-32 h-32 object-contain rounded-xl border border-border/50 bg-white p-2"
                              loading="lazy"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = `https://api.arasaac.org/api/pictograms/${selected.id}?download=false&skin=white&resolution=500`;
                              }}
                            />
                          </div>
                          <div className="text-xs space-y-1.5">
                            <p className="font-semibold text-muted-foreground uppercase tracking-wide">
                              Coordenadas Topológicas
                            </p>
                            <div className="grid grid-cols-2 gap-2">
                              <div className="rounded-lg bg-slate-50 border p-2 text-center">
                                <p className="text-[10px] text-muted-foreground">Dim 1</p>
                                <p className="font-mono font-bold">{selected.coordX.toFixed(3)}</p>
                              </div>
                              <div className="rounded-lg bg-slate-50 border p-2 text-center">
                                <p className="text-[10px] text-muted-foreground">Dim 2</p>
                                <p className="font-mono font-bold">{selected.coordY.toFixed(3)}</p>
                              </div>
                            </div>
                          </div>
                          {selected.vizinhos.length > 0 && (
                            <div className="text-xs space-y-1.5">
                              <p className="font-semibold text-muted-foreground uppercase tracking-wide">
                                Vizinhos Topológicos
                              </p>
                              <div className="space-y-1.5">
                                {selected.vizinhos.map((v, i) => {
                                  const vPicto = pictos.find((p) => p.id === v.id);
                                  return (
                                    <div
                                      key={v.id}
                                      className="flex items-center gap-2 rounded-lg border bg-background p-1.5 cursor-pointer hover:bg-accent/50 transition-colors"
                                      onClick={() => {
                                        const vFull = pictos.find((p) => p.id === v.id);
                                        if (vFull) setSelected(vFull);
                                      }}
                                    >
                                      {vPicto && (
                                        <img
                                          src={vPicto.imagemUrl}
                                          alt={v.palavra}
                                          className="w-8 h-8 object-contain rounded shrink-0"
                                          loading="lazy"
                                        />
                                      )}
                                      <div className="flex-1 min-w-0">
                                        <p className="font-medium capitalize truncate">{v.palavra}</p>
                                        <p className="text-muted-foreground">d = {v.distancia}</p>
                                      </div>
                                      <span className="text-muted-foreground/60 font-mono text-[10px]">
                                        #{i + 1}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="empty"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <Card className="border border-dashed border-border/60 h-full min-h-[200px] flex items-center justify-center">
                        <CardContent className="text-center text-muted-foreground text-sm py-8">
                          <Map className="h-8 w-8 mx-auto mb-3 opacity-30" />
                          <p>Clique num ponto do mapa</p>
                          <p className="text-xs mt-1 opacity-70">para ver o pictograma, categoria e vizinhos topológicos</p>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                Pictogramas ARASAAC ({pictos.length})
              </h2>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                {pictos.map((p) => (
                  <motion.button
                    key={p.id}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelected(p)}
                    className={`flex flex-col items-center gap-1.5 rounded-xl border-2 p-2 text-center transition-all ${
                      selected?.id === p.id
                        ? "shadow-md"
                        : "border-transparent bg-white hover:shadow-sm"
                    }`}
                    style={
                      selected?.id === p.id
                        ? { borderColor: CAT_COLOR[p.categoria] ?? "#ccc", backgroundColor: `${CAT_COLOR[p.categoria]}10` }
                        : {}
                    }
                  >
                    <img
                      src={p.imagemUrl}
                      alt={p.palavra}
                      className="w-12 h-12 object-contain"
                      loading="lazy"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://api.arasaac.org/api/pictograms/${p.id}?download=false&skin=white&resolution=500`;
                      }}
                    />
                    <span className="text-xs font-medium text-foreground leading-tight capitalize line-clamp-2">
                      {p.palavra}
                    </span>
                    <div
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: CAT_COLOR[p.categoria] ?? "#ccc" }}
                      title={CAT_LABEL[p.categoria] ?? p.categoria}
                    />
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        <Card className="border border-border/40 bg-slate-50/60">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground leading-relaxed italic text-center">
              "Este é o primeiro <strong>Atlas Topológico da Afasia</strong>, construído com pictogramas ARASAAC e a teoria{" "}
              <strong>IAP — Inteligência Artificial Pictórica</strong> de João Pedro Pereira Passos (UFT, 2026).
              As distâncias entre pictogramas são calculadas via aproximação da <strong>Distância de Wasserstein</strong> sobre
              diagramas de persistência de espaços topológicos pré-linguísticos, como propõe o Algoritmo JP."
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
