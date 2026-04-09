import React, { useState, useEffect, useRef, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquareMore, X, RefreshCw, Filter, ZoomIn, ZoomOut, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface CAAPicto {
  id: string | number;
  palavra: string;
  imagemUrl: string;
  categoria: string;
  coordX: number;
  coordY: number;
  vizinhos: { id: string | number; palavra: string; distancia: number }[];
  vectorSource?: string;
}

interface AtlasData {
  pictos: CAAPicto[];
  keywords: string[];
  source: string;
  total: number;
  categorias: Record<string, number>;
  mdsInfo?: {
    vectorModel?: string;
    dimensions?: number;
    notes?: string;
  };
}

const CAT_COLOR: Record<string, string> = {
  linguagem_sinais:    "#06b6d4",
  prancha_comunicacao: "#8b5cf6",
  fala_articulacao:    "#f97316",
  voz:                 "#22c55e",
  audicao:             "#f59e0b",
  gesto:               "#3b82f6",
  dispositivo_caa:     "#ec4899",
  apoio_terapia:       "#14b8a6",
  familia_cuidador:    "#a78bfa",
  emocao_expressao:    "#e11d48",
  outros:              "#6b7280",
};

const CAT_LABEL: Record<string, string> = {
  linguagem_sinais:    "Linguagem de Sinais",
  prancha_comunicacao: "Prancha/Pictograma",
  fala_articulacao:    "Fala/Articulação",
  voz:                 "Voz",
  audicao:             "Audição",
  gesto:               "Gesto",
  dispositivo_caa:     "Dispositivo CAA",
  apoio_terapia:       "Apoio/Terapia",
  familia_cuidador:    "Família/Cuidador",
  emocao_expressao:    "Emoção/Expressão",
  outros:              "Outros",
};

const BASE_URL = (import.meta.env.BASE_URL ?? "/").replace(/\/$/, "");
function getApiUrl(p: string) { return `${BASE_URL}${p}`; }

export default function CAAAtlas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [selectedPicto, setSelectedPicto] = useState<CAAPicto | null>(null);
  const [activeCats, setActiveCats] = useState<Set<string>>(new Set());
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, ox: 0, oy: 0 });
  const hoveredRef = useRef<CAAPicto | null>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; picto: CAAPicto } | null>(null);

  const { data, isLoading, isError, refetch } = useQuery<AtlasData>({
    queryKey: ["caa-atlas"],
    queryFn: async () => {
      const resp = await fetch(getApiUrl("/api/iap/caa-atlas"));
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      return resp.json();
    },
    staleTime: Infinity,
    retry: 1,
  });

  const pictos = data?.pictos ?? [];
  const allCats = [...new Set(pictos.map((p) => p.categoria))].sort();
  const visible = activeCats.size === 0 ? pictos : pictos.filter((p) => activeCats.has(p.categoria));

  const toggleCat = useCallback((cat: string) => {
    setActiveCats((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat); else next.add(cat);
      return next;
    });
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || visible.length === 0) return;

    const W = container.clientWidth;
    const H = container.clientHeight;
    canvas.width = W;
    canvas.height = H;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, W, H);

    const allX = visible.map((p) => p.coordX);
    const allY = visible.map((p) => p.coordY);
    const minX = Math.min(...allX), maxX = Math.max(...allX);
    const minY = Math.min(...allY), maxY = Math.max(...allY);
    const rangeX = maxX - minX || 1;
    const rangeY = maxY - minY || 1;

    const padding = 60;
    const baseScale = Math.min((W - padding * 2) / rangeX, (H - padding * 2) / rangeY);
    const scale = baseScale * zoom;

    const toCanvas = (p: CAAPicto) => ({
      cx: (p.coordX - minX) * scale + padding + offset.x + (W - (rangeX * scale + padding * 2)) / 2,
      cy: (p.coordY - minY) * scale + padding + offset.y + (H - (rangeY * scale + padding * 2)) / 2,
    });

    const radius = Math.max(2, Math.min(6, 5 * zoom));

    for (const p of visible) {
      const { cx, cy } = toCanvas(p);
      const color = CAT_COLOR[p.categoria] ?? "#6b7280";
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fillStyle = color + "cc";
      ctx.fill();
      if (zoom > 2) {
        ctx.strokeStyle = color;
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }
    }

    if (hoveredRef.current) {
      const p = hoveredRef.current;
      const { cx, cy } = toCanvas(p);
      const color = CAT_COLOR[p.categoria] ?? "#6b7280";
      ctx.beginPath();
      ctx.arc(cx, cy, radius + 3, 0, Math.PI * 2);
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }, [visible, zoom, offset]);

  useEffect(() => { draw(); }, [draw]);

  const getHitPicto = useCallback((clientX: number, clientY: number): CAAPicto | null => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || visible.length === 0) return null;

    const rect = canvas.getBoundingClientRect();
    const mx = clientX - rect.left;
    const my = clientY - rect.top;

    const W = container.clientWidth, H = container.clientHeight;
    const allX = visible.map((p) => p.coordX), allY = visible.map((p) => p.coordY);
    const minX = Math.min(...allX), maxX = Math.max(...allX);
    const minY = Math.min(...allY), maxY = Math.max(...allY);
    const rangeX = maxX - minX || 1, rangeY = maxY - minY || 1;
    const padding = 60;
    const baseScale = Math.min((W - padding * 2) / rangeX, (H - padding * 2) / rangeY);
    const scale = baseScale * zoom;

    let best: CAAPicto | null = null, bestDist = 12;
    for (const p of visible) {
      const cx = (p.coordX - minX) * scale + padding + offset.x + (W - (rangeX * scale + padding * 2)) / 2;
      const cy = (p.coordY - minY) * scale + padding + offset.y + (H - (rangeY * scale + padding * 2)) / 2;
      const d = Math.sqrt((mx - cx) ** 2 + (my - cy) ** 2);
      if (d < bestDist) { bestDist = d; best = p; }
    }
    return best;
  }, [visible, zoom, offset]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging) {
      setOffset({ x: e.clientX - dragStart.current.x + dragStart.current.ox, y: e.clientY - dragStart.current.y + dragStart.current.oy });
      return;
    }
    const hit = getHitPicto(e.clientX, e.clientY);
    if (hit !== hoveredRef.current) {
      hoveredRef.current = hit;
      draw();
      if (hit) {
        const rect = canvasRef.current!.getBoundingClientRect();
        setTooltip({ x: e.clientX - rect.left, y: e.clientY - rect.top, picto: hit });
      } else setTooltip(null);
    }
  }, [isDragging, getHitPicto, draw]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    dragStart.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
    setIsDragging(true);
  }, [offset]);

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    const dx = Math.abs(e.clientX - dragStart.current.x);
    const dy = Math.abs(e.clientY - dragStart.current.y);
    setIsDragging(false);
    if (dx < 4 && dy < 4) {
      const hit = getHitPicto(e.clientX, e.clientY);
      if (hit) setSelectedPicto(hit);
    }
  }, [getHitPicto]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setZoom((z) => Math.max(0.3, Math.min(10, z * (e.deltaY > 0 ? 0.9 : 1.1))));
  }, []);

  const resetView = () => { setZoom(1); setOffset({ x: 0, y: 0 }); };

  const touchRef = useRef<{ x: number; y: number; startX: number; startY: number; dist: number } | null>(null);
  const getTouchDist = (t: React.TouchList) => t.length >= 2 ? Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY) : 0;
  const getTouchCenter = (t: React.TouchList) => t.length >= 2 ? { x: (t[0].clientX + t[1].clientX) / 2, y: (t[0].clientY + t[1].clientY) / 2 } : { x: t[0].clientX, y: t[0].clientY };

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    const c = getTouchCenter(e.touches);
    touchRef.current = { x: c.x, y: c.y, startX: c.x, startY: c.y, dist: getTouchDist(e.touches) };
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    if (!touchRef.current) return;
    const c = getTouchCenter(e.touches);
    const nd = getTouchDist(e.touches);
    if (e.touches.length >= 2 && touchRef.current.dist > 0 && nd > 0) setZoom((z) => Math.max(0.3, Math.min(10, z * nd / touchRef.current!.dist)));
    setOffset((prev) => ({ x: prev.x + c.x - touchRef.current!.x, y: prev.y + c.y - touchRef.current!.y }));
    touchRef.current.x = c.x; touchRef.current.y = c.y; touchRef.current.dist = nd || touchRef.current.dist;
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    if (!touchRef.current) return;
    if (e.changedTouches.length === 1 && e.touches.length === 0) {
      const t = e.changedTouches[0];
      if (Math.abs(t.clientX - touchRef.current.startX) < 8 && Math.abs(t.clientY - touchRef.current.startY) < 8) {
        const hit = getHitPicto(t.clientX, t.clientY);
        if (hit) setSelectedPicto(hit);
      }
    }
    touchRef.current = null;
  }, [getHitPicto]);

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8">
        <div className="w-10 h-10 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
        <p className="text-muted-foreground font-mono text-sm">Carregando atlas CAA com vetores Gemma 4 31B…</p>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8">
        <p className="text-red-400 font-mono">Erro ao carregar o Atlas CAA. Verifique se o servidor está rodando.</p>
        <Button variant="outline" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" /> Tentar novamente
        </Button>
      </div>
    );
  }

  const geminiCount = pictos.filter((p) => p.vectorSource === "gemini").length;

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Header */}
      <div className="px-6 pt-6 pb-3 border-b border-border/40 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-cyan-400">
          <MessageSquareMore className="h-5 w-5" />
          <span className="font-bold font-mono text-lg">ATLAS CAA</span>
        </div>
        <span className="text-muted-foreground text-sm">
          Comunicação Aumentativa e Alternativa · {visible.length.toLocaleString("pt-BR")} ícones ·{" "}
          <span className="text-cyan-400">IAP + Gemma 4 31B</span>
        </span>
        {geminiCount > 0 && (
          <Badge variant="outline" className="border-cyan-400/40 text-cyan-400 text-xs gap-1">
            <Sparkles className="h-3 w-3" />
            {geminiCount} vetores Gemini
          </Badge>
        )}
        <div className="ml-auto flex gap-2">
          <Button size="sm" variant="ghost" onClick={() => setZoom((z) => Math.min(10, z * 1.3))}>
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setZoom((z) => Math.max(0.3, z * 0.77))}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={resetView}>
            <RefreshCw className="h-4 w-4" />
            <span className="ml-1 hidden sm:inline">Resetar</span>
          </Button>
        </div>
      </div>

      {/* Category filter */}
      <div className="px-6 py-2 border-b border-border/40 flex flex-wrap gap-2 items-center">
        <Filter className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        <span className="text-xs text-muted-foreground mr-1">Filtrar:</span>
        {allCats.map((cat) => {
          const color = CAT_COLOR[cat] ?? "#6b7280";
          const active = activeCats.has(cat);
          const count = data.categorias?.[cat] ?? pictos.filter((p) => p.categoria === cat).length;
          return (
            <button
              key={cat}
              onClick={() => toggleCat(cat)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                active ? "border-transparent text-white" : "border-border/40 text-muted-foreground hover:border-border"
              }`}
              style={active ? { backgroundColor: color, borderColor: color } : {}}
            >
              <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
              {CAT_LABEL[cat] ?? cat}
              <span className="opacity-70">({count})</span>
            </button>
          );
        })}
        {activeCats.size > 0 && (
          <button onClick={() => setActiveCats(new Set())} className="text-xs text-muted-foreground underline ml-2">
            Limpar filtros
          </button>
        )}
      </div>

      {/* Canvas */}
      <div className="flex-1 flex min-h-0 relative">
        <div
          ref={containerRef}
          className="flex-1 relative min-h-0"
          style={{ cursor: isDragging ? "grabbing" : "crosshair" }}
        >
          <canvas
            ref={canvasRef}
            className="w-full h-full block"
            onMouseMove={handleMouseMove}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseLeave={() => { setIsDragging(false); hoveredRef.current = null; setTooltip(null); draw(); }}
            onWheel={handleWheel}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={{ touchAction: "none" }}
          />

          {tooltip && (
            <div
              className="absolute pointer-events-none z-10 bg-background/90 border border-border/60 rounded-lg px-3 py-2 text-sm shadow-lg max-w-[200px]"
              style={{
                left: tooltip.x + 14,
                top: tooltip.y - 10,
                transform: tooltip.x > (containerRef.current?.clientWidth ?? 400) * 0.7 ? "translateX(-110%)" : "none",
              }}
            >
              <div className="font-medium text-foreground truncate">{tooltip.picto.palavra}</div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: CAT_COLOR[tooltip.picto.categoria] ?? "#6b7280" }} />
                <span className="text-xs text-muted-foreground">{CAT_LABEL[tooltip.picto.categoria] ?? tooltip.picto.categoria}</span>
              </div>
            </div>
          )}

          <div className="absolute bottom-3 left-3 text-xs text-muted-foreground font-mono bg-background/60 px-2 py-1 rounded">
            {Math.round(zoom * 100)}% · {visible.length.toLocaleString("pt-BR")} ícones
          </div>
          <div className="absolute bottom-3 right-3 text-xs text-muted-foreground hidden sm:block">
            Scroll zoom · Drag mover · Click detalhes
          </div>
        </div>

        {/* Detail panel */}
        <AnimatePresence>
          {selectedPicto && (
            <motion.div
              initial={{ x: 320, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 320, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="w-72 border-l border-border/40 bg-card/80 backdrop-blur p-5 flex flex-col gap-4 overflow-y-auto shrink-0"
            >
              <div className="flex items-center justify-between">
                <Badge
                  className="font-mono text-xs"
                  style={{
                    backgroundColor: (CAT_COLOR[selectedPicto.categoria] ?? "#6b7280") + "33",
                    color: CAT_COLOR[selectedPicto.categoria] ?? "#6b7280",
                    borderColor: (CAT_COLOR[selectedPicto.categoria] ?? "#6b7280") + "66",
                  }}
                  variant="outline"
                >
                  {CAT_LABEL[selectedPicto.categoria] ?? selectedPicto.categoria}
                </Badge>
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setSelectedPicto(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {selectedPicto.imagemUrl && (
                <div className="flex justify-center">
                  <img
                    src={selectedPicto.imagemUrl}
                    alt={selectedPicto.palavra}
                    className="w-28 h-28 object-contain rounded-xl bg-white/5 p-2 border border-border/40"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                </div>
              )}

              <div className="text-center">
                <h3 className="font-bold font-mono text-lg text-foreground capitalize">{selectedPicto.palavra}</h3>
                <p className="text-xs text-muted-foreground mt-1 font-mono">ID: {selectedPicto.id} · Noun Project</p>
                <div className="flex justify-center gap-3 mt-2 text-xs text-muted-foreground">
                  <span>X: {selectedPicto.coordX.toFixed(3)}</span>
                  <span>Y: {selectedPicto.coordY.toFixed(3)}</span>
                </div>
                {selectedPicto.vectorSource && (
                  <div className="flex justify-center mt-1">
                    <Badge variant="outline" className="text-xs border-cyan-400/30 text-cyan-400">
                      <Sparkles className="h-2.5 w-2.5 mr-1" />
                      {selectedPicto.vectorSource && selectedPicto.vectorSource !== "fallback" ? `Vetor ${selectedPicto.vectorSource}` : "Vetor sintético"}
                    </Badge>
                  </div>
                )}
              </div>

              {selectedPicto.vizinhos.length > 0 && (
                <div>
                  <p className="text-xs font-mono text-muted-foreground mb-2 uppercase tracking-wider">Vizinhos Topológicos</p>
                  <div className="space-y-2">
                    {selectedPicto.vizinhos.map((v, i) => (
                      <div
                        key={v.id}
                        className="flex items-center justify-between bg-muted/30 rounded-lg px-3 py-2 cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => { const f = pictos.find((p) => String(p.id) === String(v.id)); if (f) setSelectedPicto(f); }}
                      >
                        <span className="text-sm text-foreground capitalize truncate max-w-[140px]">{i + 1}. {v.palavra}</span>
                        <span className="text-xs text-muted-foreground font-mono ml-2 shrink-0">d={v.distancia.toFixed(3)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-auto pt-3 border-t border-border/40">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Posição calculada pelo Algoritmo JP: vetores semânticos 12D gerados por Gemma 4 31B, diagramas de persistência Vietoris-Rips, distâncias de Wasserstein exatas e MDS global — atlas CAA com {pictos.length.toLocaleString("pt-BR")} ícones.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
