import React, { memo, useState } from "react";
import { AlertCircle, ChevronDown, ChevronUp } from "lucide-react";

const NotSubmittedList = memo(({ notSubmitted }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    if (!notSubmitted || notSubmitted.length === 0) return null;

    return (
        <div className="glass glass-card hover-lift transition-all duration-300">
            <div className="glass__refract" />
            <div className="glass__noise" />

            <div className="relative z-10 p-4 md:p-6">
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="w-full flex items-center justify-between mb-4"
                >
                    <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-primary" />
                        <h2 className="text-base md:text-lg font-semibold text-foreground">
                            Not Submitted Yet ({notSubmitted.length})
                        </h2>
                    </div>
                    {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-muted-foreground" />
                    ) : (
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    )}
                </button>

                {isExpanded && (
                    <div className="pb-4">
                        <div className="border-t border-border/30 pt-3">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                {notSubmitted.map((name, index) => (
                                    <div
                                        key={index}
                                        className="text-sm text-muted-foreground bg-card/20 px-3 py-2 rounded-lg border border-border/20"
                                    >
                                        {name}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
});

NotSubmittedList.displayName = 'NotSubmittedList';
export default NotSubmittedList;