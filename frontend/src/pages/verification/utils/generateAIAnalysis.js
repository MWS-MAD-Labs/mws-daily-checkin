export const generateAIAnalysis = (emotionData) => {
    const primaryEmotion = emotionData.primaryEmotion;
    const confidence = emotionData.confidence;
    const valence = emotionData.valence;
    const arousal = emotionData.arousal;
    const intensity = emotionData.intensity;
    const explanations = emotionData.explanations;

    // AI-generated emotion labels based on actual data
    const emotionLabels = {
        happy: valence > 0.5 && arousal > 0.3 ? 'Genuine Joy' :
            valence > 0.3 && arousal > 0.2 ? 'Positive Engagement' : 'Content Satisfaction',
        sad: valence < -0.3 && arousal < 0.2 ? 'Deep Melancholy' :
            valence < -0.1 && arousal < 0.3 ? 'Subdued Reflection' : 'Quiet Contemplation',
        angry: arousal > 0.7 && valence < -0.2 ? 'Intense Frustration' :
            arousal > 0.5 && valence < -0.1 ? 'Building Tension' : 'Mild Irritation',
        surprised: arousal > 0.6 && valence > 0.1 ? 'Sudden Amazement' :
            arousal > 0.4 ? 'Unexpected Interest' : 'Mild Curiosity',
        fearful: arousal > 0.6 && valence < -0.3 ? 'Acute Anxiety' :
            arousal > 0.4 && valence < -0.1 ? 'Underlying Worry' : 'Subtle Concern',
        disgusted: valence < -0.4 && arousal > 0.2 ? 'Strong Aversion' :
            valence < -0.2 ? 'Mild Discomfort' : 'Subtle Disapproval',
        neutral: Math.abs(valence) < 0.2 && Math.abs(arousal) < 0.3 ? 'Balanced Composure' :
            Math.abs(valence) < 0.3 ? 'Steady Equilibrium' : 'Measured Neutrality',
        anxious: arousal > 0.5 && valence < 0 ? 'Heightened Unease' :
            arousal > 0.3 ? 'Subtle Restlessness' : 'Mild Apprehension',
        calm: arousal < 0.2 && valence > -0.1 ? 'Serene Tranquility' :
            arousal < 0.3 && valence > -0.2 ? 'Peaceful Composure' : 'Gentle Stillness'
    };

    // AI-generated weather mappings based on emotional dimensions
    const weatherMappings = {
        // High valence, high arousal
        happy_high: { icon: '☀️', internal: 'Bright Sunshine', desc: 'Radiant energy and clear emotional skies' },
        // High valence, low arousal
        happy_low: { icon: '🌤️', internal: 'Gentle Sunshine', desc: 'Warm contentment with peaceful clarity' },
        // Low valence, high arousal
        negative_high: { icon: '⛈️', internal: 'Stormy Turbulence', desc: 'Emotional intensity with challenging undercurrents' },
        // Low valence, low arousal
        negative_low: { icon: '☁️', internal: 'Overcast Calm', desc: 'Subdued atmosphere with emotional weight' },
        // Neutral range
        neutral: { icon: '⛅', internal: 'Balanced Skies', desc: 'Steady emotional weather with moderate clarity' }
    };

    // Determine weather category based on valence and arousal
    let weatherKey = 'neutral';
    if (valence > 0.2 && arousal > 0.4) weatherKey = 'happy_high';
    else if (valence > 0.1 && arousal < 0.4) weatherKey = 'happy_low';
    else if (valence < -0.1 && arousal > 0.4) weatherKey = 'negative_high';
    else if (valence < 0 && arousal < 0.4) weatherKey = 'negative_low';

    const weather = weatherMappings[weatherKey];

    const detectMaskedEmotion = ({ primaryEmotion, valence, arousal, intensity, explanations = [] }) => {
        const cues = [];
        let score = 0;
        let inferredHidden = null;
        const surfacePositive = ["happy", "calm", "surprised", "neutral"].includes(primaryEmotion);
        const lowValence = valence < 0.1;
        const highArousal = arousal > 0.55;
        const lowIntensity = intensity < 35;
        const tensionCue = explanations.some((exp) =>
            /tension|tight|furrow|strain|fatigue|micro-twitch|jaw/i.test(exp)
        );

        if (surfacePositive && lowValence) {
            score += 0.4;
            inferredHidden = inferredHidden || "emotional fatigue";
            cues.push("Outer expression looks bright, yet valence drops into a heavier range.");
        }

        if (surfacePositive && highArousal && valence < 0.2) {
            score += 0.25;
            inferredHidden = inferredHidden || "quiet overwhelm";
            cues.push("Physiological arousal spikes while the visible expression stays composed.");
        }

        if (lowIntensity) {
            score += 0.2;
            inferredHidden = inferredHidden || "low energy";
            cues.push("Micro-expression intensity is fading, hinting at exhaustion underneath.");
        }

        if (tensionCue) {
            score += 0.25;
            inferredHidden = inferredHidden || "suppressed concern";
            cues.push("Subtle muscular tension is showing up around the eyes or jaw.");
        }

        const isMasked = score >= 0.5;
        return {
            isMasked,
            maskScore: Math.min(score, 1),
            hiddenEmotionLabel: inferredHidden || (lowValence ? "subtle sadness" : "mixed emotions"),
            signals: cues
        };
    };

    const authenticity = detectMaskedEmotion({ primaryEmotion, valence, arousal, intensity, explanations });

    // Generate AI-driven micro-expressions from actual explanations
    const microExpressions = explanations.map(exp => {
        // Extract key facial indicators from AI explanations
        if (exp.toLowerCase().includes('mouth') || exp.toLowerCase().includes('smile')) return 'Mouth positioning and curvature';
        if (exp.toLowerCase().includes('eye') || exp.toLowerCase().includes('brow')) return 'Eye and eyebrow dynamics';
        if (exp.toLowerCase().includes('muscle') || exp.toLowerCase().includes('tension')) return 'Facial muscle activation patterns';
        if (exp.toLowerCase().includes('expression') || exp.toLowerCase().includes('facial')) return 'Overall facial expression coherence';
        return 'Subtle facial movement indicators';
    }).slice(0, 4);

    // Generate psychologist-like, personal psychological insight
    const getPsychologistInsight = (primaryEmotion, valence, arousal, intensity, confidence, authenticityData) => {
        const insights = {
            neutral: [
                `I notice you're carrying yourself with remarkable composure right now. That subtle neutrality in your expression speaks volumes about your emotional resilience - you're neither overwhelmed nor disengaged, but perfectly balanced in this present moment.`,
                `Your neutral expression tells me you're in a state of quiet observation. This isn't emotional flatness, but rather a mindful presence that allows you to process your experiences without being swept away by them.`,
                `What beautiful emotional equilibrium I see in your face. You're maintaining that perfect balance between engagement and peace, showing me you have excellent self-regulation skills.`,
                `There's a calm steadiness in your expression that suggests you're grounded and centered. This balanced state is actually a powerful place to be - neither pushed nor pulled by strong emotions.`,
                `I see a thoughtful neutrality in your features. You seem to be in that valuable space between emotional extremes, able to observe and respond rather than react.`,
                `Your expression shows a peaceful middle ground. This kind of emotional balance is a strength - it means you're present without being overwhelmed by any particular feeling.`,
                `There's a quiet clarity in your face right now. You're demonstrating that beautiful ability to hold space for whatever arises without getting swept up in it.`,
                `I notice you're in a state of gentle equilibrium. This isn't numbness - it's the kind of balanced awareness that allows for clear thinking and thoughtful responses.`,
                `Your features reflect a calm centeredness. You're showing that rare capacity to be fully present while maintaining emotional steadiness.`,
                `There's an admirable composure in your expression. You seem to be navigating this moment with a balanced perspective that serves you well.`,
                `I see a serene neutrality that speaks to your emotional intelligence. You're neither suppressing feelings nor being consumed by them - just being present.`,
                `Your face shows a peaceful balance. This centered state you're in allows you to respond to life from a place of calm awareness.`
            ],
            happy: [
                `Oh, what a genuine spark of joy I see lighting up your eyes! That authentic happiness isn't just surface-level - it's the kind that radiates from deep within, telling me you're experiencing something truly meaningful right now.`,
                `Your smile reaches your eyes in that beautiful way that only comes from real contentment. I can tell this happiness is more than just a fleeting moment - it's a reflection of genuine satisfaction in your life.`,
                `I love seeing that authentic joy in your expression! It's the kind of happiness that comes from within, not from external circumstances. You're clearly experiencing something that nourishes your soul.`,
                `There's a wonderful warmth radiating from your face. Your eyes are sparkling with genuine delight, and it's absolutely contagious!`,
                `I can see the joy dancing in your features. This kind of authentic happiness has a special quality - it feels both grounded and uplifting at the same time.`,
                `Your expression is glowing with positive energy. There's a lightness and ease in your face that suggests you're truly enjoying this moment.`,
                `What a beautiful sight - your happiness is written all over your face! There's something deeply satisfying about seeing someone in such a genuinely good place.`,
                `I notice your features are soft and open, with that unmistakable glow of contentment. You're radiating positive energy right now.`,
                `Your face tells a story of real joy. Not the forced kind, but the authentic happiness that comes from being aligned with what truly matters to you.`,
                `There's a delightful brightness in your expression. You seem to be experiencing one of those precious moments where everything just feels right.`,
                `I see genuine pleasure reflected in your features. Your happiness has that quality of being both peaceful and energizing at once.`,
                `Your expression is radiating such positive vibes! There's an ease and lightness about you that suggests you're truly savoring this experience.`
            ],
            sad: [
                `I can see there's a gentle sadness touching your heart right now. Your eyes tell me you're processing some deeper emotions, and that's actually a beautiful sign of your emotional depth and capacity for feeling.`,
                `Your expression shows me you're in a reflective space, processing emotions that matter to you. This sadness isn't something to push away - it's showing me how deeply you care about the things that touch your life.`,
                `I notice that quiet contemplation in your eyes. Sometimes our deepest growth comes from sitting with these tender emotions. You're showing incredible courage by being present with your feelings.`,
                `There's a softness around your eyes that speaks of sadness. You're allowing yourself to feel, which takes real bravery and emotional honesty.`,
                `I can see you're carrying something heavy in your heart right now. Your expression tells me you're processing difficult emotions with genuine authenticity.`,
                `Your face shows a tender melancholy. There's wisdom in allowing yourself to fully experience these moments - it's part of being human.`,
                `I notice a gentle sorrow in your features. You're not hiding from what you feel, and that kind of emotional honesty is truly admirable.`,
                `There's a thoughtful sadness in your expression. You seem to be giving yourself space to feel whatever needs to be felt right now.`,
                `I can see some heaviness in your eyes. You're processing something meaningful, and that reflective quality shows real emotional maturity.`,
                `Your expression carries a quiet sadness. There's something deeply human about these moments when we allow ourselves to truly feel.`,
                `I notice a pensive quality in your features. You're sitting with difficult emotions rather than running from them - that's real courage.`,
                `There's a gentle weight in your expression. You're experiencing sadness in a way that honors both the feeling and your capacity to hold it.`
            ],
            anxious: [
                `I can see there's some tension in your expression that speaks to me of underlying worry. Your eyes tell me you're carrying concerns that are weighing on your mind - and that's completely understandable in our complex world.`,
                `Your face shows me you're in a state of heightened alertness, which often comes when we're processing uncertainty. This anxiety is your body's way of trying to protect you, but I can help you find some gentle grounding.`,
                `I notice that subtle tension around your eyes that suggests you're carrying some anxiety. It's brave of you to acknowledge these feelings - many people try to hide them. Let's work together to create some calm.`,
                `There's a visible restlessness in your features. You seem to be navigating some worries, and your body is showing signs of that mental activity.`,
                `I can sense an underlying tension in your expression. Your face reflects the kind of alertness that comes when the mind is working through concerns.`,
                `Your features show signs of anxious energy. There's a tightness that suggests you're processing worries or uncertainties right now.`,
                `I notice your expression carries some nervous energy. You appear to be in that state where the mind is actively problem-solving or worrying.`,
                `There's a certain edginess in your face that speaks of anxiety. Your features show the kind of tension that comes with worry or stress.`,
                `I can see you're experiencing some anxious feelings. There's a quality to your expression that suggests your mind is racing with concerns.`,
                `Your face reflects an anxious state. There's a vigilance in your features that often accompanies worry or apprehension.`,
                `I notice signs of nervous tension in your expression. You seem to be holding some worries that are manifesting in your facial features.`,
                `There's an anxious quality to your features right now. Your expression shows that your mind is engaged with concerns or uncertainties.`
            ],
            calm: [
                `What beautiful tranquility I see in your expression! Your face radiates that peaceful presence that comes from deep within. This calm isn't emptiness - it's the profound peace of someone who knows how to center themselves.`,
                `Your serene expression tells me you're in touch with an inner peace that's quite special. This calm state shows me you have wonderful self-regulation skills and a beautiful capacity for mindfulness.`,
                `I love seeing that gentle calm in your eyes. It's the kind of peace that comes from authentic self-acceptance and emotional wisdom. You're clearly someone who knows how to nurture their own well-being.`,
                `There's a lovely peacefulness in your features. You appear to be in a state of genuine relaxation and inner quiet.`,
                `I can see a deep sense of calm radiating from your face. Your expression has that quality of someone who's truly at ease.`,
                `Your features show a wonderful serenity. There's a softness and ease that suggests you're experiencing real tranquility right now.`,
                `I notice a beautiful stillness in your expression. You seem to have found that sweet spot of peaceful presence.`,
                `There's a gentle calm pervading your entire demeanor. Your face reflects the kind of peace that comes from being truly centered.`,
                `Your expression carries a soothing tranquility. You appear to be in that lovely state where body and mind are at rest.`,
                `I see a peaceful ease in your features. There's a relaxed quality that speaks of genuine calm and contentment.`,
                `Your face shows remarkable serenity. You seem to be experiencing one of those precious moments of true inner peace.`,
                `There's a calming presence in your expression. Your features reflect the kind of quiet that comes from deep relaxation.`
            ],
            angry: [
                `I can see there's some frustration or anger present in your expression right now. Your eyes tell me you're feeling strongly about something that matters deeply to you. This passion, when channeled well, can be a tremendous force for positive change.`,
                `Your face shows me you're experiencing some intense emotions that need expression. This anger isn't something to fear - it's showing me how much you care about justice, fairness, or the things that matter to your heart.`,
                `I notice that intensity in your expression that suggests you're feeling quite strongly about something. This emotional energy can be transformative when we learn to work with it consciously.`,
                `There's visible frustration in your features. Your expression shows the kind of intensity that comes when something has triggered a strong reaction.`,
                `I can see anger manifesting in your face. There's a tension and fire in your features that speaks of powerful emotions.`,
                `Your expression carries signs of irritation or anger. You're clearly feeling strongly about something right now.`,
                `I notice an agitated quality in your features. There's an intensity that suggests you're processing some frustrating or angering situation.`,
                `There's a sharpness to your expression that speaks of anger. Your face reflects the kind of energy that comes with strong feelings.`,
                `I can see you're experiencing some angry feelings. Your features show that heated quality that accompanies frustration or outrage.`,
                `Your face shows clear signs of anger or frustration. There's an edge to your expression that tells me you're feeling intensely.`,
                `I notice an angry energy in your features. You appear to be in that state where strong emotions are close to the surface.`,
                `There's a visible intensity in your expression that speaks of anger. Your face reflects the power of what you're feeling right now.`
            ],
            surprised: [
                `Oh, I can see a spark of surprise in your eyes! That widened gaze tells me something unexpected has caught your attention. Surprise like this often opens us up to new possibilities and fresh perspectives.`,
                `Your expression shows me you're experiencing a moment of genuine surprise. This openness to the unexpected is actually a beautiful quality - it shows you're engaged with life and open to new experiences.`,
                `I love seeing that element of surprise in your face! It tells me you're someone who can still be delighted by life's unexpected moments. This wonder is such a precious quality to nurture.`,
                `There's an unmistakable look of surprise in your features! Your expression has that quality of someone who's just encountered something unexpected.`,
                `I can see surprise written all over your face. Your eyes have that wide, alert quality that comes with unexpected discoveries.`,
                `Your expression shows clear astonishment. There's a freshness in your features that speaks of genuine surprise.`,
                `I notice a delightful surprise in your demeanor. You seem to be experiencing one of those moments that catches you off guard in a good way.`,
                `There's a wonderful element of surprise in your face. Your features show that openness that comes with the unexpected.`,
                `I can see you've been genuinely surprised by something. Your expression carries that spontaneous quality of real astonishment.`,
                `Your face shows authentic surprise. There's an alertness and wonder in your features that's quite refreshing to see.`,
                `I notice a surprised energy in your expression. You appear to be experiencing something that's caught you pleasantly off guard.`,
                `There's a bright surprise in your eyes. Your features reflect the kind of wonder that comes with life's unexpected moments.`
            ],
            fearful: [
                `I can see there's some fear or concern present in your expression. Your eyes tell me you're navigating something that feels threatening or uncertain. This vulnerability actually shows me how deeply you care about staying safe and protected.`,
                `Your face shows me you're in a protective state right now, which is completely natural when we sense potential danger. This fear is your body's wisdom trying to keep you safe - let's honor it while finding some gentle reassurance.`,
                `I notice that cautious quality in your expression that suggests you're feeling some fear. It's brave of you to be present with these feelings. Fear often shows us what we most deeply value and want to protect.`,
                `There's visible apprehension in your features. Your expression shows the kind of wariness that comes when something feels uncertain or threatening.`,
                `I can see signs of fear in your face. There's a defensive quality to your expression that speaks of feeling vulnerable or unsafe.`,
                `Your features carry a fearful tension. You appear to be in that protective state that arises when we sense potential danger.`,
                `I notice a worried concern in your expression. Your face reflects the kind of alertness that comes with feeling afraid or threatened.`,
                `There's a cautious fear in your features. You seem to be navigating something that feels risky or uncertain right now.`,
                `I can see you're experiencing some fearful feelings. Your expression has that guarded quality that comes with apprehension.`,
                `Your face shows clear signs of fear or concern. There's a tension that suggests you're feeling vulnerable in this moment.`,
                `I notice an anxious fear in your demeanor. You appear to be responding to something that feels potentially threatening.`,
                `There's a protective wariness in your expression. Your features reflect the kind of concern that comes when safety feels uncertain.`
            ]
        };

        const emotionInsights = insights[primaryEmotion] || insights.neutral;
        return emotionInsights[Math.floor(Math.random() * emotionInsights.length)];
    };

    // Generate psychologist-like personalized recommendation
    const getPersonalizedRecommendation = (primaryEmotion, valence, arousal, intensity, confidence, authenticityData) => {
        const recommendations = {
            neutral: [
                `In this beautiful state of balance, you have a wonderful opportunity to deepen your self-awareness. Consider taking a few moments to check in with yourself: What emotions are you holding that might need gentle attention? What strengths are you embodying right now that you can celebrate?`,
                `Your current equilibrium is perfect for practicing mindfulness. Try this simple exercise: Place one hand on your heart and one on your belly. As you breathe, notice how your body feels in this moment of calm. This awareness will help you recognize and appreciate your emotional wisdom.`,
                `I encourage you to honor this neutral space you're in. Sometimes our most profound insights come when we're neither high nor low, but simply present. What might this balanced state be inviting you to notice about yourself?`
            ],
            happy: [
                `What a gift to experience this genuine happiness! Consider sharing this positive energy with someone you care about, or channeling it into a creative project. Happiness like yours has the power to uplift not just yourself, but everyone around you.`,
                `Your joyful state is perfect for practicing gratitude. Take a moment to reflect: What people, experiences, or qualities in your life are contributing to this happiness? This awareness will help you cultivate more of what brings you joy.`,
                `I love seeing this authentic happiness in you! Consider using this positive energy to strengthen your relationships or pursue meaningful goals. When we're in this state, we're most capable of creating positive change in our lives.`
            ],
            sad: [
                `Your willingness to sit with sadness shows such emotional courage. Consider reaching out to a trusted friend or loved one - sometimes sharing our tender feelings with someone who cares about us can provide the gentle support we need.`,
                `In moments like these, self-compassion is your greatest ally. Try speaking to yourself as you would to a dear friend experiencing similar feelings. What words of kindness might you offer yourself right now?`,
                `This sadness you're experiencing is showing me how deeply you feel and care. Consider engaging in a comforting activity - perhaps wrapping yourself in a warm blanket, listening to soothing music, or spending time in nature. These small acts of self-care can be profoundly healing.`
            ],
            anxious: [
                `Your anxiety is showing me how much you care about doing things well. Consider grounding yourself with this simple technique: Name 5 things you can see, 4 you can touch, 3 you can hear, 2 you can smell, and 1 you can taste. This brings you back to the safety of the present moment.`,
                `I can see you're carrying some worry right now. Consider placing one hand on your heart and reminding yourself: "I am safe in this moment." Anxiety often comes from trying to control the future - this gentle reminder can help you return to the present.`,
                `Your anxious feelings are completely valid and understandable. Consider breathing deeply: Inhale for 4 counts, hold for 4, exhale for 6. This simple practice can help calm your nervous system and remind you that you have the strength to handle whatever comes.`
            ],
            calm: [
                `Your peaceful state is a beautiful foundation for deeper self-understanding. Consider using this calm to reflect on what practices or people help you maintain this sense of peace. This awareness will help you cultivate more tranquility in your life.`,
                `In this serene space, you have a wonderful opportunity for gentle self-inquiry. What practices or relationships help you feel this calm? How might you invite more of these elements into your daily life?`,
                `Your calm presence is such a gift to yourself and others. Consider using this peaceful energy to connect deeply with someone you care about, or to engage in a meaningful activity that nourishes your soul.`
            ],
            angry: [
                `Your anger shows me you're someone who cares deeply about justice and fairness. Consider channeling this energy into constructive action - perhaps writing down your feelings, going for a brisk walk, or engaging in a physical activity that helps release the tension.`,
                `I can see you're feeling quite passionate about something right now. Consider taking some deep breaths and asking yourself: "What is this anger trying to protect in me?" Often our anger points to something we deeply value that feels threatened.`,
                `Your intense feelings are showing me how much you care. Consider finding a healthy way to express this energy - perhaps through creative activity, physical exercise, or having an honest conversation with someone you trust.`
            ],
            surprised: [
                `This moment of surprise is opening you up to new possibilities! Consider staying curious about what this unexpected experience might be inviting you to learn or explore. Sometimes our greatest growth comes from embracing the unexpected.`,
                `Your surprised expression tells me you're open to life's possibilities. Consider reflecting on what this surprise might be teaching you about flexibility and embracing change. This openness is a beautiful quality.`,
                `I love seeing this element of wonder in your face! Consider using this moment to practice curiosity. What might this surprise be inviting you to notice or explore differently in your life?`
            ],
            fearful: [
                `Your fear shows me you're someone who deeply values safety and security. Consider grounding yourself by naming what feels safe and supportive in your current environment. This can help remind you that you have resources available to you.`,
                `I can see you're in a protective state right now, which is your body's natural response to perceived threat. Consider breathing deeply and reminding yourself of times when you've successfully navigated uncertainty. You have inner strength.`,
                `Your cautious expression tells me you're being wise about potential risks. Consider identifying one small, safe step you could take right now. Often our fears feel overwhelming, but breaking them down into manageable actions can restore our sense of agency.`
            ]
        };

        const emotionRecommendations = recommendations[primaryEmotion] || recommendations.neutral;
        return emotionRecommendations[Math.floor(Math.random() * emotionRecommendations.length)];
    };

    const psychologicalInsight = getPsychologistInsight(primaryEmotion, valence, arousal, intensity, confidence, authenticity);
    const personalizedRecommendation = getPersonalizedRecommendation(primaryEmotion, valence, arousal, intensity, confidence, authenticity);

    // Generate detailed, manual-checkin-style recommendations that match the quality of manual check-ins
    const generateDetailedRecommendations = (primaryEmotion, valence, arousal, intensity, confidence, authenticityData) => {
        const recommendations = [];

        // High-quality, detailed recommendations like manual check-ins
        if (primaryEmotion === 'happy' && valence > 0.3) {
            recommendations.push({
                title: "Celebrate Your Inner Light",
                description: "Your genuine happiness is a beautiful gift that radiates outward. Consider sharing this positive energy through a small act of kindness today - perhaps a warm smile to a colleague or a moment of gratitude shared with someone you care about. This not only spreads joy but also deepens your own sense of connection and purpose.",
                priority: "high",
                category: "social"
            });
            recommendations.push({
                title: "Anchor This Joyful State",
                description: "Take a few moments to reflect on what elements in your life are contributing to this authentic happiness. Is it a sense of accomplishment, meaningful connections, or simply being present? By identifying these sources, you can consciously cultivate more of what brings this light to your life.",
                priority: "medium",
                category: "mindfulness"
            });
            recommendations.push({
                title: "Build on Positive Momentum",
                description: "Your current positive emotional state is perfect for strengthening relationships or pursuing meaningful goals. Consider reaching out to someone you care about or engaging in an activity that brings you fulfillment. When we're in this state, we're most capable of creating positive change.",
                priority: "medium",
                category: "social"
            });
            recommendations.push({
                title: "Practice Gratitude",
                description: "Take a moment to acknowledge the people, experiences, or qualities in your life that contribute to this happiness. Consider writing down three things you're grateful for today. This practice can help sustain and amplify your positive emotional state.",
                priority: "low",
                category: "mindfulness"
            });
        } else if (primaryEmotion === 'sad' && valence < -0.2) {
            recommendations.push({
                title: "Honor Your Emotional Depth",
                description: "Your capacity to feel deeply, even when it brings sadness, is a profound strength that shows your beautiful sensitivity to life's experiences. Consider creating a small ritual of self-compassion - perhaps placing a hand on your heart and acknowledging that it's okay to feel this way, and that this tenderness is part of what makes you beautifully human.",
                priority: "high",
                category: "self-care"
            });
            recommendations.push({
                title: "Find Gentle Connection",
                description: "In moments of sadness, reaching out for connection can be incredibly healing. Consider sharing how you're feeling with someone who has shown you care and understanding before. Sometimes just being witnessed in our sadness can bring unexpected comfort and remind us that we're not alone in our experiences.",
                priority: "medium",
                category: "social"
            });
            recommendations.push({
                title: "Create Comforting Rituals",
                description: "Consider engaging in small, comforting activities that honor your need for gentleness right now. This might include wrapping yourself in a warm blanket, listening to soothing music, spending time in nature, or preparing a nourishing meal. These acts of self-care can be profoundly healing during tender moments.",
                priority: "medium",
                category: "self-care"
            });
            recommendations.push({
                title: "Allow Space for Processing",
                description: "Give yourself permission to feel this sadness without judgment. Consider journaling about your experience or simply sitting with your emotions. Sometimes our deepest healing comes from allowing ourselves to fully experience and process our feelings rather than pushing them away.",
                priority: "low",
                category: "mindfulness"
            });
        } else if (primaryEmotion === 'anxious' && arousal > 0.4) {
            recommendations.push({
                title: "Ground Yourself in the Present",
                description: "Your anxiety shows how deeply you care about navigating life thoughtfully. Try this simple grounding practice: Name 5 things you can see around you, 4 things you can touch, 3 things you can hear, 2 things you can smell, and 1 you can taste. This brings your awareness back to the safety of the present moment.",
                priority: "high",
                category: "mindfulness"
            });
            recommendations.push({
                title: "Create a Safety Plan",
                description: "Consider identifying 2-3 small actions you can take when anxiety feels overwhelming. This might include deep breathing, stepping outside for fresh air, or calling a trusted friend. Having these ready tools can help restore your sense of agency and calm.",
                priority: "medium",
                category: "self-care"
            });
            recommendations.push({
                title: "Practice Gentle Breathing",
                description: "Try the 4-7-8 breathing technique: Inhale quietly through your nose for 4 seconds, hold your breath for 7 seconds, then exhale completely through your mouth for 8 seconds. This can help calm your nervous system and provide immediate relief from anxious feelings.",
                priority: "medium",
                category: "mindfulness"
            });
            recommendations.push({
                title: "Identify Worry Triggers",
                description: "Take a moment to gently explore what might be contributing to your anxiety. Is there a specific situation or thought pattern that's creating this tension? Sometimes simply naming our worries can help us see them more clearly and find ways to address them.",
                priority: "low",
                category: "mindfulness"
            });
        } else if (primaryEmotion === 'neutral' && Math.abs(valence) < 0.3) {
            recommendations.push({
                title: "Embrace This Balanced Space",
                description: "Your current state of equilibrium is actually quite special - it's a place of clarity where you're neither overwhelmed nor disengaged. Consider using this balanced energy for a task that requires clear thinking, or simply enjoy this peaceful presence with yourself. Sometimes our most profound insights come in these quiet, centered moments.",
                priority: "medium",
                category: "mindfulness"
            });
            recommendations.push({
                title: "Check In With Your Needs",
                description: "In this neutral space, you have a wonderful opportunity to tune into what your body and mind might need right now. Are you hungry, thirsty, or needing a change of scenery? Sometimes attending to these basic needs can bring a gentle sense of well-being and care for yourself.",
                priority: "low",
                category: "self-care"
            });
            recommendations.push({
                title: "Practice Mindful Awareness",
                description: "Use this balanced state to practice being fully present. Notice the sensations in your body, the sounds around you, and your breath. This mindful awareness can help you cultivate a deeper sense of calm and presence in your daily life.",
                priority: "medium",
                category: "mindfulness"
            });
            recommendations.push({
                title: "Reflect on Your Strengths",
                description: "Take a moment to acknowledge the inner resources and strengths that allow you to maintain this balanced state. What qualities or practices help you stay grounded? This awareness can help you access these resources more easily when life feels more challenging.",
                priority: "low",
                category: "self-care"
            });
        } else if (primaryEmotion === 'calm' && arousal < 0.3) {
            recommendations.push({
                title: "Deepen This Peaceful State",
                description: "Your calm presence is a beautiful gift to yourself and others around you. Consider using this peaceful energy to connect more deeply with someone you care about, or to engage in a creative activity that brings you joy. This tranquility is worth savoring and can become a touchstone for difficult moments.",
                priority: "medium",
                category: "mindfulness"
            });
            recommendations.push({
                title: "Reflect on Your Inner Resources",
                description: "Take a moment to appreciate the inner strength and wisdom that allow you to access this calm state. What practices or perspectives help you find this peace? This awareness can help you return to this centered place more easily when life feels chaotic.",
                priority: "low",
                category: "self-care"
            });
            recommendations.push({
                title: "Cultivate Deeper Presence",
                description: "Use this calm state to deepen your mindfulness practice. Consider sitting quietly and observing your thoughts and feelings without judgment. This can help you develop greater emotional resilience and presence in all areas of your life.",
                priority: "medium",
                category: "mindfulness"
            });
            recommendations.push({
                title: "Share Your Peace",
                description: "Consider how you might share this calm energy with others. Perhaps through a quiet conversation, a supportive presence, or simply by bringing your peaceful awareness to your interactions. Your calm can be a gift to those around you.",
                priority: "low",
                category: "social"
            });
        } else if (primaryEmotion === 'angry' && arousal > 0.5) {
            recommendations.push({
                title: "Channel Your Passion Constructively",
                description: "Your anger shows you care deeply about justice and fairness. Consider channeling this energy into constructive action - perhaps writing down your feelings, going for a brisk walk, or engaging in a physical activity that helps release the tension. This passion, when directed well, can be a tremendous force for positive change in your life and the lives of others.",
                priority: "high",
                category: "mindfulness"
            });
            recommendations.push({
                title: "Explore the Root of This Fire",
                description: "Take a moment to gently explore what this anger might be protecting or pointing to. Often our strongest emotions are messengers carrying important information about our values and boundaries. This awareness can help transform anger into clarity and purposeful action.",
                priority: "medium",
                category: "self-care"
            });
            recommendations.push({
                title: "Find Healthy Expression",
                description: "Consider finding a safe way to express this intense energy. This might include physical activity, creative expression, or having an honest conversation with someone you trust. Finding appropriate outlets for strong emotions is an important part of emotional health.",
                priority: "medium",
                category: "mindfulness"
            });
            recommendations.push({
                title: "Practice Self-Understanding",
                description: "Take some time to understand what this anger is communicating to you. What boundary needs to be set? What value is being violated? What action might you need to take? This understanding can help you respond rather than react.",
                priority: "low",
                category: "mindfulness"
            });
        } else if (primaryEmotion === 'surprised' && arousal > 0.4) {
            recommendations.push({
                title: "Embrace This Moment of Wonder",
                description: "Your surprise shows you're open to life's unexpected gifts and possibilities. Consider staying curious about what this experience might be teaching you about flexibility and embracing change. Sometimes our greatest growth comes from learning to welcome the unexpected with an open heart.",
                priority: "medium",
                category: "mindfulness"
            });
            recommendations.push({
                title: "Reflect on This Awakening",
                description: "Take a few moments to reflect on what surprised you and why. This awareness can help you notice more of life's small wonders and maintain that beautiful sense of curiosity and openness that makes each day feel fresh and alive.",
                priority: "low",
                category: "self-care"
            });
            recommendations.push({
                title: "Stay Open to Possibilities",
                description: "Use this moment of surprise as an opportunity to practice flexibility and openness. Consider what new perspectives or opportunities this experience might be opening up for you. Sometimes the most unexpected moments lead to our greatest discoveries.",
                priority: "medium",
                category: "mindfulness"
            });
            recommendations.push({
                title: "Cultivate Curiosity",
                description: "Let this surprise awaken your sense of wonder and curiosity. Consider approaching the rest of your day with a spirit of openness and discovery. What other unexpected gifts might be waiting for you?",
                priority: "low",
                category: "mindfulness"
            });
        } else if (primaryEmotion === 'fearful' && valence < -0.1) {
            recommendations.push({
                title: "Acknowledge Your Courage",
                description: "Your fear shows you're someone who deeply values safety and security, which speaks to your wisdom and care for yourself. Consider identifying one small, safe step you can take right now. Often our fears feel overwhelming, but breaking them down into manageable actions can restore our sense of agency and peace.",
                priority: "high",
                category: "self-care"
            });
            recommendations.push({
                title: "Find Your Grounding",
                description: "When fear feels present, grounding practices can be incredibly helpful. Try placing both feet firmly on the ground and taking slow, deep breaths. Remind yourself that you have inner resources and past experiences of successfully navigating uncertainty. You are more capable than you know.",
                priority: "medium",
                category: "mindfulness"
            });
            recommendations.push({
                title: "Build a Support Network",
                description: "Consider reaching out to trusted friends, family, or colleagues who can provide support during this time. Sometimes sharing our fears with others can help us feel less alone and more supported in facing our challenges.",
                priority: "medium",
                category: "social"
            });
            recommendations.push({
                title: "Practice Self-Reassurance",
                description: "Take a moment to remind yourself of your past experiences with uncertainty. What strengths have you shown before? What resources do you have available to you now? This self-reassurance can help calm fearful thoughts and restore confidence.",
                priority: "low",
                category: "self-care"
            });
        }

        // Add a general self-care recommendation if we have fewer than 4
        if (recommendations.length < 4) {
            recommendations.push({
                title: "Practice Self-Compassion",
                description: "Whatever you're experiencing right now, consider speaking to yourself with the same kindness and understanding you'd offer to a dear friend in a similar situation. Your feelings are valid, and your presence here shows your commitment to your own well-being. That's something truly worth celebrating.",
                priority: "medium",
                category: "self-care"
            });
        }

        return recommendations.slice(0, 4); // Return up to 4 recommendations
    };

    const detailedRecommendations = generateDetailedRecommendations(primaryEmotion, valence, arousal, intensity, confidence, authenticity);

    // Calculate presence and capacity based on AI data
    const presenceScore = Math.min(10, Math.max(1, Math.round((valence + 1) * 5))); // 0-10 scale
    const capacityScore = Math.min(10, Math.max(1, Math.round((1 - Math.abs(arousal - 0.5)) * 8 + 2))); // 0-10 scale
    const readinessScore = Math.round(((presenceScore + capacityScore) / 20) * 100);

    const storylineThemes = {
        calm: { title: "Serene Tranquility", tone: "mint", arc: "stabilizing" },
        happy: { title: "Radiant Bloom", tone: "rose", arc: "ascending" },
        sad: { title: "Tender Depth", tone: "lilac", arc: "softening" },
        anxious: { title: "Quiet Storm", tone: "amber", arc: "repairing" },
        neutral: { title: "Measured Balance", tone: "slate", arc: "balancing" },
        angry: { title: "Fiery Focus", tone: "crimson", arc: "igniting" }
    };
    const storylineAnchor = storylineThemes[primaryEmotion] || storylineThemes.neutral;
    const emotionalStoryline = {
        title: storylineAnchor.title,
        chapter: `${weather.internal} • ${primaryEmotion}`,
        narrative: psychologicalInsight,
        arc: storylineAnchor.arc,
        inflection: authenticity.hiddenEmotionLabel || primaryEmotion,
        confidence: Math.min(98, Math.max(62, confidence + (authenticity.isMasked ? -8 : 5))),
        colorTone: storylineAnchor.tone
    };

    const readinessMatrix = {
        presenceScore,
        capacityScore,
        overallReadiness: readinessScore,
        readinessLane: readinessScore >= 80 ? "glide" : readinessScore >= 60 ? "steady" : readinessScore >= 40 ? "sensitive" : "repair",
        signals: [
            {
                label: "Presence",
                status: presenceScore >= 7 ? "clear" : presenceScore >= 5 ? "foggy" : "dense",
                idea: presenceScore >= 7 ? "Channel this clarity into meaningful tasks."
                    : "Protect your first 30 minutes from notifications to ease into the day."
            },
            {
                label: "Capacity",
                status: capacityScore >= 7 ? "charged" : capacityScore >= 5 ? "oscillating" : "drained",
                idea: capacityScore >= 6 ? "Use the surplus energy on creative or collaborative work."
                    : "Schedule a recovery pocket (5-7 mins) to keep your nervous system regulated."
            }
        ]
    };

    const needsSupport = readinessScore < 55 || presenceScore < 5 || capacityScore < 5 || authenticity.isMasked;
    const supportCompass = {
        needsSupport,
        supportLevel: needsSupport ? "active" : "monitor",
        suggestedAllies: needsSupport
            ? ["Trusted colleague", "Mentor/coach"]
            : ["Peer ally", "Positive accountability buddy"],
        message: needsSupport
            ? "This might be the day to ping someone from your circle-every nervous system needs co-regulation sometimes."
            : "You're in a steady lane. Share your calm energy with someone who might need it today.",
        storylineContext: emotionalStoryline.title
    };

    const themePalette = {
        mint: {
            gradientCss: "linear-gradient(135deg, rgba(236, 252, 203, 0.85) 0%, rgba(224, 242, 254, 0.75) 45%, rgba(255, 255, 255, 0.85) 100%)",
            glassColor: "rgba(255, 255, 255, 0.9)",
            borderColor: "rgba(16, 185, 129, 0.35)",
            accentColor: "#10b981",
            moodIntent: "soothing"
        },
        rose: {
            gradientCss: "linear-gradient(135deg, rgba(253, 242, 248, 0.92) 0%, rgba(255, 228, 230, 0.85) 42%, rgba(255, 255, 255, 0.9) 100%)",
            glassColor: "rgba(255, 255, 255, 0.88)",
            borderColor: "rgba(244, 63, 94, 0.35)",
            accentColor: "#f43f5e",
            moodIntent: "warming"
        },
        lilac: {
            gradientCss: "linear-gradient(135deg, rgba(245, 243, 255, 0.92) 0%, rgba(237, 233, 254, 0.85) 50%, rgba(255, 255, 255, 0.9) 100%)",
            glassColor: "rgba(250, 250, 255, 0.85)",
            borderColor: "rgba(99, 102, 241, 0.4)",
            accentColor: "#8b5cf6",
            moodIntent: "balancing"
        },
        amber: {
            gradientCss: "linear-gradient(135deg, rgba(254, 249, 195, 0.9) 0%, rgba(255, 237, 213, 0.8) 45%, rgba(255, 255, 255, 0.9) 100%)",
            glassColor: "rgba(255, 255, 255, 0.92)",
            borderColor: "rgba(251, 191, 36, 0.35)",
            accentColor: "#f59e0b",
            moodIntent: "grounding"
        },
        slate: {
            gradientCss: "linear-gradient(135deg, rgba(226, 232, 240, 0.9) 0%, rgba(203, 213, 225, 0.85) 48%, rgba(248, 250, 252, 0.92) 100%)",
            glassColor: "rgba(248, 250, 252, 0.9)",
            borderColor: "rgba(100, 116, 139, 0.35)",
            accentColor: "#64748b",
            moodIntent: "balancing"
        },
        crimson: {
            gradientCss: "linear-gradient(135deg, rgba(254, 226, 226, 0.9) 0%, rgba(252, 231, 243, 0.85) 48%, rgba(255, 255, 255, 0.92) 100%)",
            glassColor: "rgba(255, 255, 255, 0.9)",
            borderColor: "rgba(220, 38, 38, 0.4)",
            accentColor: "#dc2626",
            moodIntent: "bright"
        }
    };

    const displayHints = {
        theme: storylineAnchor.tone,
        gradientCss: (themePalette[storylineAnchor.tone] || themePalette.lilac).gradientCss,
        glassClass: null,
        glassColor: (themePalette[storylineAnchor.tone] || themePalette.lilac).glassColor,
        borderColor: (themePalette[storylineAnchor.tone] || themePalette.lilac).borderColor,
        accentColor: (themePalette[storylineAnchor.tone] || themePalette.lilac).accentColor,
        density: readinessMatrix.overallReadiness >= 70 ? "airy" : readinessMatrix.overallReadiness >= 45 ? "balanced" : "cozy",
        badges: [
            emotionalStoryline.title,
            weather.internal,
            authenticity.isMasked ? "masked emotion alert" : null
        ].filter(Boolean),
        animationAnchor: authenticity.isMasked ? "fade-in" : "fade-up",
        moodIntent: (themePalette[storylineAnchor.tone] || themePalette.lilac).moodIntent
    };

    const insightChips = [
        ...((emotionData.secondaryEmotions || []).slice(0, 2).map((chip) => ({ label: chip, type: "mood" }))),
        { label: weather.internal, type: "weather" },
        authenticity.isMasked ? { label: "inner " + authenticity.hiddenEmotionLabel, type: "insight" } : null,
        needsSupport ? { label: "support recommended", type: "support" } : null
    ].filter(Boolean);

    const metadata = {
        callToAction: needsSupport
            ? "Consider booking a manual check-in or reaching out to your support contact."
            : "Document two things fueling this positive rhythm today.",
        generatedAt: new Date().toISOString()
    };

    return {
        id: `ai_${primaryEmotion}_${Date.now()}`,
        detectedEmotion: authenticity.isMasked
            ? `${emotionLabels[primaryEmotion] || primaryEmotion} • inner ${authenticity.hiddenEmotionLabel}`
            : emotionLabels[primaryEmotion] || 'Balanced Emotional State',
        confidence: Math.round(confidence),
        icon: weather.icon,
        weatherIcon: weather.icon,
        internalWeather: weather.internal,
        weatherDesc: weather.desc,
        selfreportedEmotions: [primaryEmotion, ...(emotionData.secondaryEmotions || [])],
        microExpressions: microExpressions,
        aiAnalysis: `Through careful observation of your facial expressions, I can see you're experiencing a ${primaryEmotion} emotional state. Your eyes and facial muscles tell a story of ${intensity > 70 ? 'intense' : intensity > 40 ? 'moderate' : 'gentle'} emotional expression, with a ${valence > 0.2 ? 'positive' : valence < -0.2 ? 'challenging' : 'balanced'} emotional tone. This authentic expression reveals so much about your current inner experience.${authenticity.isMasked ? ` There is also a quiet undertone of ${authenticity.hiddenEmotionLabel} gently asking to be acknowledged.` : ''}`,
        psychologicalInsight: psychologicalInsight,
        personalizedRecommendation: personalizedRecommendation,
        presenceCapacity: {
            estimatedPresence: presenceScore,
            estimatedCapacity: capacityScore,
            reasoning: `AI analysis of emotional dimensions (valence: ${valence.toFixed(2)}, arousal: ${arousal.toFixed(2)}) indicates ${primaryEmotion} state affecting cognitive presence and capacity.`
        },
        suggestedActions: detailedRecommendations.map(rec => rec.title),
        detailedRecommendations: detailedRecommendations, // Store the full recommendations
        aiDetected: true,
        valence: valence,
        arousal: arousal,
        intensity: intensity,
        explanations: explanations,
        temporalAnalysis: emotionData.temporalAnalysis,
        analysisFlags: authenticity.isMasked
            ? [{
                type: 'masked_emotion',
                severity: authenticity.maskScore,
                insights: authenticity.signals
            }]
            : [],
        emotionalStoryline,
        readinessMatrix,
        supportCompass,
        displayHints,
        insightChips,
        metadata
    };
};









