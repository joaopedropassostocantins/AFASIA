import React from "react";
import { Link, useLocation } from "wouter";
import { BrainCircuit, Activity, Accessibility, Network, MapPin, BookOpen, HelpCircle } from "lucide-react";
import { motion } from "framer-motion";

export function Navbar() {
  const [location] = useLocation();

  const links = [
    { href: "/algorithm", label: "Algoritmo JP", icon: BrainCircuit },
    { href: "/afasia", label: "Comunicador AAC", icon: Accessibility },
    { href: "/topology", label: "Topologia", icon: Network },
    { href: "/atlas", label: "Atlas", icon: MapPin },
    { href: "/appendice", label: "Apêndice", icon: BookOpen },
    { href: "/faq", label: "FAQ", icon: HelpCircle },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center max-w-screen-2xl mx-auto px-4 md:px-8">
        <Link href="/" className="flex items-center gap-2 mr-6 text-foreground hover:text-primary transition-colors">
          <Activity className="h-6 w-6 text-primary" />
          <span className="font-bold font-mono tracking-tight text-lg">IAP</span>
        </Link>
        <nav className="flex flex-1 items-center gap-6 text-sm font-medium">
          {links.map((link) => {
            const isActive = location === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-2 transition-colors hover:text-primary relative py-2 ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <link.icon className="h-4 w-4" />
                <span className="hidden sm:inline-block">{link.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="navbar-active"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  />
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
