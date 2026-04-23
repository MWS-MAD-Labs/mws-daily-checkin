import { useCallback, useState } from "react";
import authService from "@/services/authService";

const getSupportBand = (value) => {
    const score = Number(value);
    if (score >= 7) return "high";
    if (score >= 4) return "moderate";
    return "low";
};

const getEmotionalState = ({ detectedEmotion, valence, presenceLevel, capacityLevel, needsSupport }) => {
    if (presenceLevel <= 3 || capacityLevel <= 3) return "depleted";
    if (needsSupport || valence < -0.05) return "challenging";
    if (valence > 0.2 && /happy|joy|calm|content|positive/i.test(detectedEmotion || "")) return "positive";
    return "balanced";
};

const buildPreparedAiAnalysis = (analysis) => {
    const presenceLevel = Number(analysis?.presenceCapacity?.estimatedPresence) || 7;
    const capacityLevel = Number(analysis?.presenceCapacity?.estimatedCapacity) || 7;
    const derivedNeedsSupport = presenceLevel < 5 || capacityLevel < 5;
    const needsSupport = Boolean(analysis?.supportCompass?.needsSupport ?? derivedNeedsSupport);

    return {
        emotionalState: getEmotionalState({
            detectedEmotion: analysis?.detectedEmotion,
            valence: Number(analysis?.valence) || 0,
            presenceLevel,
            capacityLevel,
            needsSupport
        }),
        presenceState: getSupportBand(presenceLevel),
        capacityState: getSupportBand(capacityLevel),
        recommendations: Array.isArray(analysis?.detailedRecommendations)
            ? analysis.detailedRecommendations.slice(0, 5).map((rec) => ({
                title: rec?.title || "Supportive next step",
                description: rec?.description || "",
                priority: rec?.priority || "medium",
                category: rec?.category || "support"
            }))
            : [],
        psychologicalInsights: String(analysis?.psychologicalInsight || "").trim(),
        motivationalMessage: String(analysis?.personalizedRecommendation || "").trim(),
        needsSupport,
        confidence: Number(analysis?.confidence) || 75
    };
};

export const useCheckinSubmission = ({
    analysis,
    selectedSupportContact,
    supportContacts,
    toast,
    navigate
}) => {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const completeCheckin = useCallback(async () => {
        if (!analysis) {
            toast?.({
                title: "Analysis Missing",
                description: "Please run the AI scan before completing the check-in.",
                variant: "destructive"
            });
            return;
        }

        setIsSubmitting(true);
        try {
            const token = localStorage.getItem("auth_token") || localStorage.getItem("token");

            if (!token) {
                toast?.({
                    title: "Login Required",
                    description: "Please log in to save your AI emotion check-in.",
                    variant: "destructive"
                });
                navigate("/");
                return;
            }

            const normalizedSupportSelection = String(selectedSupportContact || "").trim().toLowerCase();
            const isNoNeedSelection = !normalizedSupportSelection ||
                normalizedSupportSelection === "no need" ||
                normalizedSupportSelection === "no-need" ||
                normalizedSupportSelection === "no_need";

            let supportContactUserId = null;
            if (!isNoNeedSelection) {
                const selectedContact = supportContacts.find(
                    (contact) =>
                        contact.name === selectedSupportContact || contact.id === selectedSupportContact
                );
                if (selectedContact?.id && selectedContact.id !== "no-need" && selectedContact.id !== "no_need") {
                    supportContactUserId = selectedContact.id;
                }
            }

            const userReflection = String(analysis.userReflection || "").trim();
            const preparedAiAnalysis = buildPreparedAiAnalysis(analysis);

            const checkInData = {
                detectedEmotion: analysis.detectedEmotion,
                confidence: analysis.confidence || 75,
                selectedMoods: analysis.selfreportedEmotions || [],
                details: userReflection,
                userReflection,
                presenceLevel: analysis.presenceCapacity?.estimatedPresence || 7,
                capacityLevel: analysis.presenceCapacity?.estimatedCapacity || 7,
                selectedSupportContact: selectedSupportContact || "No Need",
                supportContactUserId,
                weatherType: analysis.internalWeather || analysis.weatherDesc || "AI Generated Weather",
                weatherIcon: analysis.weatherIcon || "☀️",
                weatherDescription: analysis.weatherDesc || "",
                preparedAiAnalysis,
                needsSupport: preparedAiAnalysis.needsSupport
            };

            const response = await authService.post("/checkin/ai-submit", checkInData);
            const result = response.data;
            const returnedCheckin = result.data?.checkin || result.checkin || null;
            const checkinId =
                returnedCheckin?.id ||
                returnedCheckin?._id;

            if (checkinId) {
                navigate(`/emotional-checkin/rate/${checkinId}`, {
                    state: returnedCheckin
                        ? {
                            checkinId,
                            checkInData: {
                                ...returnedCheckin,
                                aiDetected: true,
                                userReflection,
                                supportPerson: returnedCheckin.supportContact?.name || "No Need",
                                emotionsDetails: returnedCheckin.details || "",
                                emotions: returnedCheckin.selectedMoods || [],
                                weatherValue: returnedCheckin.weatherType || "partly-cloudy"
                            }
                        }
                        : undefined
                });
            } else {
                navigate("/emotional-checkin/rate");
            }
        } catch (error) {
            const errorMessage =
                error.response?.data?.message || error.message || "Unable to save your check-in.";
            toast?.({
                title: "Save Failed",
                description: errorMessage,
                variant: "destructive"
            });
        } finally {
            setIsSubmitting(false);
        }
    }, [analysis, navigate, selectedSupportContact, supportContacts, toast]);

    return { isSubmitting, completeCheckin };
};
