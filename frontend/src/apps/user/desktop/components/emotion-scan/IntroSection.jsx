import React, { memo } from "react";
import { motion } from "framer-motion";
import { Camera, Brain, Eye, Shield } from "lucide-react";

const IntroSection = memo(({ onStartScan }) => (
    <motion.div
        key="intro"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="text-center space-y-6"
    >
        <motion.div
            className="w-16 h-16 mx-auto rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 3, repeat: Infinity }}
        >
            <Brain className="w-8 h-8 text-primary-foreground" />
        </motion.div>

        <div className="space-y-2">
            <h1 className="text-2xl font-bold text-foreground">
                AI Emotional Analysis
            </h1>
            <p className="text-sm text-muted-foreground">
                Advanced AI psychology analysis with 99% accuracy detection
            </p>
        </div>

        <motion.button
            onClick={onStartScan}
            className="w-full py-4 rounded-xl bg-primary text-primary-foreground font-semibold shadow-lg shadow-primary/25 hover:shadow-primary/35 transition-all duration-300"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            aria-label="Start AI emotional analysis scan"
        >
            <div className="flex items-center justify-center gap-2">
                <Camera className="w-5 h-5" aria-hidden="true" />
                Start AI Scan
            </div>
        </motion.button>

        <p className="text-xs text-muted-foreground flex items-center justify-center gap-1.5">
            <Shield className="w-3 h-3" />
            Processed locally • No data stored
        </p>
    </motion.div>
));

IntroSection.displayName = 'IntroSection';
export default IntroSection;