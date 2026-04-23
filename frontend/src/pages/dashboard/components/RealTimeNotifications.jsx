import React, { memo, useState, useEffect } from "react";
import { Bell, X, AlertTriangle, CheckCircle, Info, AlertCircle } from "lucide-react";

const RealTimeNotifications = memo(({ socketService, user }) => {
    const [notifications, setNotifications] = useState([]);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (!socketService || !user) return;

        const handleNewCheckin = (data) => {
            const notification = {
                id: Date.now(),
                type: 'info',
                title: 'New Check-in Submitted',
                message: `${data.userName || 'Someone'} just submitted their emotional check-in`,
                timestamp: new Date(),
                icon: CheckCircle,
                color: 'text-blue-500',
                bgColor: 'bg-blue-50',
                borderColor: 'border-blue-200'
            };
            addNotification(notification);
        };

        const handleUserFlagged = (data) => {
            const notification = {
                id: Date.now(),
                type: 'warning',
                title: 'Support Needed',
                message: `${data.userName} has indicated they need support`,
                timestamp: new Date(),
                icon: AlertTriangle,
                color: 'text-red-500',
                bgColor: 'bg-red-50',
                borderColor: 'border-red-200'
            };
            addNotification(notification);
        };

        const handleDashboardUpdate = (data) => {
            const notification = {
                id: Date.now(),
                type: 'success',
                title: 'Dashboard Updated',
                message: 'New data has been added to the dashboard',
                timestamp: new Date(),
                icon: CheckCircle,
                color: 'text-green-500',
                bgColor: 'bg-green-50',
                borderColor: 'border-green-200'
            };
            addNotification(notification);
        };

        // Connect to socket events
        socketService.onNewCheckin(handleNewCheckin);
        socketService.onUserFlagged(handleUserFlagged);
        socketService.onDashboardUpdate(handleDashboardUpdate);

        // Cleanup
        return () => {
            socketService.offNewCheckin(handleNewCheckin);
            socketService.offUserFlagged(handleUserFlagged);
            socketService.offDashboardUpdate(handleDashboardUpdate);
        };
    }, [socketService, user]);

    const addNotification = (notification) => {
        setNotifications(prev => [notification, ...prev].slice(0, 10)); // Keep only latest 10
        setIsVisible(true);

        // Auto-hide after 5 seconds
        setTimeout(() => {
            setIsVisible(false);
        }, 5000);
    };

    const removeNotification = (id) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
        if (notifications.length <= 1) {
            setIsVisible(false);
        }
    };

    const clearAllNotifications = () => {
        setNotifications([]);
        setIsVisible(false);
    };

    if (notifications.length === 0) return null;

    return (
        <div className="fixed top-4 right-4 z-50 max-w-sm w-full">
            {/* Notification Bell */}
            <div className="flex justify-end mb-2">
                <button
                    onClick={() => setIsVisible(!isVisible)}
                    className="relative p-2 bg-primary text-primary-foreground rounded-full shadow-lg hover:bg-primary/90 transition-colors"
                >
                    <Bell className="w-4 h-4" />
                    {notifications.length > 0 && (
                        <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
                            {notifications.length}
                        </span>
                    )}
                </button>
            </div>

            {/* Notifications Panel */}
            {isVisible && (
                <div className="glass glass-card shadow-2xl max-h-96 overflow-hidden">
                    <div className="glass__refract" />
                    <div className="glass__noise" />

                    <div className="relative z-10">
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-border">
                            <h3 className="text-sm font-semibold text-foreground">Notifications</h3>
                            <button
                                onClick={clearAllNotifications}
                                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                            >
                                Clear all
                            </button>
                        </div>

                        {/* Notifications List */}
                        <div className="max-h-80 overflow-y-auto">
                            {notifications.map((notification) => {
                                const Icon = notification.icon;
                                return (
                                    <div
                                        key={notification.id}
                                        className={`p-4 border-b border-border/50 last:border-b-0 ${notification.bgColor} transition-all duration-300`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <Icon className={`w-4 h-4 mt-0.5 ${notification.color}`} />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between">
                                                    <h4 className="text-sm font-medium text-foreground">
                                                        {notification.title}
                                                    </h4>
                                                    <button
                                                        onClick={() => removeNotification(notification.id)}
                                                        className="ml-2 p-1 rounded transition-colors hover:bg-secondary/25"
                                                    >
                                                        <X className="w-3 h-3 text-muted-foreground" />
                                                    </button>
                                                </div>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    {notification.message}
                                                </p>
                                                <p className="text-xs text-muted-foreground mt-2">
                                                    {notification.timestamp.toLocaleTimeString()}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Footer */}
                        <div className="p-3 bg-muted/20 border-t border-border">
                            <p className="text-xs text-muted-foreground text-center">
                                Real-time updates active
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
});

RealTimeNotifications.displayName = 'RealTimeNotifications';

export default RealTimeNotifications;
