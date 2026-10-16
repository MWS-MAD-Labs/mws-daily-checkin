import React, { memo, useMemo } from "react";
import MoodChip from "./components/MoodChip";

const moodOptions = [
    { id: "happy", label: "Happy", labelId: "Bahagia", icon: "Smile", color: "gold" },
    { id: "excited", label: "Excited", labelId: "Semangat", icon: "Zap", color: "gold" },
    { id: "calm", label: "Calm", labelId: "Tenang", icon: "HeartPulse", color: "emerald" },
    { id: "hopeful", label: "Hopeful", labelId: "Penuh Harap", icon: "Sparkles", color: "emerald" },
    { id: "sad", label: "Sad", labelId: "Sedih", icon: "Frown", color: "primary" },
    { id: "anxious", label: "Anxious", labelId: "Cemas", icon: "AlertCircle", color: "primary" },
    { id: "angry", label: "Angry", labelId: "Marah", icon: "Flame", color: "primary" },
    { id: "fear", label: "Fear", labelId: "Takut", icon: "Shield", color: "primary" },
    { id: "tired", label: "Tired", labelId: "Lelah", icon: "Moon", color: "muted" },
    { id: "hungry", label: "Hungry", labelId: "Lapar", icon: "Coffee", color: "muted" },
    { id: "lonely", label: "Lonely", labelId: "Kesepian", icon: "Users", color: "muted" },
    { id: "bored", label: "Bored", labelId: "Bosan", icon: "XCircle", color: "muted" },
    { id: "overwhelmed", label: "Overwhelmed", labelId: "Kewalahan", icon: "Brain", color: "primary" },
    { id: "scattered", label: "Scattered", labelId: "Buyar", icon: "Shuffle", color: "muted" }
];

const MoodGroup = memo(({ title, moods, selectedMoods, onMoodToggle, color, startIndex }) => (
    <div className="space-y-2">
        <div className="flex items-center gap-2 px-2">
            <div className={`w-1 h-4 bg-gradient-to-b ${color} rounded-full`} />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {title}
            </span>
        </div>
        <div className={`grid gap-2 ${title === 'Positive' ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-2 md:grid-cols-3'}`}>
            {moods.map((mood, idx) => (
                <MoodChip
                    key={mood.id}
                    mood={mood}
                    isSelected={selectedMoods.includes(mood.id)}
                    onToggle={() => onMoodToggle(mood.id)}
                    index={startIndex + idx}
                />
            ))}
        </div>
    </div>
));

const SelectionCounter = memo(({ selectedCount }) => (
    selectedCount > 0 && (
        <div className="p-3 md:p-4 rounded-lg border border-border bg-card/60 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-center justify-between">
                <p className="text-xs md:text-sm text-muted-foreground">
                    Selected emotions
                </p>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald animate-pulse" />
                    <span className="text-sm md:text-base font-semibold text-foreground">
                        {selectedCount}
                    </span>
                </div>
            </div>
        </div>
    )
));

const MoodSelector = memo(({ selectedMoods, onMoodToggle }) => {
    const groupedMoods = useMemo(() => ({
        positive: moodOptions.filter(m => ['happy', 'excited', 'calm', 'hopeful'].includes(m.id)),
        challenging: moodOptions.filter(m => ['sad', 'anxious', 'angry', 'fear', 'overwhelmed'].includes(m.id)),
        neutral: moodOptions.filter(m => ['tired', 'hungry', 'lonely', 'bored', 'scattered'].includes(m.id))
    }), []);

    const selectedCount = selectedMoods.length;

    return (
        <div className="glass glass-card hover-lift transition-all duration-300">
            <div className="glass__refract" />
            <div className="glass__refract--soft" />
            <div className="glass__noise" />
            <div className="relative z-10 p-5 md:p-6 space-y-5">
                <div className="space-y-2">
                    <h2 className="text-lg md:text-xl font-semibold text-foreground tracking-tight">
                        How Are You Feeling?
                    </h2>
                    <p className="text-xs md:text-sm text-muted-foreground">
                        Select all emotions that resonate with you today
                    </p>
                </div>
                <div className="space-y-4">
                    <MoodGroup
                        title="Positive"
                        moods={groupedMoods.positive}
                        selectedMoods={selectedMoods}
                        onMoodToggle={onMoodToggle}
                        color="from-gold to-emerald"
                        startIndex={0}
                    />
                    <MoodGroup
                        title="Challenging"
                        moods={groupedMoods.challenging}
                        selectedMoods={selectedMoods}
                        onMoodToggle={onMoodToggle}
                        color="from-primary to-primary/60"
                        startIndex={4}
                    />
                    <MoodGroup
                        title="Physical & Neutral"
                        moods={groupedMoods.neutral}
                        selectedMoods={selectedMoods}
                        onMoodToggle={onMoodToggle}
                        color="from-muted to-muted/60"
                        startIndex={9}
                    />
                </div>
                <SelectionCounter selectedCount={selectedCount} />
            </div>
        </div>
    );
});

MoodSelector.displayName = 'MoodSelector';
export default MoodSelector;