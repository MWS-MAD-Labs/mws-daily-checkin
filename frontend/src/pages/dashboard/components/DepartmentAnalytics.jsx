import React, { memo } from "react";
import { Building2, TrendingUp, Users } from "lucide-react";

const DepartmentAnalytics = memo(({ departments = [] }) => {
    if (!departments || departments.length === 0) return null;

    return (
        <div className="glass glass-card transition-all duration-300">
            <div className="glass__refract" />
            <div className="glass__noise" />

            <div className="relative z-10 p-4 md:p-6">
                <div className="flex items-center gap-2 mb-4">
                    <Building2 className="w-4 h-4 text-primary" />
                    <h2 className="text-base md:text-lg font-semibold text-foreground">
                        Department Analytics
                    </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {departments.map((dept, index) => (
                        <div
                            key={dept.department || index}
                            className="p-4 rounded-lg bg-card/40 border border-border/40 backdrop-blur-sm hover:border-primary/40 hover:bg-card/60 transition-all duration-300"
                        >
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="font-semibold text-foreground text-sm md:text-base capitalize">
                                    {dept.department || 'Unknown'}
                                </h3>
                                <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                                    <Users className="w-4 h-4 text-primary" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-muted-foreground">Submissions</span>
                                    <span className="text-sm font-medium text-foreground">
                                        {dept.submitted}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-muted-foreground">Avg Presence</span>
                                    <div className="flex items-center gap-1">
                                        <TrendingUp className="w-3 h-3 text-emerald-500" />
                                        <span className="text-sm font-medium text-foreground">
                                            {dept.avgPresence}/10
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-muted-foreground">Avg Capacity</span>
                                    <div className="flex items-center gap-1">
                                        <TrendingUp className="w-3 h-3 text-blue-500" />
                                        <span className="text-sm font-medium text-foreground">
                                            {dept.avgCapacity}/10
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Progress bars */}
                            <div className="mt-3 space-y-2">
                                <div>
                                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                                        <span>Presence Level</span>
                                        <span>{dept.avgPresence}/10</span>
                                    </div>
                                    <div className="w-full bg-muted/30 rounded-full h-1.5 overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-500 ease-out"
                                            style={{ width: `${(dept.avgPresence / 10) * 100}%` }}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                                        <span>Capacity Level</span>
                                        <span>{dept.avgCapacity}/10</span>
                                    </div>
                                    <div className="w-full bg-muted/30 rounded-full h-1.5 overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all duration-500 ease-out"
                                            style={{ width: `${(dept.avgCapacity / 10) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
});

DepartmentAnalytics.displayName = 'DepartmentAnalytics';

export default DepartmentAnalytics;