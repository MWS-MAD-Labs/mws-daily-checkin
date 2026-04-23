import { memo, useCallback, useMemo } from "react";
import {
    MWS_STUDENT_CARD_ASSET_IDS,
    MWS_STUDENT_CUTOUT_ASSET_IDS,
} from "@/data/mwsStudentsDesignAssets";
import kidsGroupPhoto from "@/assets/landing/kids-group.jpg";
import "@/pages/styles/staff-orbit-collage.css";

const CLD_BASE = "https://res.cloudinary.com/deldcwiji/image/upload";
const cardPhoto = (id, w = 250, h = 168) => `${CLD_BASE}/c_fill,w_${w},h_${h},g_auto,f_auto,q_auto/${id}`;
const cutoutPhoto = (id, w = 300) => `${CLD_BASE}/c_scale,w_${w},f_auto,q_auto/${id}`;

const hashString = (value = "") => {
    let hash = 0;
    for (let i = 0; i < value.length; i += 1) {
        hash = ((hash << 5) - hash) + value.charCodeAt(i);
        hash |= 0;
    }
    return Math.abs(hash);
};

const deterministicPick = (pool, count, seedBase = 1) => {
    if (!Array.isArray(pool) || pool.length === 0 || count <= 0) return [];

    const next = [...pool];
    let seed = (Math.abs(seedBase) % 2147483647) || 1;
    const random = () => {
        seed = (seed * 48271) % 2147483647;
        return seed / 2147483647;
    };

    for (let i = next.length - 1; i > 0; i -= 1) {
        const j = Math.floor(random() * (i + 1));
        [next[i], next[j]] = [next[j], next[i]];
    }

    return next.slice(0, count);
};

const takeCycled = (items, start, count) => {
    if (!Array.isArray(items) || !items.length || count <= 0) return [];
    return Array.from({ length: count }, (_, index) => items[(start + index) % items.length]);
};

const RAIL_SHAPES = ["wide", "square", "tall", "wide", "square", "wide", "tall", "square", "wide", "square", "tall", "wide", "square", "wide"];
const ROTATION_LEFT = ["-2.8deg", "2deg", "-1.5deg", "3.2deg", "-2.1deg", "1.4deg", "-3deg", "2.4deg", "-1.8deg", "2.1deg", "-2.6deg", "1.7deg", "-2.1deg", "2.6deg"];
const ROTATION_RIGHT = ["2.9deg", "-2deg", "1.4deg", "-3deg", "2.1deg", "-1.4deg", "3.1deg", "-2.2deg", "1.9deg", "-2deg", "2.5deg", "-1.6deg", "2.2deg", "-2.4deg"];
const SHIFT_LEFT = ["-8px", "10px", "-6px", "12px", "-5px", "9px", "-9px", "8px", "-7px", "10px", "-6px", "9px", "-5px", "8px"];
const SHIFT_RIGHT = ["8px", "-10px", "6px", "-12px", "5px", "-9px", "9px", "-8px", "7px", "-10px", "6px", "-9px", "5px", "-8px"];

const railDimensions = (shape) => {
    if (shape === "tall") return { w: 214, h: 272 };
    if (shape === "square") return { w: 184, h: 184 };
    return { w: 250, h: 162 };
};

