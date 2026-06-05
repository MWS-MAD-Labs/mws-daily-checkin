import { memo, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { fetchUserById } from "../../store/slices/userSlice";
import IndividualView from "./components/IndividualView";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { ArrowLeft, Loader2, User } from "lucide-react";
import { motion } from "framer-motion";

const IndividualDashboard = memo(() => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    const { userId } = useParams();
    const { user: currentUser } = useSelector((state) => state.auth);
    const { users } = useSelector((state) => state.users);

    const [selectedUser, setSelectedUser] = useState(null);
    const [resolvingUser, setResolvingUser] = useState(false);
    const [userAccessError, setUserAccessError] = useState(null);

    const locationStateUser = location.state?.user;
    const cameFromDashboard = Boolean(location.state?.fromDashboard);
    const isHeadUnit = currentUser?.role === 'head_unit';

    useEffect(() => {
        let isMounted = true;

        const resolveUserContext = async () => {
            setUserAccessError(null);

            if (!userId) {
                if (currentUser && isMounted) setSelectedUser(currentUser);
                setResolvingUser(false);
                return;
            }

            setResolvingUser(true);

            if (locationStateUser && isMounted) {
                setSelectedUser(locationStateUser);
                setResolvingUser(false);
                return;
            }

            const normalizedTargetId = userId?.toString();
            const existingUser = users.find((u) => {
                const cid = u?.id?.toString() || u?._id?.toString();
                return cid === normalizedTargetId;
            });

            if (existingUser && isMounted) {
                setSelectedUser(existingUser);
                setResolvingUser(false);
                return;
            }

            try {
                const response = await dispatch(fetchUserById(userId)).unwrap();
                if (!isMounted) return;
                const fetchedUser = response?.user || response?.data?.user || response?.data || response;
                if (fetchedUser) setSelectedUser(fetchedUser);
            } catch (error) {
                if (isMounted) {
                    console.error('Error loading targeted user:', error);
                    setSelectedUser({
                        id: userId,
                        _id: userId,
                        name: locationStateUser?.name || 'Selected user',
                        role: locationStateUser?.role,
                        department: locationStateUser?.department,
                        unit: locationStateUser?.unit,
                        email: locationStateUser?.email
                    });
                    setUserAccessError(
                        isHeadUnit
                            ? 'Profile details could not be loaded. Showing report data available to your dashboard access.'
                            : 'Profile details could not be loaded. Showing available report data.'
                    );
                }
            } finally {
                if (isMounted) setResolvingUser(false);
            }
        };

        resolveUserContext();
        return () => { isMounted = false; };
    }, [userId, locationStateUser, users, currentUser, dispatch, isHeadUnit]);

    const resolvedTargetUserId = useMemo(() => {
        return (
            userId?.toString() ||
            selectedUser?.id?.toString() ||
            selectedUser?._id?.toString() ||
            currentUser?.id?.toString() ||
            currentUser?._id?.toString() ||
            null
        );
    }, [userId, selectedUser, currentUser]);

    const handleBackToMain = () => navigate('/emotional-checkin/dashboard');
    const handleBackToPersonal = () => navigate('/emotional-wellness');

    const getUserTitle = (user) => {
        if (!user?.gender) return user?.name || 'User';
        const title = user.gender === 'male' ? 'Mr.' : user.gender === 'female' ? 'Ms.' : '';
        const displayName = user.username || user.name || 'User';
        return title ? `${title} ${displayName}` : displayName;
    };

    return (
        <div className="min-h-screen text-foreground relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-gold/5" />
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_20%,rgba(120,119,198,0.1),transparent_50%)]" />
            <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_80%,rgba(255,215,0,0.05),transparent_50%)]" />

            <div className="relative z-10 container-tight py-4 md:py-6">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="mb-6"
                >
                    <div className="flex items-center justify-between mb-4">
                        <Button
                            variant="ghost"
                            onClick={userId && !cameFromDashboard ? handleBackToPersonal : handleBackToMain}
                            className="flex items-center gap-2 hover:bg-primary/10"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            {userId && !cameFromDashboard ? 'Back to My Dashboard' : 'Back to Main Dashboard'}
                        </Button>

                        <div className="text-right">
                            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary to-gold bg-clip-text text-transparent">
                                {userId ? 'User Report' : 'Individual Dashboard'}
                            </h1>
                            <p className="text-sm text-muted-foreground mt-1">
                                Detailed emotional wellness report
                            </p>
                        </div>
                    </div>

                    <Card className="glass glass-card border-primary/20">
                        <CardContent className="p-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-gold flex items-center justify-center">
                                    <User className="w-6 h-6 text-primary-foreground" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-semibold">
                                        {userId ? `Report for ${getUserTitle(selectedUser)}` : `Welcome back, ${getUserTitle(currentUser)}!`}
                                    </h2>
                                    <p className="text-muted-foreground">
                                        Detailed emotional wellness analysis
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {resolvingUser && !selectedUser && (
                    <div className="mb-6">
                        <Card className="glass glass-card">
                            <CardContent className="py-10 flex items-center justify-center gap-3 text-sm text-muted-foreground">
                                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                                Loading report context...
                            </CardContent>
                        </Card>
                    </div>
                )}

                {userAccessError && userId && !resolvingUser && (
                    <div className="mb-6">
                        <Card className="border-amber-300/40 bg-amber-500/10">
                            <CardContent className="py-5">
                                <p className="text-sm text-amber-700 dark:text-amber-200">{userAccessError}</p>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {(selectedUser || (!userId && currentUser && !userAccessError)) && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                    >
                        <IndividualView
                            selectedUser={selectedUser}
                            targetUserId={resolvedTargetUserId}
                        />
                    </motion.div>
                )}
            </div>
        </div>
    );
});

IndividualDashboard.displayName = 'IndividualDashboard';

export default IndividualDashboard;
