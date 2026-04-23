import React, { memo, useState } from "react";
import { Download, FileText, FileSpreadsheet } from "lucide-react";
import { exportDashboardData } from "../../../services/dashboardService";
import { useToast } from "../../../components/ui/use-toast";

const ExportButton = memo(({ period = 'today' }) => {
    const [isExporting, setIsExporting] = useState(false);
    const { toast } = useToast();

    const handleExport = async (format) => {
        setIsExporting(true);
        try {
            const response = await exportDashboardData(period, format);

            if (format === 'csv') {
                // Create download link for CSV
                const url = window.URL.createObjectURL(new Blob([response.data]));
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', `dashboard-${period}-${new Date().toISOString().split('T')[0]}.csv`);
                document.body.appendChild(link);
                link.click();
                link.remove();
                window.URL.revokeObjectURL(url);
            } else {
                // Handle JSON export
                const dataStr = JSON.stringify(response.data, null, 2);
                const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

                const exportFileDefaultName = `dashboard-${period}-${new Date().toISOString().split('T')[0]}.json`;

                const linkElement = document.createElement('a');
                linkElement.setAttribute('href', dataUri);
                linkElement.setAttribute('download', exportFileDefaultName);
                linkElement.click();
            }

            toast({
                title: "Export Successful",
                description: `Dashboard data exported as ${format.toUpperCase()}`,
            });
        } catch (error) {
            console.error('Export error:', error);
            toast({
                title: "Export Failed",
                description: "Failed to export dashboard data. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="flex gap-2">
            <button
                onClick={() => handleExport('json')}
                disabled={isExporting}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
                <FileText className="w-4 h-4" />
                {isExporting ? 'Exporting...' : 'Export JSON'}
            </button>

            <button
                onClick={() => handleExport('csv')}
                disabled={isExporting}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
                <FileSpreadsheet className="w-4 h-4" />
                {isExporting ? 'Exporting...' : 'Export CSV'}
            </button>
        </div>
    );
});

ExportButton.displayName = 'ExportButton';

export default ExportButton;