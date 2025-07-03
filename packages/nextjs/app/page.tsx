"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Plus, User } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br flex items-center justify-center p-6">
      <div className="max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-12"
        >
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
            Mint Intelligence
          </h1>
          <p className="text-xl text-gray-300">Create and manage your unique NFT collection</p>
        </motion.div>

        <div className="flex flex-col md:flex-row justify-center gap-8">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-full md:w-auto"
          >
            <Link href="/mint">
              <Button className="w-full md:w-80 h-24 text-2xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-2xl shadow-2xl shadow-purple-500/25 transition-all duration-300 flex items-center justify-center gap-4 px-12 border border-purple-500/20">
                <Plus className="h-8 w-8" />
                Mint New NFT
              </Button>
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-full md:w-auto"
          >
            <Link href="/me">
              <Button
                variant="outline"
                className="w-full md:w-80 h-24 text-2xl border-4 border-purple-500 text-purple-400 hover:bg-purple-500/10 hover:border-purple-400 hover:text-purple-300 bg-gray-800/50 rounded-2xl shadow-2xl shadow-purple-500/25 transition-all duration-300 flex items-center justify-center gap-4 px-12"
              >
                <User className="h-8 w-8" />
                My Collection
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
