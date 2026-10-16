import React, { memo, useState } from "react";
import { ChevronDown, ChevronUp, Users } from "lucide-react";
import MoodIcon from "./MoodIcon";

const MoodBreakdown = memo(({ moodLists, moodDistribution }) => {
    // Transform API mood distribution to component format
    // moodLists now contains user names directly from backend
    const transformedMoodLists = moodLists || {};
    const [expandedMood, setExpandedMood] = useState(null);

    // Base mood categories
    const baseMoodCategories = [
        { key: "happy", label: "Happy", color: "gold", icon: "😊" },
        { key: "excited", label: "Excited", color: "gold", icon: "⚡" },
        { key: "calm", label: "Calm", color: "emerald", icon: "🧘" },
        { key: "hopeful", label: "Hopeful", color: "emerald", icon: "🌈" },
        { key: "sad", label: "Sad", color: "primary", icon: "😢" },
        { key: "anxious", label: "Anxious", color: "primary", icon: "😰" },
        { key: "angry", label: "Angry", color: "primary", icon: "😠" },
        { key: "fear", label: "Fear", color: "primary", icon: "😨" },
        { key: "overwhelmed", label: "Overwhelmed", color: "primary", icon: "😵" },
        { key: "tired", label: "Tired", color: "muted", icon: "😴" },
        { key: "hungry", label: "Hungry", color: "muted", icon: "🍽️" },
        { key: "lonely", label: "Lonely", color: "muted", icon: "🤝" },
        { key: "bored", label: "Bored", color: "muted", icon: "😑" },
        { key: "scattered", label: "Scattered", color: "muted", icon: "💭" }
    ];

    // Add AI-generated moods if they exist in the data
    const aiMoodCategories = [];
    Object.keys(moodDistribution).forEach(moodKey => {
        if (!baseMoodCategories.find(m => m.key === moodKey)) {
            // This is an AI-generated mood
            aiMoodCategories.push({
                key: moodKey,
                label: moodKey.charAt(0).toUpperCase() + moodKey.slice(1),
                color: "primary",
                icon: "🤖",
                isAIGenerated: true
            });
        }
    });

    const moodCategories = [...baseMoodCategories, ...aiMoodCategories];

    const toggleMood = (moodKey) => {
        setExpandedMood(expandedMood === moodKey ? null : moodKey);
    };

    return (
        <div className="glass glass-card transition-all duration-300">
            <div className="glass__refract" />
            <div className="glass__noise" />

            <div className="relative z-10 p-4 md:p-6">
                <div className="flex items-center gap-2 mb-4">
                    <Users className="w-4 h-4 text-primary" />
                    <h2 className="text-base md:text-lg font-semibold text-foreground">
                        Today's Moods
                    </h2>
                </div>

                <div className="space-y-2">
                    {moodCategories.map((mood) => {
                        const { key, label, color, icon } = mood;
                        const count = moodDistribution[key] || 0;
                        const names = transformedMoodLists[key] || [];
                        const isExpanded = expandedMood === key;

                        // Show all moods, even if count is 0, but with different styling
                        const hasData = count > 0;

                        return (
                            <div key={key} className="glass glass-card transition-all duration-300">
                                <div className="glass__refract" />
                                <div className="glass__noise" />

                                <div className="relative z-10">
                                    <button
                                        onClick={() => toggleMood(key)}
                                        className={`w-full p-3 md:p-4 text-left transition-all duration-300 rounded-lg ${hasData ? 'hover:bg-card/40' : 'opacity-60 hover:opacity-80'
                                            }`}
                                        disabled={!hasData}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <span className="text-lg">{icon}</span>
                                                <div>
                                                    <span className={`font-medium ${hasData ? 'text-foreground' : 'text-muted-foreground'}`}>
                                                        {label}
                                                        {mood.isAIGenerated && (
                                                            <span className="ml-2 px-1.5 py-0.5 bg-primary/20 text-primary text-xs rounded">
                                                                AI
                                                            </span>
                                                        )}
                                                    </span>
                                                    <span className="ml-2 text-sm text-muted-foreground">
                                                        {count} {count === 1 ? 'person' : 'people'}
                                                    </span>
                                                </div>
                                            </div>
                                            {hasData && (isExpanded ? (
                                                <ChevronUp className="w-4 h-4 text-muted-foreground" />
                                            ) : (
                                                <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                            ))}
                                        </div>
                                    </button>

                                    {isExpanded && (
                                        <div className="px-3 md:px-4 pb-3 md:pb-4">
                                            <div className="border-t border-border/30 pt-3">
                                                {names.length > 0 ? (
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                        {names.map((name, index) => (
                                                            <div
                                                                key={index}
                                                                className="text-sm text-muted-foreground bg-card/20 px-2 py-1 rounded border border-border/20"
                                                            >
                                                                {name}
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <p className="text-sm text-muted-foreground italic">No one selected this mood yet</p>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
});

MoodBreakdown.displayName = 'MoodBreakdown';
export default MoodBreakdown;