// Years, months and days from the join date to now, worked out when it is read so it never goes stale.
function calculateWorkingPeriod(joinDate, referenceDate = new Date()) {
    if (!joinDate) return undefined;

    const start = new Date(joinDate);
    const end = new Date(referenceDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return undefined;

    let years = end.getFullYear() - start.getFullYear();
    let months = end.getMonth() - start.getMonth();
    let days = end.getDate() - start.getDate();

    if (days < 0) {
        months -= 1;
        days += new Date(end.getFullYear(), end.getMonth(), 0).getDate();
    }
    if (months < 0) {
        years -= 1;
        months += 12;
    }

    return { years: Math.max(years, 0), months: Math.max(months, 0), days: Math.max(days, 0) };
}

module.exports = { calculateWorkingPeriod };
