import React from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import {
  HelpCircle, BrainCircuit, Accessibility, Network, MapPin, BookOpen, ArrowRight,
} from "lucide-react";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

interface FAQBlock {
  id: string;
  label: string;
  color: string;
  borderColor: string;
  icon: React.ReactNode;
  href: string;
  hrefLabel: string;
  items: { q: string; a: React.ReactNode }[];
}

const blocks: FAQBlock[] = [
  {
    id: "algoritmo",
    label: "O Algoritmo JP",
    color: "text-primary",
    borderColor: "border-primary/30",
    icon: <BrainCircuit className="h-5 w-5" />,
    href: "/algorithm",
    hrefLabel: "Ver Algoritmo JP",
    items: [
      {
        q: "O que é o Algoritmo JP?",
        a: (
          <span>
            O <strong>Algoritmo JP</strong> é um sistema de planejamento cognitivo criado por
            João Pedro Pereira Passos (UFT, 2026) que opera por{" "}
            <strong>"planejamento regressivo através de estados topológicos"</strong>. Em vez de
            prever o próximo token como as IAs tradicionais, ele funciona como um{" "}
            <strong>GPS cognitivo</strong>: mapeia a distância entre um ponto de partida (Estado
            Atual) e um destino (Estado Objetivo) em um espaço geométrico, e calcula a rota
            mais eficiente entre eles. No módulo interativo, é possível ver isso na prática —
            por exemplo, planejando um caminho de "Ideia" até "Lançamento de Negócio" em
            apenas 4 passos precisos.
          </span>
        ),
      },
      {
        q: "Como o Algoritmo JP planeja estados topológicos?",
        a: (
          <span>
            O planejamento segue três etapas:{" "}
            <strong>(1) Definição de estados</strong> — o usuário fornece um Estado Atual e um
            Estado Objetivo, modelados pelos parâmetros Sintaxe, Lógica e Arquitetura, que são
            visualizados como <strong>Diagramas de Persistência</strong>.{" "}
            <strong>(2) Cálculo da distância</strong> — a diferença entre os dois estados é
            medida pela <strong>Distância de Wasserstein</strong>: quanto maior o valor, mais
            passos intermediários serão necessários.{" "}
            <strong>(3) Busca de estruturas intermediárias</strong> — o algoritmo usa essa
            distância como heurística para encontrar os melhores estados de conhecimento que
            conectam origem e destino, construindo um{" "}
            <strong>Grafo de Dependências</strong> com o menor custo possível.
          </span>
        ),
      },
      {
        q: "O que é o Grafo de Dependências?",
        a: (
          <span>
            O <strong>Grafo de Dependências</strong> é a estrutura de dados gerada pelo
            Algoritmo JP para representar o caminho entre dois estados de conhecimento. Cada nó
            do grafo é um estado intermediário; cada aresta tem um{" "}
            <strong>custo geométrico</strong> (derivado da Distância de Wasserstein). O
            algoritmo percorre esse grafo de trás para frente (regressivamente) para garantir
            que cada passo seja necessário e suficiente para alcançar o objetivo. No módulo
            interativo, esse grafo é visualizado em tempo real conforme os parâmetros mudam.
          </span>
        ),
      },
    ],
  },
  {
    id: "topologia",
    label: "Diagramas de Persistência e Wasserstein",
    color: "text-violet-400",
    borderColor: "border-violet-400/30",
    icon: <Network className="h-5 w-5 text-violet-400" />,
    href: "/topology",
    hrefLabel: "Ver Análise Topológica",
    items: [
      {
        q: "O que são Diagramas de Persistência?",
        a: (
          <span>
            <strong>Diagramas de Persistência</strong> são gráficos bidimensionais que
            representam a <strong>"forma" de um estado de conhecimento</strong>. Cada ponto no
            diagrama corresponde a um evento topológico: quando uma{" "}
            <strong>componente conectada</strong> nasce e morre conforme o espaço é filtrado
            progressivamente. O eixo X registra o instante de nascimento; o eixo Y, o de morte.
            Pontos próximos da diagonal representam estruturas efêmeras; pontos distantes
            representam traços topológicos persistentes e significativos. O sistema gera um
            diagrama para o <strong>Estado Atual</strong> e outro para o{" "}
            <strong>Estado Objetivo</strong>, e a diferença entre eles é o que o Algoritmo JP
            precisa superar.
          </span>
        ),
      },
      {
        q: "Como Sintaxe, Lógica e Arquitetura afetam os diagramas?",
        a: (
          <span>
            Esses três parâmetros funcionam como os <strong>"ingredientes"</strong> que moldam
            a geometria do pensamento. Cada um é ajustado por uma barra deslizante (0–10) e
            determina as coordenadas exatas dos pontos plotados no diagrama de persistência.
            Por exemplo: quando Sintaxe, Lógica e Arquitetura estão todas em{" "}
            <strong>5</strong>, os pontos ficam agrupados na base do gráfico — indicando um
            estado de conhecimento estável e uniforme. Quando Sintaxe cai para{" "}
            <strong>3.7</strong> e Lógica sobe para <strong>10</strong>, os pontos se
            redistribuem criando uma estrutura espacial completamente diferente, com maior
            distância topológica em relação ao estado anterior.
          </span>
        ),
      },
      {
        q: "O que é a Distância de Wasserstein e por que é melhor que similaridade por cosseno?",
        a: (
          <span>
            A <strong>Distância de Wasserstein</strong> mede o{" "}
            <strong>custo mínimo de transporte</strong> para transformar um diagrama de
            persistência em outro — é matematicamente análoga a calcular quanto "trabalho" é
            necessário para mover uma pilha de areia de uma forma para outra. Diferente da
            similaridade por cosseno (usada por LLMs), que apenas mede o ângulo entre vetores
            sem respeitar a estrutura topológica do espaço, a Wasserstein é uma{" "}
            <strong>métrica matemática completa</strong>: satisfaz identidade, simetria e a
            desigualdade triangular. Ela captura diferenças na{" "}
            <strong>forma e na estrutura</strong> do significado, não apenas na direção dos
            vetores.
          </span>
        ),
      },
      {
        q: 'O que significa d = 0.09 entre dois pictogramas?',
        a: (
          <span>
            O valor <strong>d</strong> é a Distância de Wasserstein entre os diagramas de
            persistência de dois pictogramas. Um valor pequeno como{" "}
            <strong>d = 0.09</strong> (por exemplo, entre "Água" e "Dor") indica que os dois
            conceitos têm estruturas topológicas muito semelhantes — estão{" "}
            <strong>próximos no espaço pré-linguístico</strong> e possuem forte relação
            semântica. Um valor grande, como <strong>d = 2.179</strong>, indica diferenças
            estruturais significativas: o Algoritmo JP precisará de múltiplos passos
            intermediários para cobrir essa lacuna. Essa métrica é a heurística central que
            guia todo o planejamento de comunicação.
          </span>
        ),
      },
    ],
  },
  {
    id: "atlas",
    label: "O Atlas Topológico da Afasia",
    color: "text-emerald-400",
    borderColor: "border-emerald-400/30",
    icon: <MapPin className="h-5 w-5 text-emerald-400" />,
    href: "/atlas",
    hrefLabel: "Ver Atlas",
    items: [
      {
        q: "O que é o Atlas Topológico da Afasia?",
        a: (
          <span>
            O <strong>Atlas Topológico da Afasia</strong> é o primeiro mapa semântico de
            pictogramas calculado inteiramente por geometria topológica — sem tokens, sem
            redes neurais, sem corpus de texto. Ele organiza mais de 65 pictogramas da
            biblioteca <strong>ARASAAC</strong> num plano bidimensional, onde a posição de
            cada pictograma e a distância entre eles são determinadas exclusivamente por{" "}
            <strong>Distâncias de Wasserstein</strong> entre seus Diagramas de Persistência.
            O resultado é um mapa navegável do significado pré-linguístico, projetado para
            pessoas com afasia que pensam em conceitos antes de pensarem em palavras.
          </span>
        ),
      },
      {
        q: "Como são calculadas as Coordenadas Topológicas (Dimensão 1 e Dimensão 2)?",
        a: (
          <span>
            O processo tem três etapas:{" "}
            <strong>(1)</strong> Cada pictograma recebe um{" "}
            <strong>vetor de estado</strong> de 5 dimensões com base em sua categoria
            semântica (ex: necessidades = [9,2,1,2,1], sentimentos = [2,9,1,3,2]). Esse vetor
            alimenta um algoritmo de homologia persistente que gera o Diagrama de Persistência
            do conceito.{" "}
            <strong>(2)</strong> A Distância de Wasserstein é calculada para todos os pares de
            pictogramas, formando uma matriz de distâncias completa.{" "}
            <strong>(3)</strong> Essa matriz é projetada em 2D via{" "}
            <strong>MDS clássico</strong> (Escalonamento Multidimensional por iteração de
            potência), preservando as distâncias topológicas. As coordenadas resultantes
            — Dimensão 1 e Dimensão 2 — são a posição de cada pictograma no mapa.
          </span>
        ),
      },
      {
        q: "O que são 'vizinhos topológicos' e como são encontrados?",
        a: (
          <span>
            <strong>Vizinhos topológicos</strong> são os pictogramas mais próximos de um dado
            conceito no espaço de Wasserstein. Após calcular a matriz de distâncias completa,
            os 3 pictogramas com menor valor{" "}
            <strong>d</strong> em relação ao conceito selecionado são seus vizinhos. Por
            exemplo, ao clicar em "Água" no Atlas, o sistema exibe imediatamente seus vizinhos:{" "}
            <strong>"Dor"</strong> (d ≈ 0.09) e <strong>"Comida"</strong> — conceitos que
            compartilham estrutura topológica similar no espaço pré-linguístico. Ao clicar em
            "Dor de Dentes", os vizinhos sugeridos são <strong>"Comida"</strong> e{" "}
            <strong>"Ajuda"</strong> — uma rota lógica de comunicação para uma situação de
            urgência.
          </span>
        ),
      },
      {
        q: "O que é ARASAAC e por que foi utilizado?",
        a: (
          <span>
            <strong>ARASAAC</strong> (Portal Aragonês de Comunicação Aumentativa e Alternativa)
            é a maior biblioteca pública de pictogramas para comunicação alternativa do mundo,
            com mais de 30.000 símbolos licenciados em Creative Commons. Foi escolhido porque:{" "}
            <strong>(1)</strong> seus pictogramas são reconhecidos internacionalmente por
            profissionais de saúde e educação que trabalham com afasia;{" "}
            <strong>(2)</strong> a API pública permite busca em português, tornando o sistema
            nativo para pacientes brasileiros;{" "}
            <strong>(3)</strong> as imagens são claras, sem ambiguidade visual, ideais para
            pessoas com dificuldades de processamento linguístico.
          </span>
        ),
      },
    ],
  },
  {
    id: "afasia",
    label: "Aplicação Prática e Afasia",
    color: "text-orange-400",
    borderColor: "border-orange-400/30",
    icon: <Accessibility className="h-5 w-5 text-orange-400" />,
    href: "/afasia",
    hrefLabel: "Abrir Comunicador AAC",
    items: [
      {
        q: "Como o sistema ajuda pessoas com afasia no dia a dia?",
        a: (
          <span>
            O sistema oferece quatro formas de suporte concreto:{" "}
            <strong>(1) Comunicação por pictogramas</strong> — o paciente seleciona símbolos
            visuais e o Gemini traduz a sequência para linguagem natural em português,
            eliminando a necessidade de lembrar ou formular palavras.{" "}
            <strong>(2) Navegação por vizinhança</strong> — ao selecionar um conceito, o Atlas
            sugere os próximos conceitos topologicamente próximos, guiando o pensamento de
            forma intuitiva sem exigir linguagem interna.{" "}
            <strong>(3) Modo Emergência (SOS)</strong> — botões grandes de acesso rápido para
            situações críticas, com discagem direta para SAMU (192) e Bombeiros (193).{" "}
            <strong>(4) Síntese de voz</strong> — as mensagens construídas são lidas em voz
            alta, permitindo comunicação oral mesmo sem fala funcional.
          </span>
        ),
      },
      {
        q: "O que é Comunicação Aumentativa e Alternativa (AAC)?",
        a: (
          <span>
            <strong>Comunicação Aumentativa e Alternativa (AAC)</strong> é um campo da
            fonoaudiologia e tecnologia assistiva que reúne recursos, estratégias e técnicas
            para substituir ou complementar a fala natural em pessoas com limitações de
            comunicação oral. "Aumentativa" porque complementa a fala existente; "alternativa"
            porque oferece um canal completamente diferente quando a fala não é possível. O
            Comunicador AAC deste projeto aplica a teoria IAP a esse campo: usa a topologia
            (não a probabilidade de texto) para organizar e sugerir os símbolos mais relevantes
            para cada momento de comunicação.
          </span>
        ),
      },
      {
        q: "O que é o Modo Emergência (SOS)?",
        a: (
          <span>
            O <strong>Modo Emergência</strong> é uma interface especial acessível com um único
            toque, projetada para situações em que não há tempo para navegar pelo Atlas. Exibe{" "}
            <strong>botões grandes e de alto contraste</strong> para as necessidades mais
            críticas: "Ajuda", "Dor Forte", "Sim" e "Não". Inclui também atalhos para ligar
            diretamente para o <strong>SAMU (192)</strong> e os{" "}
            <strong>Bombeiros (193)</strong>. O design prioriza velocidade e acessibilidade
            visual: fontes grandes, cores de urgência (vermelho/laranja) e mínima demanda
            cognitiva para ativação.
          </span>
        ),
      },
      {
        q: "Por que a IAP opera sem tokens? O que são 'espaços pré-linguísticos'?",
        a: (
          <span>
            LLMs tradicionais exigem que todo input seja tokenizado — fragmentado em pedaços
            de texto antes de qualquer processamento. Isso cria uma dependência fundamental da{" "}
            <strong>linguagem escrita</strong> como ponto de entrada. Mas a cognição humana
            existe <strong>antes</strong> da linguagem: crianças reconhecem intenções e
            categorias antes de falar; animais resolvem problemas sem tokens; pessoas com
            afasia mantêm estruturas de significado intactas mesmo perdendo o acesso à fala.
            Esses são os <strong>"espaços pré-linguísticos"</strong> — estruturas cognitivas
            que existem independentemente do código verbal. A IAP opera{" "}
            <em>nesse</em> nível: usa pictogramas (não tokens), geometria (não probabilidade)
            e Wasserstein (não cosseno), tornando-se naturalmente acessível a mentes que
            processam significado sem palavras.
          </span>
        ),
      },
      {
        q: "Como o Algoritmo JP usa a distância como heurística de comunicação?",
        a: (
          <span>
            Quando um paciente seleciona um pictograma, o sistema calcula sua distância de
            Wasserstein para todos os outros conceitos do Atlas. Essa distância serve como{" "}
            <strong>heurística</strong> para o Algoritmo JP: conceitos com{" "}
            <strong>d pequeno</strong> são sugeridos como próximos passos naturais de
            comunicação (vizinhos topológicos). Se o destino comunicativo está distante
            (d grande), o algoritmo propõe uma <strong>sequência de pictogramas
            intermediários</strong> que formam uma ponte lógica entre o conceito atual e a
            intenção final — exatamente como um GPS propõe paradas intermediárias numa rota
            longa. Isso transforma o Atlas de um dicionário passivo num{" "}
            <strong>planejador ativo de comunicação</strong>.
          </span>
        ),
      },
    ],
  },
];

