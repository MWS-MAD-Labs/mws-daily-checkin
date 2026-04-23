import React, { memo } from "react";
import { X, Users, TrendingUp, Cloud, Smile, AlertCircle } from "lucide-react";

const UserListModal = memo(({ isOpen, onClose, title, users, totalUsers, type }) => {
    if (!isOpen) return null;

    const sortedUsers = users ? [...users].sort() : [];

    // Get appropriate icon based on type
    const getIcon = () => {
        switch (type) {
            case 'mood':
                return <Smile className="w-5 h-5 text-primary" />;
            case 'weather':
                return <Cloud className="w-5 h-5 text-primary" />;
            case 'unit':
                return <Users className="w-5 h-5 text-primary" />;
            default:
                return <Users className="w-5 h-5 text-primary" />;
        }
    };

    return (
        <div className="fixed inset-0 bg-foreground/70 dark:bg-background/85 backdrop-blur-md flex items-center justify-center p-4" style={{ zIndex: 10000 }}>
            <div className="bg-card rounded-2xl shadow-2xl max-w-3xl w-full max-h-[85vh] overflow-hidden transform scale-100 animate-in fade-in-0 zoom-in-95 duration-300 border border-white/10">
                {/* Header */}
                <div className="flex items-center justify-between p-8 border-b border-border/50 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-full bg-primary/15 border-2 border-primary/30 flex items-center justify-center shadow-xl">
                            {type === 'not-submitted' ? (
                                <AlertCircle className="w-7 h-7 text-orange-600" />
                            ) : (
                                getIcon()
                            )}
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-foreground mb-1">{title}</h2>
                            <p className="text-sm text-muted-foreground font-medium">
                                {sortedUsers.length} of {totalUsers} users ({Math.round((sortedUsers.length / totalUsers) * 100)}%)
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-3 hover:bg-red-50 hover:text-red-600 rounded-full transition-all duration-200 hover:scale-110 shadow-lg border border-transparent hover:border-red-200"
                        title="Close modal"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-8 overflow-y-auto max-h-[calc(85vh-200px)] bg-gradient-to-b from-card/30 to-muted/30">
                    {sortedUsers.length > 0 ? (
                        <div className="space-y-4">
                            {sortedUsers.map((user, index) => (
                                <div
                                    key={index}
                                    className="flex items-center justify-between p-5 bg-card/90 border border-border/60 rounded-2xl hover:bg-card hover:border-primary/40 transition-all duration-300 hover:shadow-xl hover:scale-[1.02] backdrop-blur-sm cursor-pointer"
                                    onClick={() => {
                                        if (type === 'mood' || type === 'weather' || type === 'unit' || type === 'not-submitted') {
                                            // Navigate to individual user report
                                            const userId = users[index]?.userId || users[index]?.id;
                                            if (userId) {
                                                // Use React Router navigation instead of window.open for better UX
                                                window.location.href = `/emotional-wellness/${userId}`;
                                            }
                                        }
                                    }}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                                            <span className="text-xs font-medium text-primary">
                                                {typeof user === 'string' ? user.charAt(0).toUpperCase() : user.name?.charAt(0).toUpperCase() || '?'}
                                            </span>
                                        </div>
                                        <div className="flex-1">
                                            <span className="text-sm font-medium text-foreground">
                                                {typeof user === 'string' ? user : user.name}
                                            </span>
                                            {type === 'not-submitted' && typeof user === 'object' && (
                                                <div className="mt-1 space-y-1">
                                                    <p className="text-xs text-muted-foreground">
                                                        Has not submitted their emotional check-in yet
                                                    </p>
                                                    {user.role && (
                                                        <p className="text-xs text-muted-foreground">
                                                            Role: {user.role} • Department: {user.department}
                                                        </p>
                                                    )}
                                                </div>
                                            )}
                                            {type === 'mood' && (
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    Selected this mood in their emotional check-in (may include AI-detected emotions)
                                                </p>
                                            )}
                                            {type === 'weather' && (
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    Reported this weather condition (may include AI-analyzed weather patterns)
                                                </p>
                                            )}
                                            {type === 'unit' && (
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    Member of this unit/department
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        #{index + 1}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-16">
                            <div className="w-20 h-20 rounded-full bg-muted/40 flex items-center justify-center mx-auto mb-6 shadow-inner">
                                <Users className="w-10 h-10 text-muted-foreground" />
                            </div>
                            <p className="text-muted-foreground text-xl font-semibold mb-2">No users found for this category</p>
                            <p className="text-muted-foreground/80 text-base">Try selecting a different category or time period</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
});

UserListModal.displayName = 'UserListModal';

export default UserListModal;
