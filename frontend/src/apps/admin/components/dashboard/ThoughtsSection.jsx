import React, { memo, useState } from "react";
import { MessageSquare, ChevronDown, ChevronUp, User } from "lucide-react";

const ThoughtsSection = memo(({ thoughts }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    if (!thoughts || thoughts.length === 0) return null;

    return (
        <div className="glass glass-card transition-colors duration-200" data-aos="fade-up" data-aos-delay="160">
            <div className="glass__refract" />
            <div className="glass__noise" />

            <div className="relative z-10 p-4 md:p-6">
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="w-full flex items-center justify-between mb-4"
                >
                    <div className="flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-primary" />
                        <h2 className="text-base md:text-lg font-semibold text-foreground">
                            Share Your Thoughts ({thoughts.length})
                        </h2>
                    </div>
                    {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-muted-foreground" />
                    ) : (
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    )}
                </button>

                <p className="text-sm text-muted-foreground mb-4">
                    Tell us more about what you're experiencing (optional)
                </p>

                {isExpanded && (
                    <div className="space-y-3">
                        {thoughts.map((thought, index) => (
                            <div
                                key={index}
                                className="glass glass-card transition-colors duration-200"
                                data-aos="fade-up"
                                data-aos-delay={180 + index * 30}
                            >
                                <div className="glass__refract" />
                                <div className="glass__noise" />

                                <div className="relative z-10 p-3 md:p-4">
                                    <div className="flex items-start gap-3">
                                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                                            <User className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="font-semibold text-foreground text-sm md:text-base">
                                                    {thought.author}
                                                </span>
                                                <span className="text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-full">
                                                    {thought.timestamp}
                                                </span>
                                            </div>
                                            <p className="text-sm text-muted-foreground leading-relaxed">
                                                {thought.content}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
});

ThoughtsSection.displayName = 'ThoughtsSection';
export default ThoughtsSection;
