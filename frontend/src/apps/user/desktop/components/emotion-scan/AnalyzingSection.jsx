import React, { memo } from "react";
import { motion } from "framer-motion";
import { Brain } from "lucide-react";

const AnalyzingSection = memo(() => (
    <motion.div
        key="analyzing"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="text-center space-y-6 py-8"
    >
        <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 mx-auto"
        >
            <Brain className="w-full h-full text-primary" />
        </motion.div>

        <div className="space-y-2">
            <h2 className="text-lg font-bold text-foreground">
                Analyzing Emotions
            </h2>
            <p className="text-sm text-muted-foreground">
                Cross-referencing with emotion database
            </p>
        </div>
    </motion.div>
));

AnalyzingSection.displayName = 'AnalyzingSection';
export default AnalyzingSection;