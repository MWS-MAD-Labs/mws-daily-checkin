import { useCallback, useEffect, useState } from "react";
import { generateAIAnalysis } from "@/pages/verification/utils/generateAIAnalysis";

const ANALYSIS_TIMEOUT_MS = 20000;

export const useEmotionAnalysis = ({ toast, setStage, fallbackStage = "intro" }) => {
    const [analysis, setAnalysis] = useState(null);
    const [selectedSupportContact, setSelectedSupportContact] = useState(null);
    const [aiEmotionResult, setAiEmotionResult] = useState(null);

    const finalizeAnalysis = useCallback((emotionResult) => {
        if (!emotionResult) {
            return;
        }

        try {
            const finalAnalysis = generateAIAnalysis(emotionResult);
            finalAnalysis.aiEmotionScan = {
                valence: emotionResult.valence,
                arousal: emotionResult.arousal,
                intensity: emotionResult.intensity,
                detectedEmotion: emotionResult.primaryEmotion,
                confidence: emotionResult.confidence,
                explanations: emotionResult.explanations,
                temporalAnalysis: emotionResult.temporalAnalysis,
                emotionalAuthenticity: emotionResult.emotionalAuthenticity,
                psychologicalDepth: emotionResult.psychologicalDepth
            };
            finalAnalysis.selectedSupportContact = selectedSupportContact;
            finalAnalysis.isSubmitting = false;
            setAnalysis(finalAnalysis);
            setStage("results");
        } catch (error) {
            console.error("Failed to generate AI analysis:", error);
            toast?.({
                title: "Analysis Failed",
                description: "Unable to process AI emotion analysis. Please try again.",
                variant: "destructive"
            });
            setStage(fallbackStage);
        }
    }, [fallbackStage, selectedSupportContact, setStage, toast]);

    const analyzePhoto = useCallback(async (imageSource) => {
        let timeoutId;
        try {
            setAiEmotionResult(null);
            setAnalysis(null);
            setStage("analyzing");

            let blob = imageSource;
            if (!(blob instanceof Blob)) {
                const response = await fetch(imageSource);
                blob = await response.blob();
            }

            const formData = new FormData();
            formData.append("image", blob, "emotion_capture.jpg");

            const apiBase = import.meta.env.VITE_API_BASE || "/api/v1";
            const controller = new AbortController();
            timeoutId = window.setTimeout(() => controller.abort(), ANALYSIS_TIMEOUT_MS);
            const apiResponse = await fetch(`${apiBase}/checkin/emotion/analyze`, {
                method: "POST",
                body: formData,
                signal: controller.signal
            });

            if (!apiResponse.ok) {
                throw new Error("Emotion analysis API failed");
            }

            const result = await apiResponse.json();
            const emotionResult = result.data?.emotionResult || result.emotionResult;

            if (!emotionResult) {
                throw new Error("Invalid emotion analysis response format - no emotionResult found");
            }

            setAiEmotionResult(emotionResult);
            finalizeAnalysis(emotionResult);
        } catch (error) {
            console.error("Emotion analysis failed:", error);
            const isNetworkError =
                error?.message?.includes("Failed to fetch") ||
                error?.name === "TypeError";
            const isTimeout = error?.name === "AbortError";
            toast?.({
                title: "Analysis Failed",
                description: isTimeout
                    ? "AI analysis took too long. Please try again or continue with manual check-in."
                    : isNetworkError
                    ? "Backend API is unreachable. Make sure backend is running, then try again."
                    : "Unable to perform AI emotion analysis. Please try again.",
                variant: "destructive"
            });
            setStage(fallbackStage);
        } finally {
            if (timeoutId) {
                window.clearTimeout(timeoutId);
            }
        }
    }, [fallbackStage, finalizeAnalysis, setStage, toast]);

    useEffect(() => {
        setAnalysis((prev) => {
            if (!prev) {
                return prev;
            }
            return { ...prev, selectedSupportContact };
        });
    }, [selectedSupportContact]);

    return {
        analysis,
        setAnalysis,
        analyzePhoto,
        aiEmotionResult,
        selectedSupportContact,
        setSelectedSupportContact
    };
};
