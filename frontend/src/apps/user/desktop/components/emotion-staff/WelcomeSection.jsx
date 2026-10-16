import React, { memo } from "react";
import { Heart, Sparkles } from "lucide-react";

const DecorativeBlobs = memo(() => (
    <>
        <div className="absolute -top-20 -left-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -top-10 -right-20 w-56 h-56 bg-gold/5 rounded-full blur-3xl pointer-events-none" />
    </>
));

const IconBadge = memo(() => (
    <div className="flex justify-center">
        <div className="relative">
            <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
            <div className="absolute inset-0 rounded-full bg-primary/10 animate-pulse" />
            <div className="relative w-14 h-14 md:w-16 md:h-16 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 flex items-center justify-center shadow-lg shadow-primary/10 transition-all duration-300 hover:scale-110 hover:shadow-xl hover:shadow-primary/20">
                <Heart className="w-7 h-7 md:w-8 md:h-8 text-primary" fill="currentColor" />
            </div>
        </div>
    </div>
));

const Header = memo(() => (
    <div className="text-center space-y-3">
        <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground tracking-tight">
            Daily Wellness Check-in
        </h1>
        <p className="text-sm md:text-base text-muted-foreground">
            Supporting your emotional well-being
        </p>
    </div>
));

const Divider = memo(() => (
    <div className="flex items-center justify-center gap-3 py-2">
        <div className="h-px w-12 md:w-16 bg-gradient-to-r from-transparent via-border to-transparent" />
        <Sparkles className="w-4 h-4 text-gold" />
        <div className="h-px w-12 md:w-16 bg-gradient-to-r from-transparent via-border to-transparent" />
    </div>
));

const MainContent = memo(() => (
    <div className="space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/5 border border-primary/10">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-xs md:text-sm font-medium text-primary">
                Dear MWS Team
            </span>
        </div>
        <p className="text-sm md:text-base text-foreground leading-relaxed">
            We understand that working in education brings both rewards and challenges.
            This form helps you{" "}
            <span className="font-semibold text-primary">reflect on your emotions</span>,
            identify triggers, and develop coping strategies quickly.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3 pt-2">
            <div className="p-3 rounded-lg bg-emerald/5 border border-emerald/10 transition-all duration-300 hover:bg-emerald/10 hover:border-emerald/20">
                <div className="text-xl md:text-2xl mb-1">🧠</div>
                <p className="text-xs md:text-sm font-medium text-foreground">Emotional Intelligence</p>
            </div>
            <div className="p-3 rounded-lg bg-gold/5 border border-gold/10 transition-all duration-300 hover:bg-gold/10 hover:border-gold/20">
                <div className="text-xl md:text-2xl mb-1">💡</div>
                <p className="text-xs md:text-sm font-medium text-foreground">Self-Awareness</p>
            </div>
            <div className="col-span-2 md:col-span-1 p-3 rounded-lg bg-primary/5 border border-primary/10 transition-all duration-300 hover:bg-primary/10 hover:border-primary/20">
                <div className="text-xl md:text-2xl mb-1">🌱</div>
                <p className="text-xs md:text-sm font-medium text-foreground">Mental Health</p>
            </div>
        </div>
        <div className="pt-4 border-t border-border/50">
            <p className="text-xs md:text-sm text-muted-foreground leading-relaxed mb-3">
                Your well-being is our priority. This tool contributes to a more positive
                and resilient school community.
            </p>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-surface/50 border border-border/50">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-gold/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-primary">MB</span>
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">Mahrukh Bashir</p>
                    <p className="text-xs text-muted-foreground">Director, Millennia World School</p>
                </div>
            </div>
        </div>
    </div>
));

const CallToAction = memo(() => (
    <div className="pt-2">
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald animate-pulse" />
            <span>Ready to share how you're feeling today?</span>
        </div>
    </div>
));

const WelcomeSection = memo(() => (
    <div className="relative">
        <DecorativeBlobs />
        <div className="glass glass--frosted glass--deep">
            <div className="glass__refract" />
            <div className="glass__refract--soft" />
            <div className="glass__noise" />
            <div className="relative z-10 p-6 md:p-8 space-y-6">
                <IconBadge />
                <Header />
                <Divider />
                <MainContent />
                <CallToAction />
            </div>
        </div>
    </div>
));

WelcomeSection.displayName = 'WelcomeSection';
export default WelcomeSection;