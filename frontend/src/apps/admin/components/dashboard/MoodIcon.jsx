import React, { memo } from "react";
import { Smile, Frown, Meh, Heart } from "lucide-react";
import { moodConfig } from "./utils";

const MoodIcon = memo(({ mood, size = "w-5 h-5" }) => {
    const config = moodConfig[mood] || moodConfig.okay;
    const IconComponent = {
        happy: Smile,
        excited: Heart,
        okay: Meh,
        sad: Frown
    }[mood] || Meh;

    return <IconComponent className={`${size} text-${config.color}`} />;
});

MoodIcon.displayName = 'MoodIcon';
export default MoodIcon;