export default function FAQ() {
  return (
    <div className="flex-1 flex flex-col">
      <div className="container max-w-4xl mx-auto px-4 md:px-8 py-10 space-y-14">

        {/* Header */}
        <motion.div variants={stagger} initial="hidden" animate="show">
          <motion.div variants={fadeUp} className="flex items-center gap-3 mb-4">
            <div className="h-12 w-12 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center text-primary">
              <HelpCircle className="h-6 w-6" />
            </div>
            <div>
              <Badge variant="outline" className="mb-1 font-mono text-xs">Perguntas Frequentes</Badge>
              <h1 className="text-3xl md:text-4xl font-bold font-mono text-foreground">
                FAQ — IAP & Atlas da Afasia
              </h1>
            </div>
          </motion.div>
          <motion.p variants={fadeUp} className="text-muted-foreground text-lg leading-relaxed mt-2">
            Respostas claras sobre a teoria IAP, o Algoritmo JP, os Diagramas de Persistência,
            a Distância de Wasserstein e as aplicações práticas do Atlas para pessoas com afasia.
          </motion.p>
        </motion.div>

        {/* Blocks */}
        {blocks.map((block, bi) => (
          <motion.section
            key={block.id}
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.1 }}
          >
            <motion.div variants={fadeUp} className={`flex items-center gap-3 mb-5 pb-3 border-b ${block.borderColor}`}>
              <div className={`${block.color}`}>{block.icon}</div>
              <h2 className={`font-mono font-bold text-lg ${block.color}`}>{block.label}</h2>
              <div className="ml-auto">
                <Link href={block.href}>
                  <Button variant="ghost" size="sm" className="gap-2 text-xs text-muted-foreground">
                    {block.hrefLabel}
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                </Link>
              </div>
            </motion.div>

            <motion.div variants={fadeUp}>
              <Accordion type="single" collapsible className="w-full">
                {block.items.map((item, i) => (
                  <AccordionItem key={i} value={`${block.id}-${i}`} className="border-border/50">
                    <AccordionTrigger className="text-left text-sm font-medium text-foreground hover:text-primary hover:no-underline py-4">
                      {item.q}
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="text-sm text-muted-foreground leading-relaxed pb-2">
                        {item.a}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </motion.div>
          </motion.section>
        ))}

        {/* Footer */}
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
          className="border-t border-border/50 pt-10 pb-6"
        >
          <motion.div variants={fadeUp} className="text-center space-y-6">
            <p className="text-sm text-muted-foreground">
              Quer entender a base teórica completa? Leia o Apêndice Científico.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link href="/appendice">
                <Button className="gap-2">
                  <BookOpen className="h-4 w-4" />
                  Apêndice Científico
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/atlas">
                <Button variant="outline" className="gap-2">
                  <MapPin className="h-4 w-4" />
                  Atlas Topológico
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
            </div>
            <p className="text-xs text-muted-foreground">
              Projeto de <strong className="text-foreground">João Pedro Pereira Passos</strong> (UFT, 2026) —
              Hackathon Gemma 4 Good · Kaggle / Google DeepMind
            </p>
          </motion.div>
        </motion.div>

      </div>
    </div>
  );
}
