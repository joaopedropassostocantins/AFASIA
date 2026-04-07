import React from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { BookOpen, ArrowLeft, ArrowRight, BrainCircuit, Accessibility, Network, MapPin, AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: "easeOut" } },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
};

function SectionHeader({ number, title, subtitle }: { number: string; title: string; subtitle: string }) {
  return (
    <div className="flex gap-4 items-start mb-8">
      <div className="flex-shrink-0 h-12 w-12 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center font-mono font-bold text-primary text-lg">
        {number}
      </div>
      <div>
        <h2 className="text-2xl font-bold font-mono text-foreground">{title}</h2>
        <p className="text-muted-foreground mt-1">{subtitle}</p>
      </div>
    </div>
  );
}

function CompareRow({ feature, llm, iap, highlight }: { feature: string; llm: string; iap: string; highlight?: boolean }) {
  return (
    <tr className={highlight ? "bg-primary/5" : ""}>
      <td className="py-3 px-4 text-sm font-medium text-foreground border-b border-border/50">{feature}</td>
      <td className="py-3 px-4 text-sm text-muted-foreground border-b border-border/50">
        <span className="flex items-center gap-2">
          <XCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
          {llm}
        </span>
      </td>
      <td className="py-3 px-4 text-sm text-foreground border-b border-border/50">
        <span className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
          {iap}
        </span>
      </td>
    </tr>
  );
}

function ConceptCard({ title, content }: { title: string; content: React.ReactNode }) {
  return (
    <Card className="bg-card/60 border-primary/20">
      <CardHeader className="pb-2">
        <CardTitle className="font-mono text-base text-primary">{title}</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground leading-relaxed">
        {content}
      </CardContent>
    </Card>
  );
}

