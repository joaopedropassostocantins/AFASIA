import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  LayoutDashboard,
  ArrowUpRight,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

interface WassersteinStats {
  min: number;
  avg: number;
  max: number;
}

interface AtlasMetric {
  name: string;
  slug: string;
  href: string;
  color: string;
  vizinhosMethod: string;
  vectorModel: string;
  total: number;
  categorias: number;
  wasserstein: WassersteinStats;
  mdsVariance: { x: number; y: number };
  histogram: number[];
  closeNeighbors: number;
}

interface MetricsResponse {
  atlases: AtlasMetric[];
  geradoEm: string;
}

const BIN_LABELS = [
  "0–0.1",
  "0.1–0.2",
  "0.2–0.3",
  "0.3–0.4",
  "0.4–0.5",
  "0.5–0.6",
  "0.6–0.7",
  "0.7–0.8",
  "0.8–0.9",
  "0.9–1.0",
  ">1.0",
];

function MiniDotCloud({ atlas }: { atlas: AtlasMetric }) {
  const svgSize = 160;
  const pad = 8;
  const inner = svgSize - pad * 2;

  // Use histogram as a proxy for the dot cloud — render a simple scatter
  // We don't have individual coords here, so render a representative
  // silhouette from histogram density
  const maxCount = Math.max(...atlas.histogram, 1);
  const bars = atlas.histogram.slice(0, 10);

  return (
    <svg
      width={svgSize}
      height={svgSize}
      viewBox={`0 0 ${svgSize} ${svgSize}`}
      className="rounded-lg"
    >
      <rect width={svgSize} height={svgSize} rx={8} fill="hsl(var(--card))" />
      {bars.map((count, i) => {
        const barW = inner / bars.length;
        const barH = (count / maxCount) * (inner * 0.8);
        const x = pad + i * barW + barW * 0.1;
        const y = svgSize - pad - barH;
        return (
          <rect
            key={i}
            x={x}
            y={y}
            width={barW * 0.8}
            height={barH}
            rx={2}
            fill={atlas.color}
            opacity={0.7 + (i / bars.length) * 0.3}
          />
        );
      })}
    </svg>
  );
}

const METRIC_ROWS: {
  label: string;
  key: keyof AtlasMetric | string;
  format: (v: AtlasMetric) => React.ReactNode;
  hint?: string;
}[] = [
  {
    label: "Total de ícones",
    key: "total",
    format: (a) => a.total.toLocaleString("pt-BR"),
    hint: "Número de pictogramas no atlas",
  },
  {
    label: "Categorias",
    key: "categorias",
    format: (a) => a.categorias,
    hint: "Grupos semânticos distintos",
  },
  {
    label: "Distância W. mínima",
    key: "wMin",
    format: (a) => a.wasserstein.min.toFixed(4),
    hint: "Menor distância de Wasserstein (1º vizinho)",
  },
  {
    label: "Distância W. média",
    key: "wAvg",
    format: (a) => a.wasserstein.avg.toFixed(4),
    hint: "Distância média ao 1º vizinho",
  },
  {
    label: "Distância W. máxima",
    key: "wMax",
    format: (a) => a.wasserstein.max.toFixed(4),
    hint: "Maior distância ao 1º vizinho",
  },
  {
    label: "Vizinhos próximos (< 0.3)",
    key: "closeNeighbors",
    format: (a) => {
      const pct = ((a.closeNeighbors / a.total) * 100).toFixed(1);
      return `${a.closeNeighbors} (${pct}%)`;
    },
    hint: "Ícones com vizinho a distância < 0.3",
  },
  {
    label: "Variância MDS (x)",
    key: "varX",
    format: (a) => a.mdsVariance.x.toFixed(4),
    hint: "Espalhamento horizontal no espaço MDS",
  },
  {
    label: "Variância MDS (y)",
    key: "varY",
    format: (a) => a.mdsVariance.y.toFixed(4),
    hint: "Espalhamento vertical no espaço MDS",
  },
  {
    label: "Modelo vetorial",
    key: "vectorModel",
    format: (a) => (
      <span className="font-mono text-xs">{a.vectorModel}</span>
    ),
    hint: "Modelo que gerou os vetores semânticos 12D",
  },
];

