import React, { memo } from "react";
import { motion } from "framer-motion";

export const DecorativeBlob = memo(({ className, delay = 0 }) => (
    <motion.div
        className={`absolute rounded-full blur-3xl pointer-events-none ${className}`}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{
            scale: [1, 1.12, 1],
            opacity: [0.08, 0.15, 0.08]
        }}
        transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut",
            delay
        }}
    />
));

DecorativeBlob.displayName = "DecorativeBlob";

export const GridPattern = memo(() => (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-[0.015]">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <pattern id="mws-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" />
                </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#mws-grid)" className="text-foreground" />
        </svg>
    </div>
));

GridPattern.displayName = "GridPattern";
