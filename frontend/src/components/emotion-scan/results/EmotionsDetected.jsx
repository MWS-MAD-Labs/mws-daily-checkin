import React, { memo } from "react";
import { motion } from "framer-motion";
import { Heart } from "lucide-react";

const EmotionsDetected = memo(({ emotions }) => (
    <div>
        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-2">
            <Heart className="w-3 h-3" />
            Emotions Detected
        </h4>
        <div className="flex flex-wrap gap-1.5">
            {emotions.map((emotion, i) => (
                <motion.span
                    key={i}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className="px-2 py-1 rounded-md bg-primary/5 text-xs font-medium text-foreground border border-primary/20"
                >
                    {emotion}
                </motion.span>
            ))}
        </div>
    </div>
));

EmotionsDetected.displayName = 'EmotionsDetected';
export default EmotionsDetected;