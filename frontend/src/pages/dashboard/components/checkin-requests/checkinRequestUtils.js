export const STATUS_BADGES = {
    requested: "bg-amber-100 text-amber-900 dark:bg-amber-900/20 dark:text-amber-200 border border-amber-200/70",
    acknowledged: "bg-sky-100 text-sky-900 dark:bg-sky-900/20 dark:text-sky-200 border border-sky-200/70",
    handled: "bg-emerald-100 text-emerald-900 dark:bg-emerald-900/20 dark:text-emerald-200 border border-emerald-200/70",
};

export const PAGE_SIZE = 10;

export const normalizeRequestStatus = (status) =>
    status === "handled" || status === "acknowledged" ? status : "requested";
