import React, { memo, useMemo, useState } from "react";
import { Filter, X, Users, Building } from "lucide-react";
import {
    departmentOptions,
    moodOptions,
    roleOptions,
    supportStatusOptions,
    weatherOptions,
} from "@/pages/dashboard/components/advanced-filters/advancedFilterOptions";

const FilterOptionGrid = memo(({ category, options, filters, onToggle, columns = "grid-cols-2" }) => (
    <div className={`grid ${columns} gap-2`}>
        {options.map((option) => (
            <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                <input
                    type="checkbox"
                    checked={filters[category]?.includes(option.value) || false}
                    onChange={() => onToggle(category, option.value)}
                    className="rounded border-border"
                />
                <span className="text-sm text-foreground">{option.label}</span>
            </label>
        ))}
    </div>
));

const FilterSection = memo(({ icon: Icon, title, category, options, filters, onToggle, columns }) => (
    <div>
        <div className="flex items-center gap-2 mb-3">
            {Icon ? <Icon className="w-4 h-4 text-muted-foreground" /> : null}
            <span className="text-sm font-medium text-foreground">{title}</span>
        </div>
        <FilterOptionGrid
            category={category}
            options={options}
            filters={filters}
            onToggle={onToggle}
            columns={columns}
        />
    </div>
));

const AdvancedFilters = memo(({ onFiltersChange, currentFilters = {} }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [filters, setFilters] = useState(currentFilters);

    const sections = useMemo(() => ([
        { icon: Users, title: "Role", category: "role", options: roleOptions, columns: "grid-cols-2" },
        { icon: Building, title: "Department", category: "department", options: departmentOptions, columns: "grid-cols-1" },
        { title: "Moods", category: "mood", options: moodOptions, columns: "grid-cols-2" },
        { title: "Weather Types", category: "weather", options: weatherOptions, columns: "grid-cols-2" },
        { title: "Support Status", category: "needsSupport", options: supportStatusOptions, columns: "grid-cols-1" },
    ]), []);

    const handleFilterChange = (category, value) => {
        const next = { ...filters };
        if (!next[category]) next[category] = [];

        if (next[category].includes(value)) {
            next[category] = next[category].filter((item) => item !== value);
        } else {
            next[category].push(value);
        }

        if (next[category].length === 0) delete next[category];
        setFilters(next);
        onFiltersChange(next);
    };

    const clearFilters = () => {
        setFilters({});
        onFiltersChange({});
    };

    const activeFilterCount = Object.values(filters).reduce((count, arr) => count + arr.length, 0);

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${activeFilterCount > 0
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card text-foreground border-border hover:bg-card/80"
                    }`}
            >
                <Filter className="w-4 h-4" />
                <span className="text-sm font-medium">Advanced Filters</span>
                {activeFilterCount > 0 && (
                    <span className="bg-destructive text-destructive-foreground text-xs px-2 py-1 rounded-full">{activeFilterCount}</span>
                )}
            </button>

            {isOpen && (
                <div className="absolute top-full mt-2 right-0 z-50 w-96 bg-card border border-border rounded-xl shadow-2xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-foreground">Filter Dashboard Data</h3>
                        <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-muted rounded">
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="space-y-6">
                        {sections.map((section) => (
                            <FilterSection
                                key={section.category}
                                icon={section.icon}
                                title={section.title}
                                category={section.category}
                                options={section.options}
                                filters={filters}
                                onToggle={handleFilterChange}
                                columns={section.columns}
                            />
                        ))}
                    </div>

                    <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
                        <button
                            onClick={clearFilters}
                            className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                            Clear All
                        </button>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                        >
                            Apply Filters
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
});

AdvancedFilters.displayName = "AdvancedFilters";

export default AdvancedFilters;
