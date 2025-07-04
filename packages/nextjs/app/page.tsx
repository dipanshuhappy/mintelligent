"use client";

import React from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AnimatePresence, motion } from "framer-motion";
import { Bot, BrainCircuit, Cpu, Sparkles } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden opacity-20">
        <div className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] bg-[url('/grid.svg')] animate-pulse"></div>
      </div>

      {/* Floating AI nodes */}
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-cyan-400/20"
          style={{
            width: Math.random() * 400 + 100,
            height: Math.random() * 400 + 100,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            filter: "blur(60px)",
          }}
          animate={{
            x: [0, Math.random() * 100 - 50, 0],
            y: [0, Math.random() * 100 - 50, 0],
          }}
          transition={{
            duration: Math.random() * 10 + 10,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "easeInOut",
          }}
        />
      ))}

      <div className="max-w-5xl mx-auto text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-12"
        >
          <div className="inline-flex items-center justify-center gap-4 mb-6">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
              className="p-2 rounded-full border-2 border-cyan-400/30"
            >
              <Cpu className="h-10 w-10 text-cyan-400" />
            </motion.div>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent mb-6">
            AI Agent Nexus
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 max-w-2xl mx-auto">
            Empower your digital experience with our next-generation AI agents
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-4 max-w-2xl mx-auto">
            {["Autonomous", "Intelligent", "Adaptive", "Efficient"].map((tag, i) => (
              <motion.span
                key={tag}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + i * 0.1 }}
                className="px-4 py-2 bg-cyan-500/10 text-cyan-300 rounded-full text-sm font-medium border border-cyan-400/20"
              >
                {tag}
              </motion.span>
            ))}
          </div>
        </motion.div>

        <div className="flex flex-col md:flex-row justify-center gap-8">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            className="w-full md:w-auto"
          >
            <Link href="/mint">
              <Button className="w-full md:w-72 h-20 text-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-xl shadow-2xl shadow-cyan-500/20 transition-all duration-300 flex items-center justify-center gap-3 px-8 border border-cyan-400/30 group">
                <BrainCircuit className="h-6 w-6 group-hover:scale-110 transition-transform" />
                Deploy Agent
              </Button>
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            className="w-full md:w-auto"
          >
            <Link href="/me">
              <Button
                variant="outline"
                className="w-full md:w-72 h-20 text-xl border-2 border-cyan-400/50 text-cyan-300 hover:bg-cyan-500/10 hover:border-cyan-300 hover:text-white bg-gray-900/50 backdrop-blur-sm rounded-xl shadow-xl shadow-cyan-500/10 transition-all duration-300 flex items-center justify-center gap-3 px-8 group"
              >
                <Bot className="h-6 w-6 group-hover:scale-110 transition-transform" />
                My Agents
              </Button>
            </Link>
          </motion.div>
        </div>

        <motion.div
          className="mt-16 text-gray-400 text-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          <div className="inline-flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-cyan-400" />
            <span>Powered by advanced neural networks</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
