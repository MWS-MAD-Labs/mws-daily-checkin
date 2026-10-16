import React, { memo, useState, useCallback } from "react";
import { AlertCircle } from "lucide-react";

// Advanced input sanitization - prevents XSS, malicious scripts, phishing
const sanitizeInput = (input) => {
    return input
        // Remove script tags
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        // Remove javascript: protocol
        .replace(/javascript:/gi, '')
        // Remove on* event handlers (but keep normal text with spaces)
        .replace(/\son\w+\s*=/gi, '')
        // Remove iframe/embed tags
        .replace(/<iframe/gi, '')
        .replace(/<embed/gi, '')
        // Remove data: URLs (can contain malicious content)
        .replace(/data:text\/html/gi, '');
};

const InputSanitizer = memo(({ value, onChange, maxLength = 500, placeholder, rows = 4 }) => {
    const [hasWarning, setHasWarning] = useState(false);

    const handleChange = useCallback((e) => {
        let inputValue = e.target.value;
        const originalLength = inputValue.length;

        // Sanitize input
        inputValue = sanitizeInput(inputValue);

        // Check if sanitization removed content (potential malicious input)
        if (originalLength > inputValue.length && originalLength - inputValue.length > 5) {
            setHasWarning(true);
            setTimeout(() => setHasWarning(false), 3000);
        }

        // Enforce max length
        if (inputValue.length <= maxLength) {
            onChange(inputValue);
        }
    }, [onChange, maxLength]);

    return (
        <div className="relative">
            <textarea
                value={value}
                onChange={handleChange}
                placeholder={placeholder}
                className="w-full px-4 py-3 md:px-5 md:py-4 bg-input/50 backdrop-blur-sm border-2 rounded-lg text-sm md:text-base text-foreground placeholder-muted-foreground focus:outline-none resize-none transition-all duration-300 ease-premium"
                rows={rows}
                maxLength={maxLength}
            />

            {/* Warning Alert */}
            {hasWarning && (
                <div className="absolute top-2 right-2 p-2 rounded-lg bg-primary/5 border border-primary/20 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 text-primary" />
                        <span className="text-xs text-primary">Content filtered</span>
                    </div>
                </div>
            )}
        </div>
    );
});

InputSanitizer.displayName = 'InputSanitizer';
export default InputSanitizer;