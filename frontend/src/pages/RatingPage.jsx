import React, { memo, useState, useEffect, useMemo, lazy, Suspense } from "react";
import { motion } from "framer-motion";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import AnimatedPage from "@/components/AnimatedPage";
import PageLoader from "@/components/PageLoader";
import { Helmet } from "react-helmet";
import { DUMMY_CHECKIN_DATA } from "@/lib/ratingConstants";
import { generateAnalysis, generateRecommendations } from "@/lib/ratingUtils";
import { DecorativeBlobs, GridPattern } from "@/components/rating/DecorativeElements";
import { getTodayCheckin, getCheckinResults, submitCheckin } from "../store/slices/checkinSlice";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Send, Sparkles } from "lucide-react";

// Lazy load components for code splitting
const HeaderSection = lazy(() => import("@/components/rating/HeaderSection"));
const StatusBadge = lazy(() => import("@/components/rating/StatusBadge"));
const MetricsGrid = lazy(() => import("@/components/rating/MetricsGrid"));
const RecommendationCard = lazy(() => import("@/components/rating/RecommendationCard"));
const PsychologicalInsights = lazy(() => import("@/components/rating/PsychologicalInsights"));
const MotivationalMessage = lazy(() => import("@/components/rating/MotivationalMessage"));
const SupportSection = lazy(() => import("@/components/rating/SupportSection"));
const BackHomeButton = lazy(() => import("@/components/rating/BackHomeButton"));
const StudentResultView = lazy(() => import("@/components/rating/student/StudentResultView"));

