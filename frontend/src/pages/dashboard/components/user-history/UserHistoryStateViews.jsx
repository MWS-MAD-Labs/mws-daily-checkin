import React, { memo } from "react";
import { Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const UserHistoryLoadingState = memo(() => (
    <Card>
        <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Check-in History
            </CardTitle>
        </CardHeader>
        <CardContent>
            <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                        <div className="h-4 bg-muted rounded w-1/4 mb-2" />
                        <div className="h-3 bg-muted rounded w-3/4" />
                    </div>
                ))}
            </div>
        </CardContent>
    </Card>
));

export const UserHistoryEmptyState = memo(() => (
    <Card>
        <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Check-in History
            </CardTitle>
        </CardHeader>
        <CardContent>
            <div className="text-center py-8 text-muted-foreground">
                <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No check-in history available</p>
            </div>
        </CardContent>
    </Card>
));
