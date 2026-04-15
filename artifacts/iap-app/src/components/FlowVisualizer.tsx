// Visualizador de Fluxos de Pensamento — AlgoritmoJP
// Componente principal com interface em Português do Brasil

import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, GitBranch, X, RotateCcw, Search, AlertCircle, CheckCircle2, Loader2, Sparkles, Quote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useFlowVisualization } from "@/hooks/useFlowVisualization";
import type { PictoMinimo } from "@/utils/buildGraph";

// ── Cores e rótulos por categoria (consistente com NounAtlas) ─────────────────
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

function corCategoria(cat: string): string {
  return CAT_COLOR[cat] ?? "#6b7280";
}
function labelCategoria(cat: string): string {
  return CAT_LABEL[cat] ?? cat;
}
function iniciais(palavra: string): string {
  return palavra
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

// ── Seletor com busca ─────────────────────────────────────────────────────────
interface SeletorProps {
  label: string;
  placeholder: string;
  pictos: PictoMinimo[];
  selecionado: PictoMinimo | null;
  onSelecionar: (picto: PictoMinimo | null) => void;
  destaque?: "origem" | "destino";
}

function SeletorPensamento({ label, placeholder, pictos, selecionado, onSelecionar, destaque }: SeletorProps) {
  const [busca, setBusca] = useState("");
  const [buscaDebounced, setBuscaDebounced] = useState("");
  const [aberto, setAberto] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fechar ao clicar fora
  useEffect(() => {
    function handleClickFora(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setAberto(false);
      }
    }
    document.addEventListener("mousedown", handleClickFora);
    return () => document.removeEventListener("mousedown", handleClickFora);
  }, []);

  // Debounce de 150ms para a busca — evita filtragem a cada tecla
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setBuscaDebounced(busca), 150);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [busca]);

  // Filtrar pictogramas usando termo debounced — busca em PT e EN
  const filtrados = buscaDebounced.trim().length >= 1
    ? pictos
        .filter((p) => {
          const q = buscaDebounced.toLowerCase();
          const ptLabel = (p.palavraPt ?? "").toLowerCase();
          return ptLabel.includes(q) || p.palavra.toLowerCase().includes(q);
        })
        .slice(0, 50)
    : [];

  const corDestaque = destaque === "origem" ? "#06b6d4" : "#a855f7";

  function selecionar(picto: PictoMinimo) {
    onSelecionar(picto);
    setBusca("");
    setAberto(false);
  }

  function limparSelecao() {
    onSelecionar(null);
    setBusca("");
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  return (
    <div ref={containerRef} className="flex-1 min-w-0">
      <label className="block text-xs font-mono text-muted-foreground mb-1.5 uppercase tracking-wider">
        {label}
      </label>

      {selecionado ? (
        // Chip do item selecionado
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-lg border"
          style={{
            borderColor: corCategoria(selecionado.categoria) + "66",
            backgroundColor: corCategoria(selecionado.categoria) + "15",
          }}
        >
          <span
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 text-white"
            style={{ backgroundColor: corCategoria(selecionado.categoria) }}
          >
            {iniciais(selecionado.palavraPt ?? selecionado.palavra)}
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {selecionado.palavraPt ?? selecionado.palavra}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {labelCategoria(selecionado.categoria)}
            </p>
          </div>
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6 shrink-0"
            onClick={limparSelecao}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      ) : (
        // Input de busca
        <div className="relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              value={busca}
              onChange={(e) => { setBusca(e.target.value); setAberto(true); }}
              onFocus={() => setAberto(true)}
              placeholder={placeholder}
              className="w-full pl-9 pr-4 py-2 text-sm bg-muted/30 border border-border/60 rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring transition-all"
            />
          </div>

          {/* Dropdown de resultados */}
          <AnimatePresence>
            {aberto && filtrados.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.12 }}
                className="absolute z-50 w-full mt-1 max-h-64 overflow-y-auto bg-card border border-border/60 rounded-lg shadow-xl"
              >
                {filtrados.map((picto) => {
                  const cor = corCategoria(picto.categoria);
                  return (
                    <button
                      key={String(picto.id)}
                      onClick={() => selecionar(picto)}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-muted/50 transition-colors border-b border-border/20 last:border-0"
                    >
                      <span
                        className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 text-white"
                        style={{ backgroundColor: cor }}
                      >
                        {iniciais(picto.palavraPt ?? picto.palavra)}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground truncate">
                          {picto.palavraPt ?? picto.palavra}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {labelCategoria(picto.categoria)}
                        </p>
                      </div>
                    </button>
                  );
                })}
                {filtrados.length === 50 && (
                  <div className="px-3 py-2 text-xs text-muted-foreground text-center border-t border-border/20">
                    Mostrando 50 de muitos resultados — refine a busca
                  </div>
                )}
              </motion.div>
            )}
            {aberto && busca.trim().length >= 1 && filtrados.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute z-50 w-full mt-1 bg-card border border-border/60 rounded-lg shadow-xl px-3 py-4 text-sm text-muted-foreground text-center"
              >
                Nenhum pictograma encontrado para "{busca}"
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

// ── Card de nó do caminho ─────────────────────────────────────────────────────
interface CardNoProps {
  palavra: string;
  palavraPt?: string;
  categoria: string;
  isOrigem: boolean;
  isDestino: boolean;
  index: number;
}

function CardNo({ palavra, palavraPt, categoria, isOrigem, isDestino, index }: CardNoProps) {
  const cor = corCategoria(categoria);
  const label = palavraPt ?? palavra;
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay: index * 0.06, type: "spring", stiffness: 300, damping: 25 }}
      className="flex flex-col items-center gap-1.5 shrink-0"
    >
      {/* Avatar */}
      <div
        className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg"
        style={{
          backgroundColor: cor,
          boxShadow: (isOrigem || isDestino)
            ? `0 0 0 3px ${cor}44, 0 0 0 5px ${cor}22`
            : `0 4px 12px ${cor}33`,
          outline: isOrigem ? `2px solid ${cor}` : isDestino ? `2px dashed ${cor}` : "none",
          outlineOffset: "3px",
        }}
      >
        {iniciais(label)}
      </div>

      {/* Palavra */}
      <div className="text-center max-w-[100px]">
        <p className="text-xs font-medium text-foreground leading-tight line-clamp-2">
          {label}
        </p>
      </div>

      {/* Badge categoria */}
      <span
        className="text-[10px] px-2 py-0.5 rounded-full font-medium"
        style={{
          backgroundColor: cor + "22",
          color: cor,
          border: `1px solid ${cor}44`,
        }}
      >
        {labelCategoria(categoria)}
      </span>

      {/* Rótulo origem/destino */}
      {(isOrigem || isDestino) && (
        <span className="text-[10px] text-muted-foreground font-mono">
          {isOrigem ? "● Origem" : "◆ Destino"}
        </span>
      )}
    </motion.div>
  );
}