// ============= MAIN COMPONENT =============
const RatingPage = memo(function RatingPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [userReflection, setUserReflection] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const { checkinId } = useParams();
    const dispatch = useDispatch();
    const { user } = useSelector((state) => state.auth);
    const { checkinResults, currentCheckin, todayCheckin } = useSelector((state) => state.checkin);

    // Use real API data if available, otherwise fall back to location state or dummy data
    const checkInData = useMemo(() => {
        // First priority: Redux state from API results
        if (checkinResults) {
            return {
                name: checkinResults.userId?.name || checkinResults.name || "Staff Member",
                nickname: checkinResults.userId?.nickname || checkinResults.nickname || null,
                weatherType: checkinResults.weatherType,
                selectedMoods: checkinResults.selectedMoods,
                emotionsDetails: checkinResults.details,
                presenceLevel: checkinResults.presenceLevel,
                capacityLevel: checkinResults.capacityLevel,
                supportPerson: checkinResults.supportContact?.name || checkinResults.supportContactUserId?.name || "No Need",
                aiAnalysis: checkinResults.aiAnalysis,
                aiDetected: checkinResults.aiDetected,
                // Add weather report for components that need it
                weatherReport: checkinResults.weatherType ? `${checkinResults.weatherType} – AI analyzed` : "⛅ Partly Cloudy – Doing alright",
                weatherValue: checkinResults.weatherType || "partly-cloudy",
                emotions: checkinResults.selectedMoods || []
            };
        }

        // Second priority: fresh navigation state right after submission
        const locationData = location.state?.checkInData;
        if (locationData) {
            return {
                ...locationData,
                name: locationData.name || "Staff Member",
                emotionsDetails: locationData.emotionsDetails || locationData.details || "",
                supportPerson: locationData.supportPerson || locationData.supportContact?.name || "No Need",
                emotions: locationData.selectedMoods || locationData.emotions || [],
                userReflection: locationData.userReflection || "",
                weatherReport: locationData.weatherReport || `${locationData.weatherType || 'partly-cloudy'} – AI analyzed`,
                weatherType: locationData.weatherType || "partly-cloudy",
                weatherValue: locationData.weatherValue || locationData.weatherType || "partly-cloudy"
            };
        }

        // Third priority: Today's checkin from Redux
        if (todayCheckin) {
            console.log('Using todayCheckin data:', todayCheckin);
            return {
                name: todayCheckin.userId?.name || todayCheckin.name || "Staff Member",
                nickname: todayCheckin.userId?.nickname || todayCheckin.nickname || null,
                weatherType: todayCheckin.weatherType,
                selectedMoods: todayCheckin.selectedMoods || [],
                emotionsDetails: todayCheckin.details || "",
                presenceLevel: todayCheckin.presenceLevel || 5,
                capacityLevel: todayCheckin.capacityLevel || 5,
                supportPerson: todayCheckin.supportContact?.name || todayCheckin.supportContactUserId?.name || "No Need",
                aiAnalysis: todayCheckin.aiAnalysis,
                aiDetected: todayCheckin.aiDetected,
                // Add weather report for components that need it
                weatherReport: todayCheckin.weatherType ? `${todayCheckin.weatherType} – AI analyzed` : "⛅ Partly Cloudy – Doing alright",
                weatherValue: todayCheckin.weatherType || "partly-cloudy",
                emotions: todayCheckin.selectedMoods || []
            };
        }

        // Fourth priority: Current checkin from Redux
        if (currentCheckin) {
            return {
                name: currentCheckin.userId?.name || currentCheckin.name || "Staff Member",
                nickname: currentCheckin.userId?.nickname || currentCheckin.nickname || null,
                weatherType: currentCheckin.weatherType,
                selectedMoods: currentCheckin.selectedMoods,
                emotionsDetails: currentCheckin.details,
                presenceLevel: currentCheckin.presenceLevel,
                capacityLevel: currentCheckin.capacityLevel,
                supportPerson: currentCheckin.supportContact?.name || currentCheckin.supportContactUserId?.name || "No Need",
                aiAnalysis: currentCheckin.aiAnalysis,
                aiDetected: currentCheckin.aiDetected,
                // Add weather report for components that need it
                weatherReport: currentCheckin.weatherType ? `${currentCheckin.weatherType} – AI analyzed` : "⛅ Partly Cloudy – Doing alright",
                weatherValue: currentCheckin.weatherType || "partly-cloudy",
                emotions: currentCheckin.selectedMoods || []
            };
        }

        // Last resort: Dummy data
        return DUMMY_CHECKIN_DATA;
    }, [checkinResults, todayCheckin, currentCheckin, location.state]);

    // Debug logging
    console.log('RatingPage Debug:', {
        checkinResults: !!checkinResults,
        todayCheckin: !!todayCheckin,
        currentCheckin: !!currentCheckin,
        locationState: !!location.state,
        checkInData: checkInData ? {
            weatherType: checkInData.weatherType,
            selectedMoods: checkInData.selectedMoods?.length,
            hasAiAnalysis: !!checkInData.aiAnalysis,
            aiAnalysisKeys: checkInData.aiAnalysis ? Object.keys(checkInData.aiAnalysis) : null
        } : null,
        isLoading,
        dataSource: checkinResults ? 'checkinResults' : todayCheckin ? 'todayCheckin' : currentCheckin ? 'currentCheckin' : location.state?.checkInData ? 'locationState' : 'dummy'
    });

    // Enhanced AI analysis incorporating user reflection for deeper personalization
    const analysis = useMemo(() => {
        if (checkInData.aiAnalysis && checkInData.aiDetected) {
            const baseAnalysis = {
                emotionalState: checkInData.aiAnalysis.emotionalState,
                presenceState: checkInData.aiAnalysis.presenceState,
                capacityState: checkInData.aiAnalysis.capacityState,
                needsSupport: checkInData.aiAnalysis.needsSupport,
                confidence: checkInData.aiAnalysis.confidence,
                psychologicalInsights: checkInData.aiAnalysis.psychologicalInsights,
                motivationalMessage: checkInData.aiAnalysis.motivationalMessage,
                weatherValue: checkInData.weatherValue || checkInData.weatherType,
                // AI-specific fields
                detectedEmotion: checkInData.detectedEmotion,
                valence: checkInData.valence,
                arousal: checkInData.arousal,
                intensity: checkInData.intensity,
                explanations: checkInData.explanations,
                temporalAnalysis: checkInData.temporalAnalysis
            };

            // Enhance analysis with user reflection if available
            if (checkInData.userReflection && checkInData.userReflection.trim()) {
                const userContext = checkInData.userReflection.toLowerCase();
                const detectedEmotion = checkInData.detectedEmotion?.toLowerCase() || 'neutral';

                // Context-aware motivational messages
                const getContextualMotivation = () => {
                    // Work/stress related triggers
                    if (userContext.includes('meeting') || userContext.includes('work') || userContext.includes('stress') || userContext.includes('deadline')) {
                        if (detectedEmotion.includes('anxious') || detectedEmotion.includes('stressed')) {
                            return "Remember that your dedication to excellence is what makes you so valuable. Take a moment to breathe and know that you've handled challenging situations before - you have the strength to navigate this too.";
                        } else if (detectedEmotion.includes('tired') || detectedEmotion.includes('exhausted')) {
                            return "Your commitment to your work is truly admirable. In moments like these, remember that rest isn't weakness - it's the wisdom that allows you to bring your best self to everything you do.";
                        }
                    }

                    // Relationship/family triggers
                    if (userContext.includes('family') || userContext.includes('friend') || userContext.includes('relationship') || userContext.includes('partner')) {
                        if (detectedEmotion.includes('sad') || detectedEmotion.includes('lonely')) {
                            return "The depth of love and connection you feel for others is one of your greatest strengths. Even in difficult moments, this capacity for caring shows what a beautiful heart you have.";
                        } else if (detectedEmotion.includes('happy') || detectedEmotion.includes('grateful')) {
                            return "The relationships that bring you joy are treasures worth celebrating. Your ability to connect deeply with others is a gift not just to them, but to your own soul as well.";
                        }
                    }

                    // Personal growth/health triggers
                    if (userContext.includes('health') || userContext.includes('tired') || userContext.includes('sick') || userContext.includes('rest')) {
                        if (detectedEmotion.includes('anxious') || detectedEmotion.includes('worried')) {
                            return "Your awareness of your body's needs shows such self-compassion. Trust that you're capable of nurturing yourself through this. Your body and mind work together beautifully when given the care they deserve.";
                        } else if (detectedEmotion.includes('calm') || detectedEmotion.includes('peaceful')) {
                            return "What a beautiful act of self-love it is to listen to your body's wisdom. This awareness and care you show yourself will serve you beautifully in all areas of your life.";
                        }
                    }

                    // Achievement/success triggers
                    if (userContext.includes('success') || userContext.includes('achievement') || userContext.includes('proud') || userContext.includes('accomplish')) {
                        if (detectedEmotion.includes('happy') || detectedEmotion.includes('excited')) {
                            return "Your ability to recognize and celebrate your achievements shows such healthy self-awareness. This joy in your accomplishments is well-earned and beautifully deserved.";
                        } else if (detectedEmotion.includes('overwhelmed') || detectedEmotion.includes('anxious')) {
                            return "Even in moments of pressure, your drive for excellence shines through. Remember that your worth isn't measured by perfection, but by the beautiful effort you bring to everything you do.";
                        }
                    }

                    // Default contextual motivation based on emotion
                    if (detectedEmotion.includes('happy') || detectedEmotion.includes('joy')) {
                        return "Whatever is bringing this light to your eyes, may it continue to nourish your spirit. Your capacity for joy is a beautiful gift to yourself and everyone around you.";
                    } else if (detectedEmotion.includes('sad') || detectedEmotion.includes('challenging')) {
                        return "Your willingness to feel deeply, even when it brings sadness, shows what a beautifully sensitive soul you are. This emotional depth is a strength, not a weakness.";
                    } else if (detectedEmotion.includes('anxious') || detectedEmotion.includes('worried')) {
                        return "Your awareness of uncertainty shows how deeply you care about navigating life thoughtfully. This mindfulness, even when it brings anxiety, is a sign of your wisdom and care.";
                    } else {
                        return "Whatever you're experiencing right now, know that your feelings are valid and important. Your emotional awareness is a beautiful strength that helps you live authentically.";
                    }
                };

                // Enhance psychological insights with user context
                const getEnhancedInsights = () => {
                    const baseInsight = checkInData.aiAnalysis.psychologicalInsights;
                    const contextKeywords = userContext.split(' ').filter(word => word.length > 3);

                    // Add contextual depth based on user reflection
                    let enhancedInsight = baseInsight;

                    if (contextKeywords.some(word => ['meeting', 'presentation', 'deadline', 'work'].includes(word))) {
                        enhancedInsight += " The professional demands you're navigating show your dedication and capability. Even when these responsibilities feel heavy, they also reflect the trust others place in your abilities.";
                    } else if (contextKeywords.some(word => ['family', 'children', 'partner', 'relationship'].includes(word))) {
                        enhancedInsight += " The connections that matter to you speak to your capacity for deep, meaningful relationships. This emotional investment, while sometimes challenging, is also what makes life rich and beautiful.";
                    } else if (contextKeywords.some(word => ['tired', 'exhausted', 'rest', 'sleep'].includes(word))) {
                        enhancedInsight += " Your body's signals for rest are wisdom speaking. In our achievement-oriented world, listening to these needs takes courage and shows true self-awareness.";
                    } else if (contextKeywords.some(word => ['grateful', 'thankful', 'blessed', 'appreciate'].includes(word))) {
                        enhancedInsight += " Your ability to recognize and appreciate life's blessings, even amidst challenges, is a beautiful emotional strength that nourishes both you and those around you.";
                    }

                    return enhancedInsight;
                };

                return {
                    ...baseAnalysis,
                    motivationalMessage: getContextualMotivation(),
                    psychologicalInsights: getEnhancedInsights()
                };
            }

            return baseAnalysis;
        }
        // Only use template analysis if no AI data is available
        return generateAnalysis(checkInData);
    }, [checkInData]);

    const recommendations = useMemo(() => {
        if (checkInData.aiAnalysis?.recommendations) {
            // Map API recommendations to component format
            return checkInData.aiAnalysis.recommendations.map(rec => ({
                title: rec.title,
                description: rec.description,
                priority: rec.priority,
                category: rec.category,
                icon: getIconForCategory(rec.category),
                color: getColorForPriority(rec.priority),
                borderColor: getBorderForPriority(rec.priority)
            }));
        }
        return generateRecommendations(analysis, checkInData);
    }, [analysis, checkInData]);

    const isStudent = user?.role === "student";

    const studentAnalysis = useMemo(() => {
        const ai = checkInData?.aiAnalysis || {};
        return {
            emotionalState: ai.emotionalState || analysis?.emotionalState || "balanced",
            presenceState: ai.presenceState || analysis?.presenceState || "moderate",
            capacityState: ai.capacityState || analysis?.capacityState || "moderate",
            needsSupport: typeof ai.needsSupport === "boolean" ? ai.needsSupport : !!analysis?.needsSupport,
            confidence: ai.confidence || analysis?.confidence || 75,
            psychologicalInsights: ai.psychologicalInsights || analysis?.psychologicalInsights || "You are building emotional awareness, and that is a strong skill.",
            motivationalMessage: ai.motivationalMessage || analysis?.motivationalMessage || "Your feelings matter. Small positive steps still count.",
            weatherValue: checkInData?.weatherValue || checkInData?.weatherType || analysis?.weatherValue || "partly-cloudy"
        };
    }, [analysis, checkInData]);

    const studentRecommendations = useMemo(() => {
        const aiRecs = Array.isArray(checkInData?.aiAnalysis?.recommendations)
            ? checkInData.aiAnalysis.recommendations
            : [];
        if (aiRecs.length) {
            return aiRecs.slice(0, 4).map((rec) => ({
                title: rec.title,
                description: rec.description,
                priority: rec.priority,
                category: rec.category || "mindfulness"
            }));
        }

        const fallback = [
            {
                title: "Breathe and Reset",
                description: "Take 5 slow breaths. Inhale for 4 counts and exhale for 6 counts.",
                category: "mindfulness",
                priority: "medium"
            },
            {
                title: "One Small Task",
                description: "Complete one simple school task first to make progress feel easier.",
                category: "school",
                priority: "medium"
            },
            {
                title: "Kind Self-Talk",
                description: "Say one kind sentence to yourself, like “I can do this step by step.”",
                category: "self-care",
                priority: "low"
            },
            {
                title: "Reach Out for Support",
                description: "Talk to your trusted adult at school when you need help.",
                category: "connection",
                priority: "high"
            }
        ];

        if (!studentAnalysis.needsSupport) {
            fallback[3] = {
                title: "Share One Good Thing",
                description: "Tell someone one positive thing from your day to strengthen your mood.",
                category: "connection",
                priority: "low"
            };
        }

        return fallback;
    }, [checkInData?.aiAnalysis?.recommendations, studentAnalysis.needsSupport]);

    // Helper functions for mapping API data to component format
    function getIconForCategory(category) {
        const iconMap = {
            professional: "Target",
            social: "Heart",
            personal: "Brain",
            health: "Battery"
        };
        return iconMap[category] || "Sparkles";
    }

    function getColorForPriority(priority) {
        const colorMap = {
            high: "from-accent/20 to-accent/10",
            medium: "from-primary/20 to-primary/10",
            low: "from-emerald/20 to-emerald/10"
        };
        return colorMap[priority] || "from-primary/20 to-primary/10";
    }

    function getBorderForPriority(priority) {
        const borderMap = {
            high: "border-accent/30",
            medium: "border-primary/20",
            low: "border-emerald/20"
        };
        return borderMap[priority] || "border-primary/20";
    }

    useEffect(() => {
        if (location.state?.checkInData) {
            setIsLoading(false);
            return;
        }

        console.log('RatingPage useEffect triggered:', {
            checkinId,
            checkinResults: !!checkinResults,
            todayCheckin: !!todayCheckin,
            locationState: location.state
        });

        // Priority: URL param checkinId > location state checkinId > today's checkin
        const targetCheckinId = checkinId || location.state?.checkinId;

        if (targetCheckinId && !checkinResults) {
            console.log('Fetching specific checkin results for ID:', targetCheckinId);
            dispatch(getCheckinResults(targetCheckinId)).then((result) => {
                console.log('getCheckinResults result:', result);
                console.log('getCheckinResults payload:', result.payload);
                setIsLoading(false);
            }).catch((error) => {
                console.error('getCheckinResults error:', error);
                setIsLoading(false);
            });
        } else if (!checkinResults && !todayCheckin) {
            console.log('No specific ID, fetching today\'s checkin');
            dispatch(getTodayCheckin()).then((result) => {
                console.log('getTodayCheckin result:', result);
                console.log('getTodayCheckin payload:', result.payload);
                setIsLoading(false);
            }).catch((error) => {
                console.error('getTodayCheckin error:', error);
                setIsLoading(false);
            });
        } else {
            console.log('Data already available, skipping API call');
            setIsLoading(false);
        }
    }, [dispatch, checkinResults, todayCheckin, checkinId, location.state]);

    // Show loading if we're still fetching data and have no data yet
    if (isLoading && !checkinResults && !todayCheckin && !currentCheckin) {
        return <PageLoader />;
    }

    if (isStudent) {
        return (
            <AnimatedPage>
                <Helmet>
                    <title>My Emotional Result — Millennia World School</title>
                    <meta name="description" content="Student emotional wellbeing result and supportive recommendations" />
                </Helmet>
                <Suspense fallback={<PageLoader />}>
                    <StudentResultView
                        checkInData={checkInData}
                        analysis={studentAnalysis}
                        recommendations={studentRecommendations}
                        displayName={user?.nickname || checkInData?.nickname || checkInData?.name}
                    />
                </Suspense>
            </AnimatedPage>
        );
    }

    // Handle submission of user reflection with enhanced AI analysis
    const handleSubmitReflection = async () => {
        if (!userReflection.trim()) return;

        setIsSubmitting(true);
        try {
            // Update the checkInData with user reflection
            const updatedCheckInData = {
                ...checkInData,
                userReflection: userReflection.trim(),
                // Enhanced AI analysis will be generated in the backend based on user reflection
                aiAnalysis: {
                    ...checkInData.aiAnalysis,
                    // The backend will enhance these based on user reflection
                    enhancedWithUserContext: true
                }
            };

            // Submit the check-in with user reflection for AI enhancement
            await dispatch(submitCheckin(updatedCheckInData));

            // Navigate to dashboard or show success
            navigate('/emotional-checkin/dashboard');
        } catch (error) {
            console.error('Error submitting reflection:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <AnimatedPage>
            <Helmet>
                <title>Emotional Wellness Results — Millennia World School</title>
                <meta name="description" content="Your personalized emotional wellness analysis and recommendations" />
            </Helmet>

            <div className="relative min-h-screen text-foreground overflow-hidden">
                <DecorativeBlobs />
                <GridPattern />

                <div className="relative z-10 min-h-screen flex items-center justify-center py-8 md:py-12 px-4 md:px-6">
                    <div className="w-full max-w-5xl space-y-6 md:space-y-8">
                        <Suspense fallback={<div className="h-32 animate-pulse bg-muted/20 rounded-lg" />}>
                            <HeaderSection name={checkInData.name} analysis={analysis} />
                        </Suspense>
                        <Suspense fallback={<div className="h-16 animate-pulse bg-muted/20 rounded-lg" />}>
                            <StatusBadge analysis={analysis} />
                        </Suspense>
                        <Suspense fallback={<div className="h-40 animate-pulse bg-muted/20 rounded-lg" />}>
                            <MetricsGrid data={checkInData} analysis={analysis} />
                        </Suspense>

                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.6, delay: 0.7 }}
                            className="space-y-4 md:space-y-6 px-2"
                        >
                            <motion.h2
                                className="text-lg md:text-2xl font-semibold text-foreground text-center"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.75, duration: 0.5 }}
                            >
                                Personalized Recommendations
                            </motion.h2>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-5">
                                {recommendations.map((rec, index) => (
                                    <Suspense key={index} fallback={<div className="h-32 animate-pulse bg-muted/20 rounded-lg" />}>
                                        <RecommendationCard recommendation={rec} index={index} />
                                    </Suspense>
                                ))}
                            </div>
                        </motion.div>

                        <Suspense fallback={<div className="h-32 animate-pulse bg-muted/20 rounded-lg" />}>
                            <PsychologicalInsights
                                insights={checkInData.aiAnalysis?.psychologicalInsights || analysis.psychologicalInsights}
                                confidence={checkInData.aiAnalysis?.confidence || analysis.confidence}
                            />
                        </Suspense>

                        <Suspense fallback={<div className="h-24 animate-pulse bg-muted/20 rounded-lg" />}>
                            <MotivationalMessage
                                message={checkInData.aiAnalysis?.motivationalMessage || analysis.motivationalMessage}
                            />
                        </Suspense>

                        <Suspense fallback={<div className="h-24 animate-pulse bg-muted/20 rounded-lg" />}>
                            <SupportSection
                                supportPerson={checkInData.supportPerson}
                                needsSupport={analysis.needsSupport}
                                motivationalMessage={checkInData.aiAnalysis?.motivationalMessage || analysis.motivationalMessage}
                            />
                        </Suspense>

                        <Suspense fallback={<div className="h-16 animate-pulse bg-muted/20 rounded-lg" />}>
                            <BackHomeButton />
                        </Suspense>
                    </div>
                </div>
            </div>
        </AnimatedPage>
    );
});

RatingPage.displayName = 'RatingPage';

export default RatingPage;
