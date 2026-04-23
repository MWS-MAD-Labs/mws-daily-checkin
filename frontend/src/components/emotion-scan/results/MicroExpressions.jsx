import React, { memo } from "react";
import { motion } from "framer-motion";
import { Eye, Zap } from "lucide-react";

const MicroExpressions = memo(({ expressions }) => (
    <div>
        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-2">
            <Eye className="w-3 h-3" />
            Micro-Expressions
        </h4>
        <div className="space-y-1.5">
            {expressions.map((expr, i) => (
                <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-start gap-2 text-xs"
                >
                    <Zap className="w-3 h-3 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-foreground">{expr}</span>
                </motion.div>
            ))}
        </div>
    </div>
));

MicroExpressions.displayName = 'MicroExpressions';
export default MicroExpressions;