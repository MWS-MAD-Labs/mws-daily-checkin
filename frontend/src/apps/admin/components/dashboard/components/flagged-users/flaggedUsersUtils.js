export const PAGE_SIZE = 10;

const buildAiReasons = (user = {}) => {
    const presence = user.presenceLevel || 0;
    const capacity = user.capacityLevel || 0;
    const aiAnalysis = user.aiAnalysis || {};
    const reasons = [];

    if (presence < 4) reasons.push("Low presence level");
    if (capacity < 4) reasons.push("Low capacity level");
    if (aiAnalysis.needsSupport) reasons.push("AI detected support need");
    if (aiAnalysis.emotionalInstability) reasons.push("Emotional instability detected");
    if (aiAnalysis.trendDecline) reasons.push("Declining trend");
    if (aiAnalysis.historicalPatterns?.consistentLowPresence) reasons.push("Consistently low presence");
    if (aiAnalysis.historicalPatterns?.increasingSupportNeeds) reasons.push("Increasing support requests");

    return reasons.join(", ");
};

export const mapFlaggedUsers = (users = []) => users.map((user) => ({
    id: user.id || user._id,
    name: user.name,
    mood: user.mood || "neutral",
    grade: user.classes?.[0]?.grade || user.grade || "-",
    role: user.role,
    department: user.department,
    lastCheckin: user.lastCheckin || (user.submittedAt ? new Date(user.submittedAt).toLocaleDateString() : "—"),
    presenceLevel: user.presenceLevel || 0,
    capacityLevel: user.capacityLevel || 0,
    weatherType: user.weatherType,
    selectedMoods: user.selectedMoods || [],
    aiReason: buildAiReasons(user),
    raw: user,
}));
