import { useState, memo, Suspense, lazy } from "react";
import { Helmet } from "react-helmet";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import AnimatedPage from "@/components/AnimatedPage";
import DecorativeElements from "@/components/emotion-staff/DecorativeElements";
import { useToast } from "@/components/ui/use-toast";
import { submitCheckin } from "../store/slices/checkinSlice";

// Lazy load components for better performance
const WelcomeSection = lazy(() => import("@/components/emotion-staff/WelcomeSection"));
const WeatherSelector = lazy(() => import("@/components/emotion-staff/WeatherSelector"));
const MoodSelector = lazy(() => import("@/components/emotion-staff/MoodSelector"));
const DetailsInput = lazy(() => import("@/components/emotion-staff/DetailsInput"));
const PresenceSlider = lazy(() => import("@/components/emotion-staff/PresenceSlider"));
const CapacitySlider = lazy(() => import("@/components/emotion-staff/CapacitySlider"));
const SupportSelector = lazy(() => import("@/components/emotion-staff/SupportSelector"));
const SubmitSection = lazy(() => import("@/components/emotion-staff/SubmitSection"));

// Loading fallback component
const ComponentLoader = memo(() => (
    <div className="glass glass-card animate-pulse">
        <div className="glass__refract" />
        <div className="glass__noise" />
        <div className="p-5 md:p-6 space-y-4">
            <div className="h-6 bg-muted/20 rounded animate-pulse" />
            <div className="h-4 bg-muted/20 rounded animate-pulse" />
            <div className="h-32 bg-muted/20 rounded animate-pulse" />
        </div>
    </div>
));

ComponentLoader.displayName = 'ComponentLoader';

const EmotionalCheckinStaffPage = memo(function EmotionalCheckinStaffPage() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { loading } = useSelector((state) => state.checkin);
    const { contacts: supportContacts } = useSelector((state) => state.support);

    const [selectedWeather, setSelectedWeather] = useState(null);
    const [selectedMoods, setSelectedMoods] = useState([]);
    const [details, setDetails] = useState("");
    const [presence, setPresence] = useState([5]);
    const [capacity, setCapacity] = useState([5]);
    const [supportContact, setSupportContact] = useState("");

    const toggleMood = (mood) => {
        setSelectedMoods(prev =>
            prev.includes(mood)
                ? prev.filter(m => m !== mood)
                : [...prev, mood]
        );
    };

    const { toast } = useToast();

    const handleSubmit = async () => {
        if (!selectedWeather || selectedMoods.length === 0) return;

        // Find the selected support contact details
        const selectedContact = supportContacts.find(c => c.name === supportContact);
        const supportContactUserId = selectedContact && selectedContact.id !== "no-need" ? selectedContact.id : null;

        const checkinData = {
            weatherType: selectedWeather,
            selectedMoods,
            details,
            presenceLevel: presence[0],
            capacityLevel: capacity[0],
            supportContactUserId
        };

        console.log('Selected support contact:', selectedContact);
        console.log('Support contact user ID:', supportContactUserId);
        console.log('Support contact name from state:', supportContact);
        console.log('Available support contacts:', supportContacts);
        console.log('Weather type:', selectedWeather);
        console.log('Moods:', selectedMoods);
        console.log('Complete checkin data:', checkinData);

        try {
            const resultAction = await dispatch(submitCheckin(checkinData));

            if (submitCheckin.fulfilled.match(resultAction)) {
                toast({
                    title: "Check-in Submitted Successfully! 🎉",
                    description: "Thank you for sharing your feelings. Your well-being matters to us.",
                    duration: 5000,
                });

                // Navigate to rating page after successful submission
                setTimeout(() => {
                    const checkinId = resultAction.payload.data.checkin.id;
                    console.log('Navigating to rating page after check-in submission:', checkinId);
                    navigate(`/emotional-checkin/rate/${checkinId}`);
                }, 2000);

                // Reset form
                setSelectedWeather(null);
                setSelectedMoods([]);
                setDetails("");
                setPresence([5]);
                setCapacity([5]);
                setSupportContact("");
            } else {
                toast({
                    title: "Submission Failed",
                    description: resultAction.payload || "Please try again. If the problem persists, contact support.",
                    variant: "destructive",
                    duration: 5000,
                });
            }
        } catch (error) {
            toast({
                title: "Submission Error",
                description: "An unexpected error occurred. Please try again.",
                variant: "destructive",
                duration: 5000,
            });
        }
    };

    const isValid = selectedWeather && selectedMoods.length > 0;

    return (
        <AnimatedPage>
            <Helmet>
                <title>Staff Emotional Check-in — MWS</title>
                <meta name="description" content="Daily emotional wellness check-in for Millennia World School staff" />
            </Helmet>

            <div className="staff-orbit-page relative min-h-screen text-foreground overflow-hidden">
                <DecorativeElements />

                <div className="relative z-10 min-h-screen flex items-center justify-center p-4 md:p-6">
                    <div className="w-full max-w-2xl space-y-6 md:space-y-8">
                        <WelcomeSection />

                        <div className="space-y-4 md:space-y-6">
                            <Suspense fallback={<ComponentLoader />}>
                                <WeatherSelector
                                    selectedWeather={selectedWeather}
                                    onWeatherSelect={setSelectedWeather}
                                />
                            </Suspense>

                            <Suspense fallback={<ComponentLoader />}>
                                <MoodSelector
                                    selectedMoods={selectedMoods}
                                    onMoodToggle={toggleMood}
                                />
                            </Suspense>

                            <Suspense fallback={<ComponentLoader />}>
                                <DetailsInput
                                    details={details}
                                    onDetailsChange={setDetails}
                                />
                            </Suspense>

                            <Suspense fallback={<ComponentLoader />}>
                                <PresenceSlider
                                    presence={presence}
                                    onPresenceChange={setPresence}
                                />
                            </Suspense>

                            <Suspense fallback={<ComponentLoader />}>
                                <CapacitySlider
                                    capacity={capacity}
                                    onCapacityChange={setCapacity}
                                />
                            </Suspense>

                            <Suspense fallback={<ComponentLoader />}>
                                <SupportSelector
                                    supportContact={supportContact}
                                    onSupportChange={setSupportContact}
                                />
                            </Suspense>

                            <Suspense fallback={<ComponentLoader />}>
                                <SubmitSection
                                    onSubmit={handleSubmit}
                                    isSubmitting={loading}
                                    isValid={isValid}
                                />
                            </Suspense>
                        </div>
                    </div>
                </div>
            </div>
        </AnimatedPage>
    );
});

EmotionalCheckinStaffPage.displayName = 'EmotionalCheckinStaffPage';
export default EmotionalCheckinStaffPage;
