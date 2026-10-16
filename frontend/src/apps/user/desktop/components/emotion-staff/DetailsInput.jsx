import React, { memo, useState, useCallback } from "react";
import { MessageSquare, CheckCircle2 } from "lucide-react";
import InputSanitizer from "./components/InputSanitizer";
import ProgressIndicator from "./components/ProgressIndicator";

const Header = memo(({ isFocused }) => (
    <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-primary" />
                <h2 className="text-lg md:text-xl font-semibold text-foreground tracking-tight">
                    Share Your Thoughts
                </h2>
            </div>
            <p className="text-xs md:text-sm text-muted-foreground">
                Tell us more about what you're experiencing (optional)
            </p>
        </div>
        <div className={`flex-shrink-0 transition-all duration-300 ${isFocused ? 'opacity-100' : 'opacity-0'}`}>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald/10 border border-emerald/20">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald animate-pulse" />
                <span className="text-xs font-medium text-emerald">Active</span>
            </div>
        </div>
    </div>
));

const TextAreaContainer = memo(({ details, onDetailsChange, charCount, maxChars, isEmpty, isNearLimit }) => (
    <div className="relative">
        <InputSanitizer
            value={details}
            onChange={onDetailsChange}
            placeholder="What's on your mind today? Share your feelings, thoughts, or what's affecting you..."
            rows={4}
            maxLength={maxChars}
        />
        {!isEmpty && (
            <div className={`absolute bottom-3 right-3 md:bottom-4 md:right-4 px-2.5 py-1 rounded-full backdrop-blur-md border transition-all duration-300 ${isNearLimit ? 'bg-primary/10 border-primary/20 text-primary' : 'bg-card/80 border-border/50 text-muted-foreground'}`}>
                <span className="text-xs font-medium tabular-nums">
                    {charCount}/{maxChars}
                </span>
            </div>
        )}
    </div>
));

const WordCount = memo(({ details, isEmpty }) => (
    !isEmpty && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="font-medium tabular-nums">
                {details.split(/\s+/).filter(w => w.length > 0).length} words
            </span>
        </div>
    )
));

const PrivacyBadge = memo(() => (
    <div className="flex items-center justify-center gap-2 pt-2">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald" />
        <p className="text-xs text-muted-foreground">
            Your responses are confidential and handled with care
        </p>
    </div>
));

const DetailsInput = memo(({ details, onDetailsChange }) => {
    const [isFocused, setIsFocused] = useState(false);
    const [charCount, setCharCount] = useState(details.length);

    const maxChars = 500;

    const handleChange = useCallback((value) => {
        setCharCount(value.length);
        onDetailsChange(value);
    }, [onDetailsChange]);

    const handleFocus = useCallback(() => setIsFocused(true), []);
    const handleBlur = useCallback(() => setIsFocused(false), []);

    const isEmpty = charCount === 0;
    const isNearLimit = charCount >= maxChars * 0.9;

    return (
        <div className="glass glass-card hover-lift transition-all duration-300">
            <div className="glass__refract" />
            <div className="glass__refract--soft" />
            <div className="glass__noise" />
            <div className="relative z-10 p-5 md:p-6 space-y-4">
                <Header isFocused={isFocused} />
                <TextAreaContainer
                    details={details}
                    onDetailsChange={handleChange}
                    charCount={charCount}
                    maxChars={maxChars}
                    isEmpty={isEmpty}
                    isNearLimit={isNearLimit}
                />
                <ProgressIndicator
                    charCount={charCount}
                    maxChars={maxChars}
                    isFocused={isFocused}
                />
                <WordCount details={details} isEmpty={isEmpty} />
                <PrivacyBadge />
            </div>
        </div>
    );
});

DetailsInput.displayName = 'DetailsInput';
export default DetailsInput;