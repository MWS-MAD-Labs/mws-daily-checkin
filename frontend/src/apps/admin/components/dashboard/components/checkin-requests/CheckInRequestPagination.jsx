import React, { memo } from "react";

const CheckInRequestPagination = memo(({ currentPage, totalPages, onPageChange }) => (
    <div className="pt-1 flex items-center justify-between text-xs text-muted-foreground">
        <button
            type="button"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-1.5 rounded-full border border-border hover:border-primary hover:text-primary disabled:opacity-50 transition"
        >
            Previous
        </button>
        <span>Page {currentPage} of {totalPages}</span>
        <button
            type="button"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-1.5 rounded-full border border-border hover:border-primary hover:text-primary disabled:opacity-50 transition"
        >
            Next
        </button>
    </div>
));

CheckInRequestPagination.displayName = "CheckInRequestPagination";

export default CheckInRequestPagination;