function getBestAtlas(atlases: AtlasMetric[]): string {
  // Best = highest % of close neighbors (< 0.3)
  let best = atlases[0];
  for (const a of atlases) {
    if (a.closeNeighbors / a.total > best.closeNeighbors / best.total) {
      best = a;
    }
  }
  return best.slug;
}

export default function CompareAtlas() {
  const { data, isLoading, isError, refetch } = useQuery<MetricsResponse>({
    queryKey: ["atlas-metrics"],
    queryFn: async () => {
      const res = await fetch(`${BASE}/api/iap/atlas-metrics`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json() as Promise<MetricsResponse>;
    },
    staleTime: 5 * 60 * 1000,
  });

  const chartData = useMemo(() => {
    if (!data) return [];
    return BIN_LABELS.map((label, i) => {
      const entry: Record<string, string | number> = { label };
      for (const a of data.atlases) {
        entry[a.name] = a.histogram[i] ?? 0;
      }
      return entry;
    });
  }, [data]);

  const bestSlug = useMemo(
    () => (data ? getBestAtlas(data.atlases) : null),
    [data]
  );

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
        <p className="text-muted-foreground font-mono text-sm">
          Calculando métricas dos 3 atlas…
        </p>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8">
        <AlertCircle className="h-8 w-8 text-destructive" />
        <p className="text-muted-foreground text-sm">
          Não foi possível carregar as métricas.
        </p>
        <Button size="sm" onClick={() => refetch()}>
          Tentar novamente
        </Button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-y-auto">
      {/* Header */}
      <div className="px-6 pt-6 pb-3 border-b border-border/40">
        <div className="flex items-center gap-2 text-primary">
          <LayoutDashboard className="h-5 w-5" />
          <span className="font-bold font-mono text-lg">COMPARAÇÃO · 3 ATLAS IAP</span>
        </div>
        <p className="text-muted-foreground text-sm mt-1">
          Avaliação comparativa dos atlases topológicos — Noun 3k, CAA e Disfasia — com métricas de
          Wasserstein, MDS e cobertura de vocabulário.
        </p>
      </div>

      <div className="flex-1 p-6 space-y-8">
        {/* Atlas cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {data.atlases.map((atlas, idx) => (
            <motion.div
              key={atlas.slug}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-card border border-border/50 rounded-xl p-4 flex flex-col gap-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: atlas.color }}
                  />
                  <span className="font-bold font-mono text-sm">
                    {atlas.name}
                  </span>
                </div>
                {bestSlug === atlas.slug && (
                  <Badge
                    variant="outline"
                    className="text-xs border-primary/40 text-primary"
                  >
                    Melhor cobertura
                  </Badge>
                )}
              </div>

              <MiniDotCloud atlas={atlas} />

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-muted/30 rounded-lg p-2">
                  <div className="text-muted-foreground">Ícones</div>
                  <div className="font-bold font-mono">
                    {atlas.total.toLocaleString("pt-BR")}
                  </div>
                </div>
                <div className="bg-muted/30 rounded-lg p-2">
                  <div className="text-muted-foreground">Categorias</div>
                  <div className="font-bold font-mono">{atlas.categorias}</div>
                </div>
                <div className="bg-muted/30 rounded-lg p-2">
                  <div className="text-muted-foreground">W. médio</div>
                  <div
                    className="font-bold font-mono"
                    style={{ color: atlas.color }}
                  >
                    {atlas.wasserstein.avg.toFixed(3)}
                  </div>
                </div>
                <div className="bg-muted/30 rounded-lg p-2">
                  <div className="text-muted-foreground">Viz. &lt;0.3</div>
                  <div
                    className="font-bold font-mono"
                    style={{ color: atlas.color }}
                  >
                    {((atlas.closeNeighbors / atlas.total) * 100).toFixed(0)}%
                  </div>
                </div>
              </div>

              <Link href={atlas.href}>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full gap-1 text-xs"
                  style={{ borderColor: atlas.color + "40", color: atlas.color }}
                >
                  Abrir atlas
                  <ArrowUpRight className="h-3 w-3" />
                </Button>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Wasserstein distribution chart */}
        <div className="bg-card border border-border/50 rounded-xl p-4">
          <h3 className="font-bold font-mono text-sm text-foreground mb-1">
            Distribuição de Distâncias de Wasserstein
          </h3>
          <p className="text-muted-foreground text-xs mb-4">
            Histograma das distâncias ao 1º vizinho de cada pictograma nos 3 atlas (eixo X = faixas de distância, eixo Y = contagem de ícones)
          </p>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData} barCategoryGap="20%">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="label"
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
              />
              <YAxis
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--popover))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  color: "hsl(var(--popover-foreground))",
                  fontSize: 12,
                }}
              />
              <Legend
                wrapperStyle={{
                  fontSize: 11,
                  color: "hsl(var(--muted-foreground))",
                }}
              />
              {data.atlases.map((a) => (
                <Bar key={a.slug} dataKey={a.name} fill={a.color} radius={[3, 3, 0, 0]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Metrics table */}
        <div className="bg-card border border-border/50 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border/40">
            <h3 className="font-bold font-mono text-sm">
              Tabela de Métricas Comparativas
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/40 bg-muted/20">
                  <th className="text-left px-4 py-2 text-muted-foreground font-medium text-xs">
                    Métrica
                  </th>
                  {data.atlases.map((a) => (
                    <th
                      key={a.slug}
                      className="text-right px-4 py-2 font-medium text-xs"
                      style={{ color: a.color }}
                    >
                      {a.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {METRIC_ROWS.map((row, ri) => (
                  <tr
                    key={row.key}
                    className={`border-b border-border/20 ${ri % 2 === 0 ? "" : "bg-muted/10"}`}
                  >
                    <td className="px-4 py-2 text-muted-foreground text-xs">
                      <div>{row.label}</div>
                      {row.hint && (
                        <div className="text-muted-foreground/50 text-[10px] mt-0.5">
                          {row.hint}
                        </div>
                      )}
                    </td>
                    {data.atlases.map((a) => (
                      <td
                        key={a.slug}
                        className="text-right px-4 py-2 font-mono text-xs"
                      >
                        {row.format(a)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Scientific interpretation */}
        <div className="bg-card border border-border/50 rounded-xl p-4">
          <h3 className="font-bold font-mono text-sm mb-2">
            Interpretação Científica
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-muted-foreground">
            {data.atlases.map((a) => (
              <div key={a.slug} className="space-y-1">
                <div
                  className="font-bold text-foreground flex items-center gap-1"
                >
                  <span
                    className="w-2 h-2 rounded-full inline-block"
                    style={{ backgroundColor: a.color }}
                  />
                  {a.name}
                </div>
                <p>
                  Distância Wasserstein média de{" "}
                  <span className="font-mono">{a.wasserstein.avg.toFixed(3)}</span>{" "}
                  entre pictogramas —{" "}
                  {a.wasserstein.avg < 0.2
                    ? "cluster muito compacto, vocabulário altamente coeso."
                    : a.wasserstein.avg < 0.4
                    ? "cluster moderadamente coeso, boa separação semântica."
                    : "maior diversidade semântica entre ícones."}
                </p>
                <p>
                  {((a.closeNeighbors / a.total) * 100).toFixed(0)}% dos ícones têm vizinho
                  próximo (&lt;0.3), indicando{" "}
                  {a.closeNeighbors / a.total > 0.6
                    ? "alta densidade topológica."
                    : a.closeNeighbors / a.total > 0.3
                    ? "densidade topológica moderada."
                    : "vocabulário mais disperso no espaço semântico."}
                </p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-muted-foreground/50 text-xs text-right font-mono pb-2">
          Métricas geradas em {new Date(data.geradoEm).toLocaleString("pt-BR")} · Algoritmo JP — IAP
        </p>
      </div>
    </div>
  );
}