const DecorativeElements = memo(() => {
    const dayKey = useMemo(() => new Date().toISOString().slice(0, 10), []);
    const daySeed = useMemo(() => hashString(`staff-story-rails:${dayKey}`), [dayKey]);

    const cardDeck = useMemo(
        () => deterministicPick(MWS_STUDENT_CARD_ASSET_IDS, 84, daySeed + 17),
        [daySeed],
    );
    const cutoutDeck = useMemo(
        () => deterministicPick(MWS_STUDENT_CUTOUT_ASSET_IDS, 2, daySeed + 73),
        [daySeed],
    );

    const leftRailDeck = useMemo(() => takeCycled(cardDeck, 6, 14), [cardDeck]);
    const rightRailDeck = useMemo(() => takeCycled(cardDeck, 28, 14), [cardDeck]);
    const mobileDeck = useMemo(() => takeCycled(cardDeck, 50, 10), [cardDeck]);

    const applyFallback = useCallback((event) => {
        if (event.currentTarget.dataset.fallback === "1") return;
        event.currentTarget.dataset.fallback = "1";
        event.currentTarget.src = kidsGroupPhoto;
    }, []);

    return (
        <div className="staff-story-layer" aria-hidden="true">
            <div className="staff-story-background" />
            <div className="staff-story-grid" />
            <div className="staff-story-vignette" />

            <div className="staff-story-rails">
                <section className="staff-story-rail staff-story-rail--left">
                    <div className="staff-story-rail-track">
                        {leftRailDeck.map((assetId, index) => {
                            const shape = RAIL_SHAPES[index % RAIL_SHAPES.length];
                            const dimensions = railDimensions(shape);
                            return (
                                <figure
                                    key={`staff-left-rail-${assetId}-${index}`}
                                    className={`staff-story-rail-card staff-story-rail-card--${shape}`}
                                    style={{
                                        "--rail-rotate": ROTATION_LEFT[index % ROTATION_LEFT.length],
                                        "--rail-shift": SHIFT_LEFT[index % SHIFT_LEFT.length],
                                        "--rail-delay": `${index * 0.12}s`,
                                    }}
                                >
                                    <img
                                        src={cardPhoto(assetId, dimensions.w, dimensions.h)}
                                        alt=""
                                        loading="eager"
                                        decoding="async"
                                        onError={applyFallback}
                                    />
                                </figure>
                            );
                        })}
                    </div>
                </section>

                <section className="staff-story-rail staff-story-rail--right">
                    <div className="staff-story-rail-track">
                        {rightRailDeck.map((assetId, index) => {
                            const shape = RAIL_SHAPES[index % RAIL_SHAPES.length];
                            const dimensions = railDimensions(shape);
                            return (
                                <figure
                                    key={`staff-right-rail-${assetId}-${index}`}
                                    className={`staff-story-rail-card staff-story-rail-card--${shape}`}
                                    style={{
                                        "--rail-rotate": ROTATION_RIGHT[index % ROTATION_RIGHT.length],
                                        "--rail-shift": SHIFT_RIGHT[index % SHIFT_RIGHT.length],
                                        "--rail-delay": `${index * 0.12 + 0.06}s`,
                                    }}
                                >
                                    <img
                                        src={cardPhoto(assetId, dimensions.w, dimensions.h)}
                                        alt=""
                                        loading="eager"
                                        decoding="async"
                                        onError={applyFallback}
                                    />
                                </figure>
                            );
                        })}
                    </div>
                </section>
            </div>

            <figure className="staff-story-portrait staff-story-portrait--left">
                <img
                    src={cutoutPhoto(cutoutDeck[0] || MWS_STUDENT_CUTOUT_ASSET_IDS[0], 300)}
                    alt=""
                    loading="eager"
                    decoding="async"
                    onError={applyFallback}
                />
            </figure>
            <figure className="staff-story-portrait staff-story-portrait--right">
                <img
                    src={cutoutPhoto(cutoutDeck[1] || MWS_STUDENT_CUTOUT_ASSET_IDS[1], 300)}
                    alt=""
                    loading="eager"
                    decoding="async"
                    onError={applyFallback}
                />
            </figure>

            <div className="staff-story-mobile-board">
                {mobileDeck.map((assetId, index) => (
                    <figure
                        key={`staff-mobile-photo-${assetId}-${index}`}
                        className="staff-story-mobile-tile"
                    >
                        <img
                            src={cardPhoto(assetId, 132, 132)}
                            alt=""
                            loading="eager"
                            decoding="async"
                            onError={applyFallback}
                        />
                    </figure>
                ))}
            </div>
        </div>
    );
});

DecorativeElements.displayName = "DecorativeElements";
export default DecorativeElements;
