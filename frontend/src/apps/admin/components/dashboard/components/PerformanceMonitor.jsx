import React, { memo, useEffect, useState, useCallback } from "react";
import { Activity, Cpu, HardDrive } from "lucide-react";

// Performance monitoring component - only active in development
const PerformanceMonitor = memo(() => {
    const [metrics, setMetrics] = useState({
        fps: 0,
        memory: 0,
        renderTime: 0
    });
    const [isVisible, setIsVisible] = useState(false);

    const measurePerformance = useCallback(() => {
        if (!window.performance || !window.performance.memory) return;

        const memory = window.performance.memory;
        const memoryUsage = Math.round(memory.usedJSHeapSize / 1024 / 1024); // MB

        // Simple FPS measurement
        let fps = 0;
        let lastTime = performance.now();

        const measureFPS = () => {
            const currentTime = performance.now();
            fps = Math.round(1000 / (currentTime - lastTime));
            lastTime = currentTime;
        };

        requestAnimationFrame(measureFPS);

        setMetrics(prev => ({
            ...prev,
            fps,
            memory: memoryUsage,
            renderTime: performance.now()
        }));
    }, []);

    useEffect(() => {
        // Only show in development and when explicitly enabled
        if (process.env.NODE_ENV === 'development') {
            const handleKeyPress = (e) => {
                if (e.ctrlKey && e.shiftKey && e.key === 'P') {
                    setIsVisible(prev => !prev);
                }
            };

            window.addEventListener('keydown', handleKeyPress);
            const interval = setInterval(measurePerformance, 1000);

            return () => {
                window.removeEventListener('keydown', handleKeyPress);
                clearInterval(interval);
            };
        }
    }, [measurePerformance]);

    if (!isVisible || process.env.NODE_ENV !== 'development') return null;

    return (
        <div className="fixed bottom-4 right-4 z-50 bg-card/95 text-foreground p-3 rounded-lg font-mono text-xs backdrop-blur-sm border border-border/70 shadow-glass-sm">
            <div className="flex items-center gap-2 mb-2">
                <Activity className="w-4 h-4" />
                <span className="font-semibold">Performance Monitor</span>
            </div>
            <div className="space-y-1">
                <div className="flex items-center gap-2">
                    <Cpu className="w-3 h-3" />
                    <span>FPS: {metrics.fps}</span>
                </div>
                <div className="flex items-center gap-2">
                    <HardDrive className="w-3 h-3" />
                    <span>Memory: {metrics.memory}MB</span>
                </div>
            </div>
            <div className="text-xs text-gray-400 mt-2">
                Ctrl+Shift+P to toggle
            </div>
        </div>
    );
});

PerformanceMonitor.displayName = 'PerformanceMonitor';
export default PerformanceMonitor;
