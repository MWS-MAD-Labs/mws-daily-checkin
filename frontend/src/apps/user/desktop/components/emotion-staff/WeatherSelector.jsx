import React, { memo, useMemo } from "react";
import WeatherCard from "./components/WeatherCard";

const weatherOptions = [
    { icon: "Sun", label: "Sunny & Clear", labelFull: "Sunny and Clear", desc: "☀️ Sunny and Clear – Feeling upbeat, calm, and full of clarity. Everything's flowing smoothly. / Cerah Tanpa Awan – Merasa bersemangat, tenang, dan pikiran jernih. Semuanya berjalan lancar.", value: "sunny", color: "gold" },
    { icon: "Cloud", label: "Partly Cloudy", labelFull: "Partly Cloudy", desc: "⛅ Partly Cloudy – Doing alright, but there's something lingering in the background—mild stress or distraction. / Berawan Sebagian – Kondisi baik-baik saja, tetapi ada sesuatu yang mengganjal di latar belakang—stres ringan atau distraksi.", value: "partly-cloudy", color: "muted" },
    { icon: "CloudRain", label: "Light Rain", labelFull: "Light Rain", desc: "🌧️ Light Rain – A little heavy emotionally, maybe reflective or tired. Nothing overwhelming, just a quiet drizzle. / Hujan Ringan – Merasa sedikit berat secara emosional, mungkin sedang merenung atau lelah. Tidak ada yang berlebihan, hanya suasana yang tenang.", value: "light-rain", color: "primary" },
    { icon: "Zap", label: "Thunderstorms", labelFull: "Thunderstorms", desc: "🌩️ Thunderstorms – Intense feelings brewing—frustration, anxiety, or emotional overload. Seeking shelter. / Badai Petir – Perasaan yang intens sedang berkecamuk—frustrasi, cemas, atau beban emosional berlebih. Butuh tempat untuk menenangkan diri.", value: "thunderstorms", color: "primary" },
    { icon: "Tornado", label: "Chaotic", labelFull: "Tornado Watch", desc: "🌪️ Tornado Watch – Everything feels chaotic. Thoughts are swirling, hard to focus. May need grounding soon. / Waspada Tornado – Semuanya terasa kacau. Pikiran berputar-putar, sulit untuk fokus. Mungkin perlu menenangkan diri segera.", value: "tornado", color: "primary" },
    { icon: "Snowflake", label: "Snowy & Still", labelFull: "Snowy and Still", desc: "🌨️ Snowy and Still – Feeling slow, introspective, or emotionally frozen. Not bad, just… still. / Bersalju dan Tenang – Merasa lambat, introspektif, atau seakan 'membeku' secara emosional. Bukan perasaan buruk, hanya… diam dan tenang.", value: "snowy", color: "emerald" },
    { icon: "Rainbow", label: "Rainbow", labelFull: "Post-Storm Rainbow", desc: "🌈 Post-Storm Rainbow – Just came through something difficult, but there's hope and beauty emerging now. / Pelangi Setelah Badai – Baru saja melewati masa sulit, tetapi kini ada harapan dan keindahan yang mulai muncul.", value: "rainbow", color: "emerald" },
    { icon: "CloudFog", label: "Foggy", labelFull: "Foggy", desc: "🌫️ Foggy – Mentally fuzzy, unclear, maybe a bit lost. Looking for direction or clarity. / Berkabut – Pikiran sedang kabur, tidak jernih, mungkin merasa sedikit tersesat. Sedang mencari arah atau kejelasan.", value: "foggy", color: "muted" },
    { icon: "Flame", label: "Heatwave", labelFull: "Heatwave", desc: "🔥 Heatwave – Energetic but possibly burnt out or overstimulated. Too much going on at once. / Gelombang Panas – Penuh energi tetapi ada kemungkinan merasa burn out (terbakar) atau terlalu terstimulasi. Terlalu banyak hal terjadi sekaligus.", value: "heatwave", color: "gold" },
    { icon: "Wind", label: "Windy", labelFull: "Windy", desc: "🌬️ Windy – Restless, scattered, or in transition. Things are moving quickly, hard to settle down. / Berangin – Gelisah, pikiran tidak fokus, atau sedang dalam masa transisi. Segalanya bergerak cepat, sulit untuk merasa tenang.", value: "windy", color: "emerald" }
];

const Header = memo(() => (
    <div className="space-y-2">
        <h2 className="text-lg md:text-xl font-semibold text-foreground tracking-tight">
            Internal Weather Report
        </h2>
        <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
            How are you feeling internally right now?
        </p>
    </div>
));

const WeatherGrid = memo(({ selectedWeather, onWeatherSelect }) => (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-2 md:gap-3">
        {weatherOptions.map((weather, index) => (
            <WeatherCard
                key={weather.value}
                weather={weather}
                isSelected={selectedWeather === weather.value}
                onClick={() => onWeatherSelect(weather.value)}
                index={index}
            />
        ))}
    </div>
));

const SelectedDescription = memo(({ selectedOption }) => (
    selectedOption && (
        <div className="p-3 md:p-4 rounded-lg border border-border bg-card/60 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
            <p className="text-xs md:text-sm text-muted-foreground text-center leading-relaxed">
                <span className="font-medium text-foreground">{selectedOption.labelFull}:</span>{' '}
                {(() => {
                    const raw = String(selectedOption.desc || '');
                    // Use English-only part before the bilingual separator
                    const english = raw.includes(' / ') ? raw.split(' / ')[0] : raw;
                    return english.replace(/^\s*[^A-Za-z]+\s*/, '');
                })()}
            </p>
        </div>
    )
));

const WeatherSelector = memo(({ selectedWeather, onWeatherSelect }) => {
    const selectedOption = useMemo(
        () => weatherOptions.find(w => w.value === selectedWeather),
        [selectedWeather]
    );

    return (
        <div className="glass glass-card hover-lift transition-all duration-300">
            <div className="glass__refract" />
            <div className="glass__refract--soft" />
            <div className="glass__noise" />
            <div className="relative z-10 p-5 md:p-6 space-y-5">
                <Header />
                <WeatherGrid selectedWeather={selectedWeather} onWeatherSelect={onWeatherSelect} />
                <SelectedDescription selectedOption={selectedOption} />
            </div>
        </div>
    );
});

WeatherSelector.displayName = 'WeatherSelector';
export default WeatherSelector;
