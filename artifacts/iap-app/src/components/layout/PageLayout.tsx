import React from "react";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";

export function PageLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="relative min-h-screen flex flex-col bg-background font-sans selection:bg-primary selection:text-primary-foreground text-foreground">
      <Navbar />
      <AnimatePresence mode="wait">
        <motion.main
          key={location}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className="flex-1 flex flex-col w-full max-w-screen-2xl mx-auto"
        >
          {children}
        </motion.main>
      </AnimatePresence>
      <Footer />
    </div>
  );
}
