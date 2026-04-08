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
import { Network, X, RefreshCw, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  fluencia:    "#06b6d4",
  sequencia:   "#f59e0b",
  emocao:      "#a855f7",
  espaco:      "#22c55e",
  comunicacao: "#3b82f6",
  outros:      "#6b7280",
};

const CAT_LABEL: Record<string, string> = {
  fluencia:    "Fluência",
  sequencia:   "Sequência",
  emocao:      "Emoção",
  espaco:      "Espaço",
  comunicacao: "Comunicação",
  outros:      "Outros",
};

const BASE_URL = import.meta.env.BASE_URL.replace(/\/$/, "");

async function fetchDisfasiaAtlas(): Promise<AtlasPictogram[]> {
  const res = await fetch(`${BASE_URL}/api/iap/disfasia-atlas`);
  if (!res.ok) throw new Error("Erro ao carregar atlas da disfasia");
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

export default function DisfasiaAtlas() {
  const [pictos, setPictos] = useState<AtlasPictogram[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<AtlasPictogram | null>(null);
  const [loaded, setLoaded] = useState(false);

  const doLoadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    setSelected(null);
    try {
      const result = await fetchDisfasiaAtlas();
      setPictos(result);
      setLoaded(true);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, []);

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
    <div className="min-h-screen bg-gradient-to-b from-violet-50/30 to-white pb-12">
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Network className="h-7 w-7 text-primary" />
            Atlas Semântico da Disfasia
          </h1>
          <p className="text-sm text-muted-foreground">
            Mapa topológico de pictogramas ARASAAC para disfasia, calculado via Distância de Wasserstein (IAP)
          </p>
        </div>

        <Card className="border border-border/60">
          <CardContent className="p-4">
            <div className="flex gap-2 items-center">
              <p className="text-sm text-muted-foreground flex-1">
                Este atlas agrupa pictogramas das 5 categorias relevantes ao perfil disfásico: Fluência,
                Sequência, Emoção, Espaço e Comunicação. As posições no mapa refletem distâncias topológicas
                calculadas pelo Algoritmo JP.
              </p>
              <Button
                type="button"
                onClick={doLoadAll}
                disabled={loading}
                className="whitespace-nowrap shrink-0"
              >
                {loading
                  ? <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  : <BookOpen className="h-4 w-4 mr-2" />}
                {loaded ? "Recarregar Atlas" : "Carregar Atlas Disfasia"}
              </Button>
            </div>
            {error && <p className="text-red-600 text-sm mt-2">⚠ {error}</p>}
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
              <p className="text-sm">Calculando atlas topológico para disfasia…</p>
            </motion.div>
          )}
        </AnimatePresence>

        {!loading && loaded && pictos.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p>Nenhum pictograma encontrado no atlas.</p>
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
                      Mapa Topológico — Disfasia
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
                              shape={(shapeProps: Record<string, unknown>) => (
                                <ScatterDot
                                  {...(shapeProps as { cx?: number; cy?: number; fill?: string; payload?: AtlasPictogram })}
                                  selected={selected?.id === (shapeProps.payload as AtlasPictogram)?.id}
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

              <div className="space-y-4">
                {selected ? (
                  <Card className="border border-border/60">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-semibold">Pictograma Selecionado</CardTitle>
                        <button
                          onClick={() => setSelected(null)}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-start gap-3">
                        <img
                          src={selected.imagemUrl}
                          alt={selected.palavra}
                          className="w-20 h-20 rounded-lg object-contain border border-border bg-white"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                        />
                        <div>
                          <p className="font-semibold text-foreground capitalize">{selected.palavra}</p>
                          <Badge
                            variant="secondary"
                            className="text-xs mt-1"
                            style={{ backgroundColor: `${CAT_COLOR[selected.categoria]}20`, color: CAT_COLOR[selected.categoria] }}
                          >
                            {CAT_LABEL[selected.categoria] ?? selected.categoria}
                          </Badge>
                          <p className="text-xs text-muted-foreground mt-1">
                            ({selected.coordX.toFixed(2)}, {selected.coordY.toFixed(2)})
                          </p>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                          Vizinhos mais próximos
                        </p>
                        <div className="space-y-1">
                          {selected.vizinhos.map((v) => (
                            <div key={v.id} className="flex items-center justify-between text-xs">
                              <span className="text-foreground capitalize">{v.palavra}</span>
                              <span className="text-muted-foreground font-mono">d={v.distancia.toFixed(3)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="border border-dashed border-border/60 bg-muted/20">
                    <CardContent className="p-6 text-center text-muted-foreground text-sm">
                      Clique num ponto do mapa para ver os detalhes do pictograma.
                    </CardContent>
                  </Card>
                )}

                <Card className="border border-border/60">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold">Categorias Disfasia</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {CATEGORIES.filter((cat) => (catGroups[cat]?.length ?? 0) > 0).map((cat) => (
                        <div key={cat} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CAT_COLOR[cat] }} />
                            <span className="text-foreground">{CAT_LABEL[cat]}</span>
                          </div>
                          <span className="text-muted-foreground">{catGroups[cat]?.length ?? 0} pictos</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            <Card className="border border-border/60 bg-violet-50/30">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground italic leading-relaxed">
                  <strong className="text-foreground">Atlas Semântico da Disfasia</strong> — construído com
                  pictogramas ARASAAC e a teoria <strong className="text-foreground">IAP — Inteligência
                  Artificial Pictórica</strong> de João Pedro Pereira Passos (UFT, 2026). As distâncias entre
                  pictogramas são calculadas via aproximação da Distância de Wasserstein sobre diagramas de
                  persistência de espaços topológicos pré-linguísticos.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {!loaded && !loading && (
          <div className="text-center py-16 text-muted-foreground space-y-3">
            <Network className="h-12 w-12 mx-auto opacity-30" />
            <p className="text-sm">Clique em "Carregar Atlas Disfasia" para visualizar o mapa semântico.</p>
          </div>
        )}
      </div>
    </div>
  );
}
