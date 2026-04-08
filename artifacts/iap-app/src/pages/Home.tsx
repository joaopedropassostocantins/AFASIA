import React from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { BrainCircuit, Accessibility, Network, ArrowRight, MapPin, BookOpen, HelpCircle, MessageSquare } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Home() {
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12 overflow-hidden relative">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-[120px] pointer-events-none -z-10" />

      <motion.div
        className="max-w-5xl text-center space-y-8"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        <motion.div variants={itemVariants} className="space-y-4">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-foreground font-mono">
            Inteligência Artificial <span className="text-primary">Pictórica</span>
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto font-light leading-relaxed">
            Raciocínio por espaços geométricos, unindo estrutura topológica e comunicação acessível.
          </p>
        </motion.div>

        <motion.div variants={itemVariants} className="pt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 text-left">

          <Card className="bg-card/50 backdrop-blur border-primary/20 hover:border-primary/50 transition-all flex flex-col">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 text-primary">
                <BrainCircuit size={24} />
              </div>
              <CardTitle className="font-mono">Algoritmo JP</CardTitle>
              <CardDescription>Planejamento regressivo por estados topológicos</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-end">
              <p className="text-sm text-muted-foreground mb-6">
                Demo interativo do Algoritmo JP: estabelece dependências e encontra caminhos ótimos.
              </p>
              <Link href="/algorithm" className="w-full">
                <Button variant="outline" className="w-full group">
                  Explorar Módulo 1
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur border-primary/20 hover:border-primary/50 transition-all flex flex-col">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 text-primary">
                <Accessibility size={24} />
              </div>
              <CardTitle className="font-mono">Comunicador AAC</CardTitle>
              <CardDescription>Interface acessível para afasia em português via Gemini</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-end">
              <p className="text-sm text-muted-foreground mb-6">
                Construa mensagens com símbolos pictóricos traduzidos para linguagem natural em português.
              </p>
              <Link href="/afasia" className="w-full">
                <Button variant="outline" className="w-full group">
                  Explorar Módulo 2
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur border-violet-400/30 hover:border-violet-400/60 transition-all flex flex-col">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-violet-500/10 flex items-center justify-center mb-4 text-violet-500">
                <MessageSquare size={24} />
              </div>
              <CardTitle className="font-mono">Disfasia</CardTitle>
              <CardDescription>Comunicador AAC adaptado para disfasia via Gemini</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-end">
              <p className="text-sm text-muted-foreground mb-6">
                Fluência, sequência e organização da fala: pictogramas específicos para o perfil disfásico.
              </p>
              <Link href="/disfasia" className="w-full">
                <Button variant="outline" className="w-full group border-violet-400/40 hover:border-violet-400">
                  Abrir Módulo Disfasia
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur border-primary/20 hover:border-primary/50 transition-all flex flex-col">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 text-primary">
                <Network size={24} />
              </div>
              <CardTitle className="font-mono">Análise Topológica</CardTitle>
              <CardDescription>Cálculo da distância de Wasserstein</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-end">
              <p className="text-sm text-muted-foreground mb-6">
                Visualize a distância entre estados de conhecimento via diagramas de persistência.
              </p>
              <Link href="/topology" className="w-full">
                <Button variant="outline" className="w-full group">
                  Explorar Módulo 3
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur border-primary/20 hover:border-primary/50 transition-all flex flex-col">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 text-primary">
                <MapPin size={24} />
              </div>
              <CardTitle className="font-mono">Atlas Topológico</CardTitle>
              <CardDescription>Mapa semântico da afasia via ARASAAC</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-end">
              <p className="text-sm text-muted-foreground mb-6">
                Primeiro Atlas Topológico da Afasia com pictogramas reais ARASAAC e distâncias de Wasserstein.
              </p>
              <Link href="/atlas" className="w-full">
                <Button variant="outline" className="w-full group">
                  Explorar Módulo 4
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur border-primary/20 hover:border-primary/50 transition-all flex flex-col">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 text-primary">
                <BookOpen size={24} />
              </div>
              <CardTitle className="font-mono">Apêndice Científico</CardTitle>
              <CardDescription>IAP como IA sem tokens e não-probabilística</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-end">
              <p className="text-sm text-muted-foreground mb-6">
                Fundamento teórico: por que topologia supera tokens e por que afasia valida a hipótese.
              </p>
              <Link href="/appendice" className="w-full">
                <Button variant="outline" className="w-full group">
                  Ler Apêndice
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur border-primary/20 hover:border-primary/50 transition-all flex flex-col">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 text-primary">
                <HelpCircle size={24} />
              </div>
              <CardTitle className="font-mono">FAQ</CardTitle>
              <CardDescription>Perguntas frequentes sobre IAP e o Atlas da Afasia</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-end">
              <p className="text-sm text-muted-foreground mb-6">
                Respostas sobre Algoritmo JP, Wasserstein, Diagramas de Persistência e afasia.
              </p>
              <Link href="/faq" className="w-full">
                <Button variant="outline" className="w-full group">
                  Ver FAQ
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            </CardContent>
          </Card>

        </motion.div>
      </motion.div>
    </div>
  );
}
