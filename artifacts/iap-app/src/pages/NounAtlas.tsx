import React, { useState, useEffect, useRef, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Globe, X, RefreshCw, Filter, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface NounPicto {
  id: string | number;
  palavra: string;
  imagemUrl: string;
  categoria: string;
  coordX: number;
  coordY: number;
  vizinhos: { id: string | number; palavra: string; distancia: number }[];
}

interface AtlasData {
  pictos: NounPicto[];
  keywords: string[];
  source: string;
  total: number;
  categorias: Record<string, number>;
}

const CAT_COLOR: Record<string, string> = {
  comunicacao:     "#06b6d4",
  emocao:          "#a855f7",
  corpo:           "#f97316",
  alimentacao:     "#22c55e",
  familia_pessoas: "#f59e0b",
  acao:            "#3b82f6",
  lugar:           "#ec4899",
  saude:           "#14b8a6",
  natureza:        "#84cc16",
  tempo:           "#8b5cf6",
  objeto:          "#64748b",
  escola:          "#e11d48",
  outros:          "#6b7280",
};

const CAT_LABEL: Record<string, string> = {
  comunicacao:     "Comunicação",
  emocao:          "Emoção",
  corpo:           "Corpo",
  alimentacao:     "Alimentação",
  familia_pessoas: "Família/Pessoas",
  acao:            "Ação",
  lugar:           "Lugar",
  saude:           "Saúde",
  natureza:        "Natureza",
  tempo:           "Tempo",
  objeto:          "Objeto",
  escola:          "Escola",
  outros:          "Outros",
};

const BASE_URL = (import.meta.env.BASE_URL ?? "/").replace(/\/$/, "");

function getApiUrl(path: string) {
  return `${BASE_URL}${path}`;
}

export default function NounAtlas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [selectedPicto, setSelectedPicto] = useState<NounPicto | null>(null);
  const [activeCats, setActiveCats] = useState<Set<string>>(new Set());
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, ox: 0, oy: 0 });
  const hoveredRef = useRef<NounPicto | null>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; picto: NounPicto } | null>(null);

  const { data, isLoading, isError, refetch } = useQuery<AtlasData>({
    queryKey: ["noun-atlas"],
    queryFn: async () => {
      const resp = await fetch(getApiUrl("/api/iap/noun-atlas"));
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      return resp.json();
    },
    staleTime: Infinity,
    retry: 1,
  });

  const pictos = data?.pictos ?? [];
  const allCats = [...new Set(pictos.map((p) => p.categoria))].sort();
  const visible = activeCats.size === 0
    ? pictos
    : pictos.filter((p) => activeCats.has(p.categoria));

  const toggleCat = useCallback((cat: string) => {
    setActiveCats((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  }, []);

  // Canvas rendering
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

    // Compute scale to fit all points
    const allX = visible.map((p) => p.coordX);
    const allY = visible.map((p) => p.coordY);
    const minX = Math.min(...allX);
    const maxX = Math.max(...allX);
    const minY = Math.min(...allY);
    const maxY = Math.max(...allY);
    const rangeX = maxX - minX || 1;
    const rangeY = maxY - minY || 1;

    const padding = 60;
    const baseScale = Math.min((W - padding * 2) / rangeX, (H - padding * 2) / rangeY);
    const scale = baseScale * zoom;

    const toCanvas = (p: NounPicto) => ({
      cx: (p.coordX - minX) * scale + padding + offset.x + (W - (rangeX * scale + padding * 2)) / 2,
      cy: (p.coordY - minY) * scale + padding + offset.y + (H - (rangeY * scale + padding * 2)) / 2,
    });

    const radius = Math.max(2, Math.min(5, 4 * zoom));

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

    // Draw hovered label
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

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, zoom, offset]);

  useEffect(() => { draw(); }, [draw]);

  // Mouse handlers
  const getHitPicto = useCallback((clientX: number, clientY: number): NounPicto | null => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || visible.length === 0) return null;

    const rect = canvas.getBoundingClientRect();
    const mx = clientX - rect.left;
    const my = clientY - rect.top;

    const W = container.clientWidth;
    const H = container.clientHeight;
    const allX = visible.map((p) => p.coordX);
    const allY = visible.map((p) => p.coordY);
    const minX = Math.min(...allX);
    const maxX = Math.max(...allX);
    const minY = Math.min(...allY);
    const maxY = Math.max(...allY);
    const rangeX = maxX - minX || 1;
    const rangeY = maxY - minY || 1;
    const padding = 60;
    const baseScale = Math.min((W - padding * 2) / rangeX, (H - padding * 2) / rangeY);
    const scale = baseScale * zoom;

    let best: NounPicto | null = null;
    let bestDist = 12;
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
      setOffset({
        x: e.clientX - dragStart.current.x + dragStart.current.ox,
        y: e.clientY - dragStart.current.y + dragStart.current.oy,
      });
      return;
    }
    const hit = getHitPicto(e.clientX, e.clientY);
    if (hit !== hoveredRef.current) {
      hoveredRef.current = hit;
      draw();
      if (hit) {
        const rect = canvasRef.current!.getBoundingClientRect();
        setTooltip({ x: e.clientX - rect.left, y: e.clientY - rect.top, picto: hit });
      } else {
        setTooltip(null);
      }
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

  // ── Touch handlers (pan + pinch-zoom) ──────────────────────────────────────
  const touchRef = useRef<{ x: number; y: number; startX: number; startY: number; dist: number } | null>(null);

  const getTouchDist = (t: React.TouchList) =>
    t.length >= 2
      ? Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY)
      : 0;

  const getTouchCenter = (t: React.TouchList) =>
    t.length >= 2
      ? { x: (t[0].clientX + t[1].clientX) / 2, y: (t[0].clientY + t[1].clientY) / 2 }
      : { x: t[0].clientX, y: t[0].clientY };

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    const center = getTouchCenter(e.touches);
    touchRef.current = { x: center.x, y: center.y, startX: center.x, startY: center.y, dist: getTouchDist(e.touches) };
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    if (!touchRef.current) return;
    const center = getTouchCenter(e.touches);
    const newDist = getTouchDist(e.touches);
    const dx = center.x - touchRef.current.x;
    const dy = center.y - touchRef.current.y;

    if (e.touches.length >= 2 && touchRef.current.dist > 0 && newDist > 0) {
      const ratio = newDist / touchRef.current.dist;
      setZoom((z) => Math.max(0.3, Math.min(10, z * ratio)));
    }

    if (dx !== 0 || dy !== 0) {
      setOffset((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
    }

    touchRef.current.x = center.x;
    touchRef.current.y = center.y;
    touchRef.current.dist = newDist || touchRef.current.dist;
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    if (!touchRef.current) return;
    if (e.changedTouches.length === 1 && e.touches.length === 0) {
      const t = e.changedTouches[0];
      const dx = Math.abs(t.clientX - touchRef.current.startX);
      const dy = Math.abs(t.clientY - touchRef.current.startY);
      if (dx < 8 && dy < 8) {
        const hit = getHitPicto(t.clientX, t.clientY);
        if (hit) setSelectedPicto(hit);
      }
    }
    touchRef.current = null;
  }, [getHitPicto]);

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8">
        <div className="w-10 h-10 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin" />
        <p className="text-muted-foreground font-mono text-sm">Carregando atlas com 3.000+ ícones…</p>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8">
        <p className="text-red-400 font-mono">Erro ao carregar o atlas. Verifique se o servidor está rodando.</p>
        <Button variant="outline" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" /> Tentar novamente
        </Button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Header */}
      <div className="px-6 pt-6 pb-3 border-b border-border/40 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-indigo-400">
          <Globe className="h-5 w-5" />
          <span className="font-bold font-mono text-lg">ATLAS NOUN PROJECT</span>
        </div>
        <span className="text-muted-foreground text-sm">
          Inteligência Artificial Pictórica · {visible.length.toLocaleString("pt-BR")} ícones ·{" "}
          <span className="text-indigo-400">IAP Algorithm (Wasserstein + MDS)</span>
        </span>
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

      {/* Category filter bar */}
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
                active
                  ? "border-transparent text-white"
                  : "border-border/40 text-muted-foreground hover:border-border"
              }`}
              style={active ? { backgroundColor: color, borderColor: color } : {}}
            >
              <span
                className="inline-block w-2 h-2 rounded-full"
                style={{ backgroundColor: color }}
              />
              {CAT_LABEL[cat] ?? cat}
              <span className="opacity-70">({count})</span>
            </button>
          );
        })}
        {activeCats.size > 0 && (
          <button
            onClick={() => setActiveCats(new Set())}
            className="text-xs text-muted-foreground underline ml-2"
          >
            Limpar filtros
          </button>
        )}
      </div>

      {/* Canvas area */}
      <div className="flex-1 flex min-h-0 relative">
        <div
          ref={containerRef}
          className="flex-1 relative min-h-0 cursor-crosshair"
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

          {/* Tooltip */}
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
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: CAT_COLOR[tooltip.picto.categoria] ?? "#6b7280" }}
                />
                <span className="text-xs text-muted-foreground">
                  {CAT_LABEL[tooltip.picto.categoria] ?? tooltip.picto.categoria}
                </span>
              </div>
            </div>
          )}

          {/* Zoom indicator */}
          <div className="absolute bottom-3 left-3 text-xs text-muted-foreground font-mono bg-background/60 px-2 py-1 rounded">
            {Math.round(zoom * 100)}% · {visible.length.toLocaleString("pt-BR")} ícones
          </div>

          {/* Hint */}
          <div className="absolute bottom-3 right-3 text-xs text-muted-foreground hidden sm:block">
            Scroll para zoom · Drag para mover · Click para detalhes
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
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  onClick={() => setSelectedPicto(null)}
                >
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
                <h3 className="font-bold font-mono text-lg text-foreground capitalize">
                  {selectedPicto.palavra}
                </h3>
                <p className="text-xs text-muted-foreground mt-1 font-mono">
                  ID: {selectedPicto.id} · Noun Project
                </p>
                <div className="flex justify-center gap-3 mt-2 text-xs text-muted-foreground">
                  <span>X: {selectedPicto.coordX.toFixed(3)}</span>
                  <span>Y: {selectedPicto.coordY.toFixed(3)}</span>
                </div>
              </div>

              {selectedPicto.vizinhos.length > 0 && (
                <div>
                  <p className="text-xs font-mono text-muted-foreground mb-2 uppercase tracking-wider">
                    Vizinhos Topológicos
                  </p>
                  <div className="space-y-2">
                    {selectedPicto.vizinhos.map((v, i) => (
                      <div
                        key={v.id}
                        className="flex items-center justify-between bg-muted/30 rounded-lg px-3 py-2 cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => {
                          const found = pictos.find((p) => String(p.id) === String(v.id));
                          if (found) setSelectedPicto(found);
                        }}
                      >
                        <span className="text-sm text-foreground capitalize truncate max-w-[140px]">
                          {i + 1}. {v.palavra}
                        </span>
                        <span className="text-xs text-muted-foreground font-mono ml-2 shrink-0">
                          d={v.distancia.toFixed(3)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-auto pt-3 border-t border-border/40">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Posição calculada pelo Algoritmo JP via distâncias de Wasserstein entre diagramas de persistência — mapa semântico IAP com {pictos.length.toLocaleString("pt-BR")} ícones.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
