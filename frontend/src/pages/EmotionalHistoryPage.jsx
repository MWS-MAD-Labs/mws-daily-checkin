import React, { useMemo, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { Helmet } from "react-helmet";
import { getCheckinHistory } from "../store/slices/checkinSlice";
import socketService from "../services/socketService";
import {
    extractUserCheckins,
    getAveragePresence,
    mapReflections,
    resolveTargetUserId,
} from "@/pages/history/emotionalHistoryUtils";
import {
    HistoryHeader,
    HistoryList,
    HistorySummary,
} from "@/pages/history/EmotionalHistorySections";
import DataLoader from "@/components/DataLoader";

const EmotionalHistoryPage = () => {
    const navigate = useNavigate();
    const { userId } = useParams();
    const dispatch = useDispatch();
    const { user: currentUser } = useSelector((state) => state.auth);
    const { checkinHistory, loading } = useSelector((state) => state.checkin);
    const [initialLoad, setInitialLoad] = useState(true);

    const targetUserId = useMemo(
        () => resolveTargetUserId(userId, currentUser),
        [userId, currentUser]
    );

    const userCheckins = useMemo(
        () => extractUserCheckins(checkinHistory, targetUserId),
        [checkinHistory, targetUserId]
    );

    const allReflections = useMemo(
        () => mapReflections(userCheckins),
        [userCheckins]
    );

    useEffect(() => {
        if (!currentUser || !targetUserId) return;

        const fetchData = async () => {
            await dispatch(getCheckinHistory({ page: 1, limit: 50, userId: targetUserId }));
            setInitialLoad(false);
        };

        fetchData();
        socketService.connect();
        socketService.joinPersonal(targetUserId);

        const handleNewCheckin = () => {
            dispatch(getCheckinHistory({ page: 1, limit: 50, userId: targetUserId }));
        };

        socketService.onPersonalNewCheckin(handleNewCheckin);

        return () => {
            socketService.offPersonalNewCheckin(handleNewCheckin);
            socketService.leavePersonal();
        };
    }, [dispatch, currentUser, targetUserId]);

    const container = useMemo(
        () => ({ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0, transition: { staggerChildren: 0.05 } } }),
        []
    );

    const item = useMemo(
        () => ({ hidden: { opacity: 0, y: 6 }, show: { opacity: 1, y: 0, transition: { duration: 0.32 } } }),
        []
    );

    // Show loader during initial data fetch
    if (loading && initialLoad) {
        return (
            <>
                <Helmet>
                    <title>Emotional History — MWS APP</title>
                </Helmet>
                <DataLoader message="Loading emotional history..." fullScreen={true} />
            </>
        );
    }

    return (
        <>
            <Helmet>
                <title>Emotional History — MWS APP</title>
            </Helmet>

            <motion.main initial="hidden" animate="show" variants={container} className="relative min-h-dvh w-full px-4 pb-12 pt-6">
                <div className="mx-auto max-w-md">
                    <HistoryHeader onBack={() => navigate(-1)} itemVariants={item} />
                    <HistoryList reflections={allReflections} itemVariants={item} />
                    <HistorySummary reflections={allReflections} avgPresence={getAveragePresence(allReflections)} itemVariants={item} />
                </div>
            </motion.main>
        </>
    );
};

export default EmotionalHistoryPage;
