// Página do Visualizador de Fluxos de Pensamento
// Rota: /fluxo

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearch } from "wouter";
import { GitBranch, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FlowVisualizer } from "@/components/FlowVisualizer";
import type { PictoMinimo } from "@/utils/buildGraph";

const BASE_URL = (import.meta.env.BASE_URL ?? "/").replace(/\/$/, "");

function getApiUrl(path: string) {
  return `${BASE_URL}${path}`;
}

interface AtlasData {
  pictos: PictoMinimo[];
  total: number;
  totalConceitos: number;
  totalVariantes: number;
}

export default function FlowPage() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const initialDe = params.get("de") ?? undefined;
  const initialAte = params.get("ate") ?? undefined;

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

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8">
        <div className="w-10 h-10 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin" />
        <p className="text-muted-foreground font-mono text-sm">
          Carregando espaço semântico com 149 conceitos…
        </p>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8">
        <p className="text-red-400 font-mono text-sm">
          Erro ao carregar os pictogramas. Verifique se o servidor está rodando.
        </p>
        <Button variant="outline" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" /> Tentar novamente
        </Button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Cabeçalho */}
      <div className="px-6 pt-6 pb-4 border-b border-border/40">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-indigo-400">
            <GitBranch className="h-5 w-5" />
            <span className="font-bold font-mono text-lg">
              VISUALIZADOR DE FLUXOS DE PENSAMENTO
            </span>
          </div>
          <span className="text-muted-foreground text-sm">
            AlgoritmoJP · Dijkstra sobre grafo kNN ·{" "}
            <span className="text-indigo-400">
              {(data.totalConceitos ?? data.total).toLocaleString("pt-BR")} conceitos únicos · {(data.totalVariantes ?? 3443).toLocaleString("pt-BR")} variantes
            </span>
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-2 max-w-2xl">
          Encontre o caminho semântico mais curto entre dois pictogramas no espaço topológico
          gerado pelo Algoritmo JP (Wasserstein + MDS). Cada seta representa a menor distância
          semântica entre pensamentos adjacentes no grafo de vizinhança.
        </p>
      </div>

      {/* Componente principal */}
      <FlowVisualizer
        pictos={data.pictos}
        initialDe={initialDe}
        initialAte={initialAte}
      />
    </div>
  );
}
