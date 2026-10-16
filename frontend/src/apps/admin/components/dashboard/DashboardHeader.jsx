import { memo } from "react";
import { Calendar } from "lucide-react";
import { periodOptions } from "./utils";
import { formatCalendarDateLabel } from "./utils/calendarDate";

const DashboardHeader = memo(({
    selectedPeriod,
    onPeriodChange,
    selectedDate,
    onDateChange,
    onApplyDate,
    isApplyDisabled,
    isHeadUnit,
    userUnit,
    isDirectorate,
    onSummaryClick
}) => {

    const formatDate = (dateString) => {
        return formatCalendarDateLabel(dateString, {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const getDateHelperText = () => {
        if (isDatePickerDisabled) {
            return 'Showing entire emotional history.';
        }

        const dateLabel = selectedDate ? formatDate(selectedDate) : 'the selected date';
        const prefix = isApplyDisabled ? 'Showing' : 'Apply to show';

        switch (selectedPeriod) {
            case 'today':
                return `${prefix} metrics for ${dateLabel}.`;
            case 'week':
                return `${prefix} the 7-day trend ending on ${dateLabel}.`;
            case 'month':
                return `${prefix} the 30-day trend ending on ${dateLabel}.`;
            case 'semester':
                return `${prefix} the semester trend ending on ${dateLabel}.`;
            default:
                return `${prefix} metrics for ${dateLabel}.`;
        }
    };

    const isDatePickerDisabled = selectedPeriod === 'all';

    return (
        <div className="space-y-4 md:space-y-6 mb-4 md:mb-6" data-aos="fade-up" data-aos-delay="40">
            <div className="glass glass-card border border-border/60 p-4 md:p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 border border-primary/30 text-primary flex items-center justify-center">
                            <Calendar className="w-5 h-5" aria-hidden="true" />
                        </div>
                        <div>
                            <h1 className="text-xl md:text-2xl font-semibold text-foreground leading-tight">
                                {isHeadUnit
                                    ? `Unit Dashboard · ${userUnit || 'Your Unit'}`
                                    : isDirectorate ? 'Organization Wellness Dashboard' : 'Daily Check-in Dashboard'}
                            </h1>
                            <p className="text-xs md:text-sm text-muted-foreground">
                                {isHeadUnit
                                    ? "Monitor your team's wellness and emotional well-being."
                                    : isDirectorate
                                        ? 'Review organization-wide emotional data and individual insights.'
                                        : 'Monitor staff wellness and emotional well-being.'}
                            </p>
                        </div>
                    </div>
                    <span className="text-[11px] uppercase tracking-[0.35em] text-muted-foreground">
                        {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </span>
                </div>

                <div className="grid gap-4 lg:grid-cols-3">
                    <section className="rounded-2xl border border-border/70 bg-background/60 p-4 space-y-3">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-muted-foreground">Report Type</p>
                        <div className="flex flex-wrap gap-2">
                            {periodOptions.map(({ id, label }) => (
                                <button
                                    key={id}
                                    onClick={() => onPeriodChange(id)}
                                    className={`
                                        px-3 py-1.5 rounded-full text-xs font-semibold transition-all
                                        ${selectedPeriod === id
                                            ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
                                            : 'bg-muted/30 text-muted-foreground border border-border/60 hover:border-primary/40 hover:text-primary'}
                                    `}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    </section>

                    <section className="rounded-2xl border border-border/70 bg-background/60 p-4 space-y-3">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-muted-foreground">Select Date</p>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => onDateChange(e.target.value)}
                                disabled={isDatePickerDisabled}
                                className={`flex items-center gap-2 px-3 py-1.5 bg-card/50 border border-border/50 rounded-lg transition-all duration-300 text-sm text-foreground
                                ${isDatePickerDisabled
                                    ? 'opacity-60 cursor-not-allowed'
                                    : 'hover:border-primary/40 hover:bg-card/80'}
                            `}
                            />
                            {!isDatePickerDisabled && (
                                <button
                                    type="button"
                                    onClick={onApplyDate}
                                    disabled={isApplyDisabled}
                                    className="px-4 py-1.5 rounded-full border border-primary/40 text-primary text-xs font-semibold hover:bg-primary/10 disabled:opacity-50"
                                >
                                    Apply
                                </button>
                            )}
                        </div>
                        <p className="text-[10px] text-muted-foreground">
                            {getDateHelperText()}
                        </p>
                    </section>

                    <section className="rounded-2xl border border-border/70 bg-background/60 p-4 space-y-3">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-muted-foreground">View</p>
                        <button
                            onClick={onSummaryClick}
                            className="w-full px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold shadow-lg shadow-primary/25 hover:bg-primary/90 active:scale-[0.98] transition-all"
                        >
                            {isHeadUnit ? 'Unit Summary' : isDirectorate ? 'Organization Summary' : 'Summary'}
                        </button>
                        <p className="text-[10px] text-muted-foreground">
                            Adjust filters below to personalize the data displayed in this summary.
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
});

DashboardHeader.displayName = 'DashboardHeader';
export default DashboardHeader;
