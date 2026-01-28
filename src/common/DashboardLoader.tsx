"use client"

import { motion } from "framer-motion"
const DOT_COLOR = "#CB8959"

export default function DashboardLoader({ label = "Loading..." }) {
  return (
      <div className="flex items-center justify-center">
      
      {/* Soft Glass Backdrop */}
      <div className="absolute inset-0 backdrop-blur-md bg-black/5 dark:bg-black/30" />

      {/* Glass Card */}
      <div className="relative px-10 py-8 rounded-3xl
        bg-[rgba(255,255,255,var(--ui-opacity-6))]
        shadow-xl
        flex flex-col items-center gap-4
      ">
        {/* Glow */}
        <div
          className="absolute -z-10 w-40 h-40 rounded-full blur-3xl opacity-40"
          style={{
            background: `radial-gradient(circle, ${DOT_COLOR}55, transparent 70%)`
          }}
        />

        {/* Dots */}
        <div className="flex items-center gap-2">
          {[0, 1, 2, 3, 4].map((i) => (
            <motion.span
              key={i}
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: DOT_COLOR }}
              animate={{
                scale: [0.5, 1, 0.5],
                opacity: [0.4, 1, 0.4]
              }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.2
              }}
            />
          ))}
        </div>

        {/* Text */}
        <motion.p
          className="text-sm tracking-wide text-[var(--text-muted)]"
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ repeat: Infinity, duration: 1.6 }}
        >
          {label}
        </motion.p>
      </div>
    </div>
  )
}
