import React, { memo, useState } from "react";
import { Cloud, Sun, CloudRain, Zap, Tornado, Snowflake, Eye, Users, Rainbow, Flame, Wind } from "lucide-react";

const InternalWeather = memo(({ weatherData, moodLists }) => {
    // moodLists now contains user names directly from backend
    const transformedMoodLists = moodLists || {};
    const [selectedWeather, setSelectedWeather] = useState(null);

    // Dynamic weather types that can be extended with AI-generated ones
    const baseWeatherTypes = [
        { key: "sunny", label: "Sunny & Clear", icon: Sun, color: "gold", desc: "Upbeat, calm, full of clarity" },
        { key: "partly-cloudy", label: "Partly Cloudy", icon: Cloud, color: "muted", desc: "Doing alright, but there's something lingering in the background—mild stress or distraction" },
        { key: "light-rain", label: "Light Rain", icon: CloudRain, color: "primary", desc: "Reflective or tired" },
        { key: "thunderstorms", label: "Thunderstorms", icon: Zap, color: "primary", desc: "Intense feelings, anxiety" },
        { key: "tornado", label: "Chaotic", icon: Tornado, color: "primary", desc: "Hard to focus" },
        { key: "snowy", label: "Snowy & Still", icon: Snowflake, color: "emerald", desc: "Slow, introspective" },
        { key: "rainbow", label: "Rainbow", icon: Rainbow, color: "emerald", desc: "Just came through something difficult, but there's hope and beauty emerging now" },
        { key: "foggy", label: "Foggy", icon: Cloud, color: "muted", desc: "Mentally fuzzy, unclear, maybe a bit lost" },
        { key: "heatwave", label: "Heatwave", icon: Flame, color: "gold", desc: "Energetic but possibly burnt out or overstimulated" },
        { key: "windy", label: "Windy", icon: Wind, color: "emerald", desc: "Restless, scattered, or in transition" }
    ];

    // Add AI-generated weather types if they exist in the data
    const aiWeatherTypes = [];
    Object.keys(weatherData).forEach(weatherKey => {
        if (!baseWeatherTypes.find(w => w.key === weatherKey)) {
            // This is an AI-generated weather type
            aiWeatherTypes.push({
                key: weatherKey,
                label: weatherKey.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                icon: Cloud, // Default icon for AI-generated types
                color: "primary",
                desc: `AI-detected emotional weather pattern: ${weatherKey}`,
                isAIGenerated: true
            });
        }
    });

    const weatherTypes = [...baseWeatherTypes, ...aiWeatherTypes];

    const maxCount = Math.max(...Object.values(weatherData));

    // Get staff names for selected weather based on mood correlation
    const getWeatherStaff = (weatherKey) => {
        const moodMapping = {
            sunny: ['happy', 'excited', 'calm', 'hopeful'],
            'partly-cloudy': ['tired', 'hungry', 'lonely', 'scattered'],
            'light-rain': ['sad', 'anxious'],
            thunderstorms: ['fear', 'angry', 'overwhelmed'],
            tornado: ['scattered', 'overwhelmed'],
            snowy: ['calm', 'hopeful'],
            rainbow: ['hopeful', 'calm'],
            foggy: ['scattered', 'tired'],
            heatwave: ['excited', 'happy'],
            windy: ['scattered', 'anxious']
        };

        const relevantMoods = moodMapping[weatherKey] || [];
        const staffNames = [];

        relevantMoods.forEach(mood => {
            if (transformedMoodLists[mood]) {
                staffNames.push(...transformedMoodLists[mood]);
            }
        });

        return [...new Set(staffNames)]; // Remove duplicates
    };

    return (
        <div className="glass glass-card transition-all duration-300">
            <div className="glass__refract" />
            <div className="glass__noise" />

            <div className="relative z-10 p-4 md:p-6">
                <div className="flex items-center gap-2 mb-4">
                    <Eye className="w-4 h-4 text-primary" />
                    <h2 className="text-base md:text-lg font-semibold text-foreground">
                        Internal Weather
                    </h2>
                </div>

                <p className="text-sm text-muted-foreground mb-4">
                    Click a bar to see the description.
                </p>

                <div className="space-y-3">
                    {weatherTypes.map((weather) => {
                        const { key, label, icon: Icon, color, desc } = weather;
                        const count = weatherData[key] || 0;
                        const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0;
                        const isSelected = selectedWeather === key;

                        return (
                            <button
                                key={key}
                                onClick={() => setSelectedWeather(isSelected ? null : key)}
                                className="w-full glass glass-card transition-all duration-300"
                            >
                                <div className="glass__refract" />
                                <div className="glass__noise" />

                                <div className="relative z-10 p-3 md:p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-3">
                                            <Icon className={`w-5 h-5 ${color === 'gold' ? 'text-gold' : color === 'muted' ? 'text-muted-foreground' : color === 'primary' ? 'text-primary' : color === 'emerald' ? 'text-emerald' : 'text-foreground'}`} />
                                            <span className="font-medium text-foreground text-sm md:text-base">
                                                {label}
                                            </span>
                                        </div>
                                        <span className="text-sm font-bold text-foreground">
                                            {count}
                                        </span>
                                    </div>

                                    <div className="w-full bg-muted/30 rounded-full h-2 overflow-hidden">
                                        <div
                                            className={`h-full transition-all duration-500 ease-out ${color === 'gold' ? 'bg-gradient-to-r from-gold to-gold/70' :
                                                color === 'muted' ? 'bg-gradient-to-r from-muted to-muted/70' :
                                                    color === 'primary' ? 'bg-gradient-to-r from-primary to-primary/70' :
                                                        color === 'emerald' ? 'bg-gradient-to-r from-emerald to-emerald/70' :
                                                            'bg-gradient-to-r from-primary to-primary/70'
                                                }`}
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </div>

                                    {isSelected && (
                                        <div className="mt-3 p-3 bg-card/50 rounded-lg border border-border/30">
                                            <div className="flex items-start gap-2 mb-2">
                                                <span className="text-lg">
                                                    <Icon className={`w-4 h-4 ${color === 'gold' ? 'text-gold' :
                                                        color === 'muted' ? 'text-muted-foreground' :
                                                            color === 'primary' ? 'text-primary' :
                                                                color === 'emerald' ? 'text-emerald' :
                                                                    'text-foreground'
                                                        }`} />
                                                </span>
                                                <p className="text-sm text-muted-foreground flex-1">
                                                    {label} – {desc}
                                                    {weather.isAIGenerated && (
                                                        <span className="ml-2 px-1.5 py-0.5 bg-primary/20 text-primary text-xs rounded">
                                                            AI-Generated
                                                        </span>
                                                    )}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <Users className="w-3 h-3" />
                                                <span>Chosen by: {getWeatherStaff(key).join(', ')}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
});

InternalWeather.displayName = 'InternalWeather';
export default InternalWeather;