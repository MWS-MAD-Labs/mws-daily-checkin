export const HISTORY_LIMIT = 20;

export const formatHistoryDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
};

export const weatherIcon = (weatherType) => {
    const iconMap = {
        sunny: "☀️",
        "partly-cloudy": "⛅",
        cloudy: "☁️",
        rainy: "🌧️",
        stormy: "⛈️",
        snowy: "❄️",
    };
    return iconMap[weatherType] || "⛅";
};
