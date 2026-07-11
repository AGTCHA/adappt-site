"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
  delay?: number;
}

export function Card({ children, className = "", hover, onClick, delay = 0 }: CardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 26, delay }}
      whileHover={hover ? { y: -3, transition: { type: "spring", stiffness: 400, damping: 25 } } : undefined}
      onClick={onClick}
      className={`glass rounded-2xl ${hover ? "cursor-pointer transition-shadow hover:shadow-raised" : ""} ${className}`}
    >
      {children}
    </motion.div>
  );
}
