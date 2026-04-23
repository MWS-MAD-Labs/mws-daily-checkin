import { formatCalendarDateKey, parseCalendarDate } from "./calendarDate";

export const BUSINESS_DAYS_RATIO = 5 / 7;

export const DEFAULT_WORKDAY_ESTIMATES = {
    today: 1,
    week: 5,
    month: 20,
    semester: 88,
    all: 20
};

export const parseDateValue = (value) => {
    return parseCalendarDate(value);
};

const getTimelineDateCandidate = (entry) => {
    if (!entry) return null;
    if (entry instanceof Date || typeof entry === "string" || typeof entry === "number") {
        return entry;
    }
    return (
        entry.date ||
        entry.day ||
        entry.timestamp ||
        entry.periodDay ||
        entry.period_date ||
        entry.calendarDate ||
        entry.checkinDate ||
        null
    );
};

export const countWorkdays = (timeline = []) => {
    if (!Array.isArray(timeline) || !timeline.length) return 0;
    const uniqueBusinessDays = new Set();

    timeline.forEach((entry) => {
        const candidate = getTimelineDateCandidate(entry);
        const parsedDate = parseDateValue(candidate);
        if (!parsedDate) return;
        const day = parsedDate.getDay();
        if (day === 0 || day === 6) return;
        const dateKey = formatCalendarDateKey(parsedDate);
        if (dateKey) {
            uniqueBusinessDays.add(dateKey);
        }
    });

    return uniqueBusinessDays.size;
};

export const computeWorkdayCount = (timeline = [], periodLengthDays = 0, period = "today") => {
    const workdaysFromTimeline = countWorkdays(timeline);
    if (workdaysFromTimeline > 0) return workdaysFromTimeline;
    if (Array.isArray(timeline) && timeline.length > 0) {
        return timeline.length;
    }
    if (periodLengthDays) {
        return Math.max(1, Math.round(periodLengthDays * BUSINESS_DAYS_RATIO));
    }
    return DEFAULT_WORKDAY_ESTIMATES[period] || 1;
};

export const formatNumber = (value) => {
    if (typeof value !== "number" || !Number.isFinite(value)) return "0";
    return value.toLocaleString("en-US");
};

export const buildParticipationSnapshot = (stats = {}, period = "today") => {
    if (!stats) return null;

    const totalUsers = stats.totalUsers || 0;
    const totalCheckins = stats.totalCheckins || 0;
    const timeline = Array.isArray(stats.periodTimeline) ? stats.periodTimeline : [];
    const periodLengthDays = stats.periodLengthDays || timeline.length || 0;
    const workdayCount = Math.max(computeWorkdayCount(timeline, periodLengthDays, period), 1);
    const expectedSubmissions = totalUsers * workdayCount;
    const participationRate = expectedSubmissions > 0
        ? Math.min(100, Math.round((totalCheckins / expectedSubmissions) * 100))
        : 0;
    const notSubmittedUsers = Array.isArray(stats.notSubmittedUsers) ? stats.notSubmittedUsers : [];
    const notSubmittedCount = notSubmittedUsers.length || Math.max(0, totalUsers - Math.round(totalCheckins / workdayCount));
    const flaggedUsersCount = Array.isArray(stats.flaggedUsers) ? stats.flaggedUsers.length : (stats.flaggedUsersCount || 0);

    return {
        totalUsers,
        totalCheckins,
        participationRate,
        workdayCount,
        expectedSubmissions,
        notSubmittedUsers,
        notSubmittedCount,
        flaggedUsersCount,
        period,
        lastUpdated: stats.updatedAt || stats.lastUpdated || null
    };
};
