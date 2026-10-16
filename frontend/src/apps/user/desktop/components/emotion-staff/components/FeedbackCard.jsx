import React, { memo } from "react";

const FeedbackCard = memo(({ feedback, animate = true }) => (
    <div
        className={`
            p-3 md:p-4 rounded-lg border backdrop-blur-sm
            ${animate ? 'animate-in fade-in slide-in-from-bottom-2 duration-300' : ''}
        `}
        style={{
            backgroundColor: `hsla(var(--${feedback.color}), 0.05)`,
            borderColor: `hsla(var(--${feedback.color}), 0.2)`
        }}
    >
        <div className="flex items-start gap-3">
            <span className="text-2xl flex-shrink-0">{feedback.icon}</span>
            <p
                className="text-xs md:text-sm font-medium leading-relaxed"
                style={{ color: `hsl(var(--${feedback.color}))` }}
            >
                {feedback.text}
            </p>
        </div>
    </div>
));

FeedbackCard.displayName = 'FeedbackCard';
export default FeedbackCard;