export default function Appendix() {
  return (
    <div className="flex-1 flex flex-col">
      <div className="container max-w-4xl mx-auto px-4 md:px-8 py-10 space-y-20">

        {/* Header */}
        <motion.div variants={stagger} initial="hidden" animate="show">
          <motion.div variants={fadeUp} className="flex items-center gap-3 mb-4">
            <div className="h-12 w-12 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center text-primary">
              <BookOpen className="h-6 w-6" />
            </div>
            <div>
              <Badge variant="outline" className="mb-1 font-mono text-xs">Apêndice Científico</Badge>
              <h1 className="text-3xl md:text-4xl font-bold font-mono text-foreground leading-tight">
                IAP como IA sem Tokens,<br />Não-Probabilística e Topológica
              </h1>
            </div>
          </motion.div>
          <motion.p variants={fadeUp} className="text-muted-foreground text-lg leading-relaxed mt-4">
            Este apêndice explica por que o <strong className="text-foreground">Atlas Topológico da Afasia</strong> é
            prova de conceito de uma forma radicalmente diferente de inteligência artificial —
            fundamentada na teoria <strong className="text-primary">IAP — Inteligência Artificial Pictórica</strong> e no
            <strong className="text-foreground"> Algoritmo JP</strong> de João Pedro Pereira Passos (UFT, 2026).
          </motion.p>
          <motion.div variants={fadeUp} className="flex gap-3 mt-6 flex-wrap">
            <Link href="/atlas">
              <Button variant="outline" size="sm" className="gap-2">
                <MapPin className="h-4 w-4" /> Ver Atlas
              </Button>
            </Link>
            <Link href="/algorithm">
              <Button variant="outline" size="sm" className="gap-2">
                <BrainCircuit className="h-4 w-4" /> Algoritmo JP
              </Button>
            </Link>
            <Link href="/topology">
              <Button variant="outline" size="sm" className="gap-2">
                <Network className="h-4 w-4" /> Topologia
              </Button>
            </Link>
          </motion.div>
        </motion.div>

        <div className="w-full h-px bg-border/50" />

        {/* Section 1 */}
        <motion.section
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
        >
          <motion.div variants={fadeUp}>
            <SectionHeader
              number="01"
              title="O Problema com Tokens"
              subtitle="Por que a tokenização é um gargalo conceitual para IA semântica"
            />
          </motion.div>

          <motion.div variants={fadeUp} className="space-y-5 text-muted-foreground leading-relaxed">
            <p>
              Toda LLM (GPT, Gemini, LLaMA) começa pelo mesmo passo: <strong className="text-foreground">tokenizar</strong> o texto
              de entrada. Tokenizar significa fragmentar palavras em pedaços subléxicos definidos por frequência estatística
              em um corpus de treinamento. A palavra "afasia" pode virar <code className="bg-muted px-1 rounded text-xs">[af] [asia]</code>;
              "Wasserstein" pode virar <code className="bg-muted px-1 rounded text-xs">[Wass] [er] [stein]</code>.
            </p>
            <p>
              O problema não é técnico — é <strong className="text-foreground">conceitual</strong>. Se a unidade mínima de processamento
              é um fragmento estatístico de texto escrito, o modelo está, por definição, restrito ao universo simbólico da
              linguagem humana alfabética. Ele <em>nunca pode operar abaixo da linguagem</em>.
            </p>

            <div className="grid md:grid-cols-3 gap-4 mt-6">
              <ConceptCard
                title="Pacientes com afasia"
                content="Perderam o acesso ao código linguístico. Não conseguem tokenizar nem decodificar tokens. Mas ainda pensam, sentem e reconhecem significados. A mente opera abaixo do token."
              />
              <ConceptCard
                title="Crianças pré-linguísticas"
                content="Reconhecem rostos, emoções, intenções e categorias semânticas antes de adquirir qualquer token. A cognição pré-cede a tokenização."
              />
              <ConceptCard
                title="Animais não-humanos"
                content="Cães reconhecem o dono, polvos resolvem problemas, corvos planejam — sem nunca processar um único token de linguagem natural."
              />
            </div>

            <p className="mt-4 border-l-4 border-primary/50 pl-4 italic text-foreground/80">
              "Se a inteligência existe antes e além da linguagem, então um sistema verdadeiramente geral
              precisa de uma representação que também exista antes e além dos tokens."
              <span className="block text-xs text-muted-foreground mt-1 not-italic">— Premissa central do Algoritmo JP</span>
            </p>
          </motion.div>
        </motion.section>

        <div className="w-full h-px bg-border/50" />

        {/* Section 2 */}
        <motion.section
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.15 }}
        >
          <motion.div variants={fadeUp}>
            <SectionHeader
              number="02"
              title="Probabilidade vs. Geometria"
              subtitle="Duas arquiteturas de raciocínio radicalmente diferentes"
            />
          </motion.div>

          <motion.div variants={fadeUp}>
            <p className="text-muted-foreground leading-relaxed mb-6">
              LLMs raciocinam por <strong className="text-foreground">apostas</strong>: dado o contexto anterior,
              qual token tem maior probabilidade de vir a seguir? O Atlas IAP raciocina por
              <strong className="text-foreground"> proximidade geométrica</strong>: dado um conceito,
              quais outros conceitos estão mais próximos no espaço topológico?
            </p>

            <div className="rounded-xl border border-border overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="py-3 px-4 text-left text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider border-b border-border">Propriedade</th>
                    <th className="py-3 px-4 text-left text-xs font-mono font-semibold text-red-400 uppercase tracking-wider border-b border-border">LLM clássica</th>
                    <th className="py-3 px-4 text-left text-xs font-mono font-semibold text-emerald-400 uppercase tracking-wider border-b border-border">Atlas IAP</th>
                  </tr>
                </thead>
                <tbody>
                  <CompareRow feature="Unidade mínima" llm="Token (fragmento de texto)" iap="Pictograma (conceito inteiro)" highlight />
                  <CompareRow feature="Representação" llm="Vetor de embedding treinado" iap="Diagrama de persistência (invariante topológico)" />
                  <CompareRow feature="Distância semântica" llm="Cosseno (geométrico, aproximado)" iap="Wasserstein (transporte ótimo, exato)" highlight />
                  <CompareRow feature="Modo de raciocínio" llm="P(próximo token) — estocástico" iap="Vizinhos topológicos — determinístico" />
                  <CompareRow feature="Treinamento necessário" llm="Bilhões de parâmetros, meses de GPU" iap="Nenhum — cálculo analítico puro" highlight />
                  <CompareRow feature="Interpretabilidade" llm="Opaca — caixa preta" iap="Total — diagrama visualizável" />
                  <CompareRow feature="Funciona sem linguagem" llm="Não — depende de tokens" iap="Sim — opera sobre conceitos" highlight />
                </tbody>
              </table>
            </div>
          </motion.div>
        </motion.section>

        <div className="w-full h-px bg-border/50" />

        {/* Section 3 */}
        <motion.section
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.15 }}
        >
          <motion.div variants={fadeUp}>
            <SectionHeader
              number="03"
              title="Diagramas de Persistência como Representação de Significado"
              subtitle="Como o Atlas codifica cada conceito sem uma única palavra"
            />
          </motion.div>

          <motion.div variants={fadeUp} className="space-y-5 text-muted-foreground leading-relaxed">
            <p>
              Na topologia algébrica, um <strong className="text-foreground">diagrama de persistência</strong> é uma
              representação da "forma" de um espaço — capturando quando componentes conectadas nascem e morrem,
              quando buracos aparecem e desaparecem, conforme o espaço é filtrado por um parâmetro crescente.
              Cada ponto no diagrama é um evento topológico: <code className="bg-muted px-1 rounded text-xs">(nascimento, morte)</code>.
            </p>

            <p>
              No Atlas IAP, cada categoria semântica é mapeada a um <strong className="text-foreground">vetor de estado</strong> —
              cinco dimensões que codificam propriedades pré-linguísticas como urgência vital, valência emocional,
              concretude espacial, relacionalidade e agentividade. Por exemplo:
            </p>

            <div className="grid md:grid-cols-2 gap-3">
              {[
                { cat: "necessidades", color: "orange", vec: "[9, 2, 1, 2, 1]", desc: "Alta urgência vital, baixa abstração" },
                { cat: "sentimentos", color: "purple", vec: "[2, 9, 1, 3, 2]", desc: "Alta valência emocional, interna" },
                { cat: "lugares", color: "green", vec: "[3, 1, 9, 2, 1]", desc: "Alta concretude espacial" },
                { cat: "pessoas", color: "blue", vec: "[4, 5, 3, 9, 3]", desc: "Alta relacionalidade social" },
                { cat: "ações", color: "red", vec: "[5, 3, 2, 4, 9]", desc: "Alta agentividade motora" },
              ].map(({ cat, color, vec, desc }) => (
                <div key={cat} className="flex items-start gap-3 p-3 rounded-lg bg-card/50 border border-border/50">
                  <div className={`flex-shrink-0 h-3 w-3 rounded-full mt-1`}
                    style={{ backgroundColor: color === "orange" ? "#f97316" : color === "purple" ? "#a855f7" : color === "green" ? "#22c55e" : color === "blue" ? "#3b82f6" : "#ef4444" }}
                  />
                  <div>
                    <span className="font-mono text-sm text-foreground capitalize">{cat}</span>
                    <code className="block text-xs text-primary mt-0.5">{vec}</code>
                    <span className="text-xs text-muted-foreground">{desc}</span>
                  </div>
                </div>
              ))}
            </div>

            <p>
              Esse vetor alimenta um algoritmo de <strong className="text-foreground">homologia persistente</strong>:
              constrói-se um simplicial complex a partir dos pontos, filtra-se por distância, e registra-se
              cada evento topológico. O resultado é um diagrama de persistência único para cada categoria —
              uma <em>impressão digital topológica do significado</em>, sem nenhum texto, sem nenhum token.
            </p>
          </motion.div>
        </motion.section>

        <div className="w-full h-px bg-border/50" />

        {/* Section 4 */}
        <motion.section
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.15 }}
        >
          <motion.div variants={fadeUp}>
            <SectionHeader
              number="04"
              title="Distância de Wasserstein como Métrica Semântica"
              subtitle="Por que o transporte ótimo supera o cosseno para comparar significados"
            />
          </motion.div>

          <motion.div variants={fadeUp} className="space-y-5 text-muted-foreground leading-relaxed">
            <p>
              LLMs usam <strong className="text-foreground">similaridade por cosseno</strong> para comparar vetores de embedding:
              o ângulo entre dois vetores no espaço de alta dimensão. É eficiente, mas tem limitações sérias —
              não respeita a estrutura topológica do espaço e é sensível à dimensionalidade e ao ruído.
            </p>

            <div className="grid md:grid-cols-2 gap-6 my-6">
              <Card className="bg-red-950/20 border-red-500/30">
                <CardHeader className="pb-2">
                  <CardTitle className="font-mono text-sm text-red-400 flex items-center gap-2">
                    <XCircle className="h-4 w-4" /> Similaridade por Cosseno
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground space-y-2">
                  <p>Mede o ângulo entre vetores — ignora a <em>forma</em> da distribuição de pontos.</p>
                  <p>Dois conceitos com distribuições topológicas muito diferentes podem ter cosseno alto por acidente.</p>
                  <p>Não é uma métrica matemática rigorosa no espaço de diagramas de persistência.</p>
                </CardContent>
              </Card>
              <Card className="bg-emerald-950/20 border-emerald-500/30">
                <CardHeader className="pb-2">
                  <CardTitle className="font-mono text-sm text-emerald-400 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" /> Distância de Wasserstein
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground space-y-2">
                  <p>Mede o <em>custo mínimo de transporte</em> para transformar um diagrama no outro.</p>
                  <p>Respeita a estrutura topológica — dois diagramas similares estão genuinamente próximos.</p>
                  <p>É uma métrica matemática completa: satisfaz identidade, simetria e desigualdade triangular.</p>
                </CardContent>
              </Card>
            </div>

            <p>
              No Atlas, para cada par de pictogramas <code className="bg-muted px-1 rounded text-xs">(A, B)</code>,
              calcula-se a Wasserstein distance entre seus diagramas de persistência.
              A matriz de distâncias resultante é então projetada em 2D via
              <strong className="text-foreground"> MDS clássico</strong> (Multidimensional Scaling por iteração de potência),
              preservando as distâncias topológicas no mapa visual. O que você vê no Atlas
              <em> é</em> a geometria do significado, sem nenhuma abstração intermediária.
            </p>

            <div className="border-l-4 border-primary/50 pl-4 italic text-foreground/80">
              "A Distância de Wasserstein não pergunta 'quão parecidos são os vetores?'
              Ela pergunta: 'quanto trabalho é necessário para transformar uma estrutura na outra?' —
              e essa é exatamente a pergunta certa para medir distância semântica."
              <span className="block text-xs text-muted-foreground mt-1 not-italic">— Teoria IAP, Algoritmo JP</span>
            </div>
          </motion.div>
        </motion.section>

        <div className="w-full h-px bg-border/50" />

        {/* Section 5 */}
        <motion.section
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.15 }}
        >
          <motion.div variants={fadeUp}>
            <SectionHeader
              number="05"
              title="A Afasia como Caso de Teste da Hipótese"
              subtitle="Por que pacientes afásicos validam a existência de espaços pré-linguísticos topológicos"
            />
          </motion.div>

          <motion.div variants={fadeUp} className="space-y-5 text-muted-foreground leading-relaxed">
            <p>
              A <strong className="text-foreground">afasia</strong> é uma síndrome neurológica adquirida — causada por AVC,
              trauma ou tumor — que compromete a capacidade de produzir e/ou compreender linguagem.
              Dependendo da área lesada (Broca, Wernicke, córtex pré-frontal), o paciente perde acesso
              parcial ou total ao código linguístico: palavras, gramática, sintaxe.
            </p>

            <p>
              E ainda assim, pacientes afásicos frequentemente <strong className="text-foreground">continuam reconhecendo</strong>:
            </p>

            <div className="grid md:grid-cols-2 gap-3 my-4">
              {[
                "Rostos de familiares e sua carga emocional",
                "Objetos comuns e sua função",
                "Situações de perigo ou urgência",
                "Categorias semânticas amplas (comida, dor, lugar)",
                "Intenções e estados emocionais alheios",
                "Sequências de ações familiares (rotinas)",
              ].map((item) => (
                <div key={item} className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>{item}</span>
                </div>
              ))}
            </div>

            <p>
              Isso demonstra que existe um <strong className="text-foreground">nível pré-linguístico de representação</strong>
              — funcionalmente intacto mesmo quando o código linguístico está destruído.
              O Algoritmo JP propõe que esse nível é um <em>espaço topológico</em>:
              estruturado, mensurável, navegável — mas <em>anterior</em> a qualquer símbolo ou token.
            </p>

            <Card className="bg-primary/5 border-primary/30 mt-6">
              <CardContent className="pt-6 pb-4">
                <p className="text-sm font-mono text-primary mb-3 font-semibold">A consequência para IA</p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Se esse espaço pré-linguístico existe e é topológico, então é possível construir um sistema
                  de representação e raciocínio que opere <em>nesse</em> espaço — sem tokens, sem probabilidades,
                  sem corpus de texto. O Atlas Topológico da Afasia é a primeira materialização computacional
                  dessa hipótese: 60+ conceitos organizados por geometria pura, acessíveis por proximidade topológica,
                  representados por pictogramas que qualquer mente — com ou sem linguagem — pode reconhecer.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </motion.section>

        <div className="w-full h-px bg-border/50" />

        {/* Footer / CTA */}
        <motion.section
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
        >
          <motion.div variants={fadeUp} className="text-center space-y-6 pb-8">
            <div className="flex items-center justify-center gap-3">
              <AlertCircle className="h-5 w-5 text-primary" />
              <h3 className="font-mono font-semibold text-foreground">Explore os módulos do projeto</h3>
            </div>

            <div className="flex flex-wrap gap-3 justify-center">
              <Link href="/atlas">
                <Button className="gap-2">
                  <MapPin className="h-4 w-4" />
                  Atlas Topológico da Afasia
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/algorithm">
                <Button variant="outline" className="gap-2">
                  <BrainCircuit className="h-4 w-4" />
                  Algoritmo JP
                </Button>
              </Link>
              <Link href="/afasia">
                <Button variant="outline" className="gap-2">
                  <Accessibility className="h-4 w-4" />
                  Comunicador AAC
                </Button>
              </Link>
              <Link href="/topology">
                <Button variant="outline" className="gap-2">
                  <Network className="h-4 w-4" />
                  Análise Topológica
                </Button>
              </Link>
            </div>

            <p className="text-xs text-muted-foreground max-w-xl mx-auto">
              Projeto desenvolvido por <strong className="text-foreground">João Pedro Pereira Passos</strong> (UFT, 2026)
              para o Hackathon Gemma 4 Good — Kaggle / Google DeepMind.
              Teoria IAP e Algoritmo JP são contribuições originais do autor.
            </p>

            <Link href="/">
              <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
                <ArrowLeft className="h-4 w-4" />
                Voltar ao início
              </Button>
            </Link>
          </motion.div>
        </motion.section>

      </div>
    </div>
  );
}
