const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

const padDatePart = (value) => String(value).padStart(2, "0");

export const parseCalendarDate = (value) => {
    if (!value) return null;

    if (value instanceof Date) {
        return Number.isNaN(value.getTime()) ? null : new Date(value);
    }

    if (typeof value === "string") {
        const trimmed = value.trim();
        const match = trimmed.match(DATE_ONLY_PATTERN);
        if (match) {
            const [, year, month, day] = match;
            const parsed = new Date(Number(year), Number(month) - 1, Number(day));
            return Number.isNaN(parsed.getTime()) ? null : parsed;
        }
    }

    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const formatCalendarDateKey = (value) => {
    const parsed = parseCalendarDate(value);
    if (!parsed) return null;

    return `${parsed.getFullYear()}-${padDatePart(parsed.getMonth() + 1)}-${padDatePart(parsed.getDate())}`;
};

export const getTodayCalendarDateKey = () => formatCalendarDateKey(new Date());

export const formatCalendarDateLabel = (value, options = { month: "short", day: "numeric" }) => {
    const parsed = parseCalendarDate(value);
    if (!parsed) return typeof value === "string" ? value : "";
    return parsed.toLocaleDateString("en-US", options);
};