// ── Seta com distância ────────────────────────────────────────────────────────
function SetaDistancia({ dist, index }: { dist: number; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scaleX: 0 }}
      animate={{ opacity: 1, scaleX: 1 }}
      transition={{ delay: index * 0.06 + 0.03 }}
      className="flex flex-col items-center gap-0.5 shrink-0 px-1"
    >
      <span className="text-[10px] text-muted-foreground font-mono whitespace-nowrap">
        d={dist.toFixed(3)}
      </span>
      <ArrowRight className="h-5 w-5 text-muted-foreground" />
    </motion.div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────
interface FlowVisualizerProps {
  pictos: PictoMinimo[];
}

export function FlowVisualizer({ pictos }: FlowVisualizerProps) {
  const {
    origem, destino, resultado, calculando, erro, naoEncontrado,
    frases, modeloFrases, gerandoFrases, erroFrases,
    setOrigem, setDestino, calcularCaminho, limpar, gerarFrases, regerarFrases,
  } = useFlowVisualization(pictos);

  const podeCalcular = origem !== null && destino !== null &&
    String(origem.id) !== String(destino.id) && !calculando;

  const intermediarios = resultado ? resultado.nos.length - 2 : 0;

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-y-auto">

      {/* ── Painel de seleção ── */}
      <div className="px-6 py-5 border-b border-border/40 bg-card/30">
        <div className="max-w-4xl mx-auto space-y-4">

          {/* Seletores lado a lado */}
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <SeletorPensamento
              label="Pensamento de Origem (A)"
              placeholder="Selecione o pensamento de origem…"
              pictos={pictos}
              selecionado={origem}
              onSelecionar={setOrigem}
              destaque="origem"
            />

            {/* Ícone separador */}
            <div className="shrink-0 flex items-center justify-center pb-1">
              <ArrowRight className="h-5 w-5 text-muted-foreground hidden sm:block" />
              <span className="text-muted-foreground text-xs sm:hidden">↓</span>
            </div>

            <SeletorPensamento
              label="Pensamento de Destino (B)"
              placeholder="Selecione o pensamento de destino…"
              pictos={pictos}
              selecionado={destino}
              onSelecionar={setDestino}
              destaque="destino"
            />
          </div>

          {/* Botões */}
          <div className="flex gap-3">
            <Button
              onClick={calcularCaminho}
              disabled={!podeCalcular}
              className="flex-1 sm:flex-none gap-2 font-medium"
            >
              {calculando ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Calculando caminho…
                </>
              ) : (
                <>
                  <GitBranch className="h-4 w-4" />
                  Calcular Caminho Mais Curto
                </>
              )}
            </Button>

            {(origem || destino || resultado) && (
              <Button variant="outline" onClick={limpar} className="gap-2">
                <RotateCcw className="h-4 w-4" />
                <span className="hidden sm:inline">Limpar</span>
              </Button>
            )}
          </div>

          {/* Dica inicial */}
          {!origem && !destino && (
            <p className="text-xs text-muted-foreground">
              Dica: experimente buscar "Livro" como origem e "Escola" como destino para ver o AlgoritmoJP em ação.
            </p>
          )}
        </div>
      </div>

      {/* ── Área de resultado ── */}
      <div className="flex-1 px-6 py-6">
        <div className="max-w-5xl mx-auto space-y-6">

          {/* Erro */}
          {(erro || naoEncontrado) && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-3 p-4 rounded-lg border border-destructive/30 bg-destructive/10"
            >
              <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-destructive">
                  {naoEncontrado ? "Caminho não encontrado" : "Atenção"}
                </p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {naoEncontrado
                    ? "Caminho não encontrado entre estes pensamentos. O grafo kNN pode não conectar estas palavras diretamente. Tente outras combinações."
                    : erro}
                </p>
              </div>
            </motion.div>
          )}

          {/* Fluxo visual */}
          {resultado && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              {/* Header do resultado */}
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <h3 className="font-mono font-semibold text-foreground">
                  Fluxo de Pensamento Encontrado
                </h3>
                <Badge variant="outline" className="font-mono text-xs ml-auto">
                  AlgoritmoJP · Dijkstra kNN
                </Badge>
              </div>

              {/* Cards do caminho com scroll horizontal */}
              <div className="overflow-x-auto pb-4">
                <div className="flex items-start gap-0 min-w-max px-2 py-4">
                  {resultado.nos.map((no, idx) => (
                    <React.Fragment key={no.id}>
                      <CardNo
                        palavra={no.palavra}
                        palavraPt={no.palavraPt}
                        categoria={no.categoria}
                        isOrigem={idx === 0}
                        isDestino={idx === resultado.nos.length - 1}
                        index={idx}
                      />
                      {no.distanciaAteProximo !== null && (
                        <SetaDistancia dist={no.distanciaAteProximo} index={idx} />
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>

              {/* ── Estatísticas ── */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <EstatCard
                  titulo="Distância total"
                  valor={resultado.distanciaTotal.toFixed(4)}
                  mono
                />
                <EstatCard
                  titulo="Intermediários"
                  valor={String(Math.max(0, intermediarios))}
                />
                <EstatCard
                  titulo="Categorias Semânticas"
                  valor={String(resultado.categorias.length)}
                />
                <EstatCard
                  titulo="Nós no caminho"
                  valor={String(resultado.nos.length)}
                />
              </div>

              {/* Categorias percorridas */}
              <div>
                <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-2">
                  Categorias Semânticas Percorridas
                </p>
                <div className="flex flex-wrap gap-2">
                  {resultado.categorias.map((cat) => (
                    <span
                      key={cat}
                      className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium"
                      style={{
                        backgroundColor: corCategoria(cat) + "22",
                        color: corCategoria(cat),
                        border: `1px solid ${corCategoria(cat)}44`,
                      }}
                    >
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: corCategoria(cat) }}
                      />
                      {labelCategoria(cat)}
                    </span>
                  ))}
                </div>
              </div>

              {/* ── Seção de Frases Lógicas Geradas por IA ── */}
              <div className="border-t border-border/40 pt-5 space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4" style={{ color: "#8b5cf6" }} />
                    <h4 className="font-mono font-semibold text-sm text-foreground">
                      Frases Lógicas Geradas por IA
                    </h4>
                  </div>

                  {/* Botões de ação */}
                  {!frases && !gerandoFrases && !erroFrases && (
                    <Button
                      size="sm"
                      onClick={gerarFrases}
                      className="gap-2 font-medium"
                      style={{ backgroundColor: "#8b5cf6", color: "white" }}
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      Gerar com IA
                    </Button>
                  )}

                  {frases && !gerandoFrases && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={regerarFrases}
                      className="gap-2 text-xs"
                      style={{ borderColor: "#8b5cf644", color: "#8b5cf6" }}
                    >
                      <RotateCcw className="h-3 w-3" />
                      Regerar
                    </Button>
                  )}
                </div>

                {/* Estado de loading */}
                {gerandoFrases && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center gap-3 py-4 text-sm"
                    style={{ color: "#8b5cf6" }}
                  >
                    <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                    <span className="font-mono">Pensando no fluxo de pensamento…</span>
                  </motion.div>
                )}

                {/* Erro de frases */}
                {erroFrases && !gerandoFrases && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-start gap-3 p-3 rounded-lg border"
                    style={{ borderColor: "#8b5cf633", backgroundColor: "#8b5cf610" }}
                  >
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" style={{ color: "#8b5cf6" }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-muted-foreground">{erroFrases}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={gerarFrases}
                      className="shrink-0 text-xs"
                      style={{ color: "#8b5cf6" }}
                    >
                      Tentar novamente
                    </Button>
                  </motion.div>
                )}

                {/* Cards de frases */}
                {frases && !gerandoFrases && (
                  <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={{
                      hidden: {},
                      visible: { transition: { staggerChildren: 0.12 } },
                    }}
                    className="space-y-3"
                  >
                    {frases.map((frase, idx) => (
                      <motion.div
                        key={idx}
                        variants={{
                          hidden: { opacity: 0, x: -16 },
                          visible: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 280, damping: 24 } },
                        }}
                        className="flex items-start gap-3 p-4 rounded-lg border"
                        style={{ borderColor: "#8b5cf633", backgroundColor: "#8b5cf60a" }}
                      >
                        <Quote className="h-4 w-4 shrink-0 mt-0.5" style={{ color: "#8b5cf6" }} />
                        <p className="flex-1 text-sm text-foreground leading-relaxed">{frase}</p>
                        <span
                          className="shrink-0 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: "#8b5cf622", color: "#8b5cf6" }}
                        >
                          {idx + 1}
                        </span>
                      </motion.div>
                    ))}

                    {/* Modelo usado */}
                    {modeloFrases && (
                      <p className="text-[10px] text-muted-foreground font-mono text-right">
                        Gerado por {modeloFrases} · IAP/UFT (Passos, 2024)
                      </p>
                    )}
                  </motion.div>
                )}
              </div>

              {/* Nota técnica */}
              <p className="text-xs text-muted-foreground border-t border-border/40 pt-4 leading-relaxed">
                Caminho calculado pelo AlgoritmoJP usando Dijkstra sobre grafo kNN bidirecional.
                Distâncias euclidianas no espaço MDS derivado do AlgoritmoJP (Wasserstein + MDS clássico) · IAP/UFT (Passos, 2024)
              </p>
            </motion.div>
          )}

          {/* Estado inicial vazio */}
          {!resultado && !erro && !naoEncontrado && !calculando && (
            <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
              <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center">
                <GitBranch className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium text-foreground">
                  Visualizador de Fluxos de Pensamento
                </p>
                <p className="text-sm text-muted-foreground mt-1 max-w-md">
                  Selecione um pensamento de origem e um de destino para encontrar
                  o caminho mais curto no espaço semântico IAP com 149 conceitos únicos.
                </p>
              </div>
              <div className="flex gap-3 flex-wrap justify-center mt-2">
                {["comunicacao", "emocao", "acao", "saude"].map((cat) => (
                  <span
                    key={cat}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs"
                    style={{
                      backgroundColor: corCategoria(cat) + "22",
                      color: corCategoria(cat),
                      border: `1px solid ${corCategoria(cat)}44`,
                    }}
                  >
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: corCategoria(cat) }} />
                    {labelCategoria(cat)}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Card de estatística ───────────────────────────────────────────────────────
function EstatCard({ titulo, valor, mono }: { titulo: string; valor: string; mono?: boolean }) {
  return (
    <div className="bg-card/60 border border-border/40 rounded-lg px-4 py-3">
      <p className="text-xs text-muted-foreground mb-1">{titulo}</p>
      <p className={`text-xl font-bold text-foreground ${mono ? "font-mono" : ""}`}>
        {valor}
      </p>
    </div>
  );
}
