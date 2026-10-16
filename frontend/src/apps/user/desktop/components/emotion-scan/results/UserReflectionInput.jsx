import React, { memo, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { MessageSquare } from "lucide-react";

const UserReflectionInput = memo(({ onReflectionChange, onValidationChange }) => {
    const [reflection, setReflection] = useState("");

    const handleChange = useCallback((e) => {
        const value = e.target.value;
        // Security: sanitize input to prevent XSS and other attacks
        const sanitized = value
            .replace(/<[^>]*>?/gm, '') // Remove HTML tags
            .replace(/javascript:/gi, '') // Remove javascript: protocol
            .replace(/data:/gi, '') // Remove data: protocol
            .replace(/vbscript:/gi, '') // Remove vbscript: protocol
            .replace(/on\w+\s*=/gi, '') // Remove event handlers
            .slice(0, 500); // Limit length

        setReflection(sanitized);
        onReflectionChange?.(sanitized);
        onValidationChange?.(sanitized.trim().length > 0);
    }, [onReflectionChange, onValidationChange]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50 dark:from-purple-900/30 dark:via-pink-900/30 dark:to-rose-900/30 rounded-2xl p-4 sm:p-5 border-2 border-purple-200 dark:border-purple-700 shadow-lg"
        >
            <div className="flex items-center gap-2.5 mb-3">
                <div className="flex-shrink-0 w-10 h-10 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-purple-200 to-pink-200 dark:from-purple-700 dark:to-pink-700 border-2 border-purple-300 dark:border-purple-600 flex items-center justify-center shadow-md">
                    <MessageSquare className="w-5 h-5 sm:w-4.5 sm:h-4.5 text-purple-700 dark:text-purple-200" />
                </div>
                <div className="flex-1 min-w-0">
                    <h4 className="text-base sm:text-sm font-bold text-purple-800 dark:text-purple-200">
                        💭 Share Your Thoughts
                    </h4>
                    <p className="text-xs text-purple-600 dark:text-purple-400 leading-tight">
                        What triggered this feeling?
                    </p>
                </div>
            </div>
            <textarea
                value={reflection}
                onChange={handleChange}
                placeholder="e.g., 'Had a challenging meeting...' or 'Feeling grateful...'"
                className="w-full p-3 sm:p-3 rounded-xl bg-white dark:bg-gray-900/50 border-2 border-purple-300 dark:border-purple-600 text-sm text-foreground placeholder:text-purple-400/60 dark:placeholder:text-purple-500/60 focus:border-purple-500 dark:focus:border-purple-400 focus:ring-2 focus:ring-purple-300 dark:focus:ring-purple-700 outline-none resize-none transition-all duration-300 shadow-sm"
                rows={3}
                maxLength={500}
            />
            <div className="flex justify-between items-center mt-2.5">
                <p className="text-xs text-purple-600 dark:text-purple-400 font-medium">
                    💡 Helps personalize insights
                </p>
                <span className="text-xs text-purple-600 dark:text-purple-400 font-bold bg-purple-100 dark:bg-purple-900/50 px-2.5 py-0.5 rounded-full border border-purple-300 dark:border-purple-600">
                    {reflection.length}/500
                </span>
            </div>
        </motion.div>
    );
});

UserReflectionInput.displayName = 'UserReflectionInput';
export default UserReflectionInput;