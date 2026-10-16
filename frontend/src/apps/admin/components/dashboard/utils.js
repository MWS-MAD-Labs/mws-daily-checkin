/* --- Input Sanitization for Security --- */
export const sanitizeInput = (value) => {
    return String(value || "")
        .replace(/<[^>]*>?/gm, '') // Remove HTML tags
        .replace(/javascript:/gi, '') // Remove javascript: protocol
        .replace(/data:/gi, '') // Remove data: protocol
        .replace(/vbscript:/gi, '') // Remove vbscript: protocol
        .replace(/on\w+\s*=/gi, '') // Remove event handlers
        .replace(/https?:\/\/\S+/g, '') // Remove external links
        .trim()
        .slice(0, 200); // Limit length
};

/* --- Mock Data --- */
export const mockData = {
    today: {
        totalCheckins: 65,
        averagePresence: 7.1,
        averageCapacity: 6.7,
        moodDistribution: {
            happy: 18,
            excited: 16,
            calm: 12,
            hopeful: 8,
            sad: 2,
            anxious: 8,
            angry: 0,
            fear: 1,
            tired: 15,
            hungry: 9,
            lonely: 5,
            bored: 0,
            overwhelmed: 1,
            scattered: 3
        },
        moodLists: {
            overwhelmed: ["Nayandra Hasan Sudra"],
            fear: ["Kholida Widyawati, S.Sos, MA", "Nayandra Hasan Sudra"],
            hungry: ["Fadholi Akbar", "Reza Rizky Prayudha", "Iis Asifah", "belum sarapan", "Tri Ayu Lestari", "Bela Kartika Sari", "Robby Noer Abjuny", "Ika Rahayu", "Chantika Nur Febryanti, S.Pd.", "Derry Parmanto, S.S"],
            excited: ["Muhammad Rayhan Ananta", "Abdullah, SE, MM", "Nur Muhamad Ismail", "Alifananda Dhaffa Hanif Musyafa, S.Pd", "Novia Syifaputri Ramadhan", "Rifqi Satria Permana, S.Pd", "Faisal Nur Hidayat", "Galen Rasendriya", "Ari Wibowo", "Adiya Herisa", "Mukron", "Tria Fadilla", "Tiastiningrum Nugrahanti, S.Pd", "Hana Nuzula Fajria, S.Pd", "Ferlyna Balqis", "Irawan", "Andrean Hadinata, S.Sos", "Derry Parmanto, S.S"],
            happy: ["Muhammad Rayhan Ananta", "Tien Hadiningsih, S.S", "Romasta Oryza Sativa Siagian, S.Pd", "Reza Rizky Prayudha", "Abdullah, SE, MM", "Novia Syifaputri Ramadhan", "Nazmi Kusumawantari", "Rifqi Satria Permana, S.Pd", "Faisal Nur Hidayat", "Risma Galuh Pitaloka Fahdin", "Nanda Citra Ryani, S.IP", "Ari Wibowo", "Adiya Herisa", "Hana Nuzula Fajria, S.Pd", "Abu Bakar Ali, S.Sos I"],
            anxious: ["Adibah Hana Widjaya", "Farhah Alya Nabilah", "Prisy Dewanti", "Annisa Fitri Tanjung", "Maria Rosa Apriliana Jaftoran", "Ferlyna Balqis", "Nayandra Hasan Sudra", "Hadi"],
            sad: ["Almia Ester Kristiyany Sinabang, S.Pd", "Himawan Rizky Syaputra"],
            hopeful: ["Azalia Magdalena Septianti Tambi", "Zavier Cloudya Mashareen, S.Psi", "Bela Kartika Sari", "Ari Wibowo", "Muhammad Fathan Qorib", "Tiastiningrum Nugrahanti, S.Pd", "Hana Nuzula Fajria, S.Pd", "Ferlyna Balqis", "Vicki Aprinando"],
            lonely: ["Fayza Julia Pramesti Hapsari Prayoga", "Tri Ayu Lestari", "Nadia", "Nathasya Christine Prabowo, S.Si"],
            scattered: ["Fayza Julia Pramesti Hapsari Prayoga", "Kholida Widyawati, S.Sos, MA", "Nayandra Hasan Sudra"],
            tired: ["Adibah Hana Widjaya", "Ratna Merlangen", "Farhah Alya Nabilah", "Novan Syaiful Rahman", "Fadholi Akbar", "Fayza Julia Pramesti Hapsari Prayoga", "Dien Islami", "Robby Noer Abjuny", "Rizki Nurul Hayati,", "Robby Anggara", "Muhammad Farhan Sholeh Ramadhika", "Faqiha Salma Achmada S.Psi.", "Shahrani Fatimah Azzahrah", "Nayandra Hasan Sudra", "Krisalyssa Esna Rehulina Tarigan, S.K.Pm", "Nathasya Christine Prabowo, S.Si"],
            calm: ["Sarah Yuliana, SE", "Muhammad Rayhan Ananta", "Himawan Rizky Syaputra", "Ni Made Ayu Juwitasari", "Abdullah, SE, MM", "Diya Pratiwi, S.S", "Faisal Nur Hidayat", "Aria Wisnuwardana, S.TP", "Nanda Citra Ryani, S.IP", "Faqiha Salma Achmada S.Psi.", "Shahrani Fatimah Azzahrah", "Muhammad Gibran Al Wali", "Hana Nuzula Fajria, S.Pd", "Susantika Nilasari", "Anggie Ayu Setya Pradini, S.Pd"]
        },
        internalWeather: {
            sunny: 25,
            cloudy: 15,
            rain: 12,
            storm: 8,
            tornado: 3,
            snow: 2
        },
        checkInRequests: [
            { contact: "Pak Faisal", requestedBy: "Muhammad Rayhan Ananta" },
            { contact: "Ms. Kholida", requestedBy: "Abdullah, SE, MM" }
        ],
        notSubmitted: [
            "Aaliyah Haider Awesi", "Abdul Mansyur", "Afiyanti Hardiansari", "Ahmad Haikal", "Ardiansyah",
            "Auliya Hasanatin Suwisto, S.IKom", "Ayunda Primaputri", "Berliana Gustina Siregar",
            "Dara Kinanti, A.Md,OT", "Delfiana Salsabila Komara", "Devi Agriani, S.Pd.", "Devi Larasati",
            "Dina", "Dini Meilani Pramesti", "Dona", "Erickson, SM", "Fransiska Evasari, S.Pd",
            "Gundah Basiswi, S.Pd", "Khairul Anwar", "Krisalyssa Esna Rehulina Tarigan, S.K.P.M.",
            "Kurnia Sandi", "Latifah Nur Restiningtyas, S.Pd", "Mahrukh Bashir", "Nilam Kusuma Wardani",
            "Nopi Puji Astuti", "Nurul Widyaningtyas Agustin", "Pipiet Anggreiny, S.TP",
            "Pricilla Cecil Leander, S.Pd", "Putri Fitriyani, S.Pd", "Raisa Ramadhani",
            "Restia Widiasari", "Rico Pratama Putra, Ph.D.", "Rike Rahmawati S.Pd",
            "Risma Ayu Angelita", "Rizki Nurul Hayati", "Robiatul Adawiah", "Rohmatulloh",
            "Salsabila Dhiyaussyifa Laela", "Sendy Herdiansyah, S.S", "Syawaludin", "Udom Anatapong",
            "Usep Saefurohman", "Vinka Erawati, S.Pd", "Yohana Setia Risli, S.S",
            "Yosafat Imanuel Parlindungan, S.Sn", "Zolla Firmalia Rossa, S.Pd."
        ],
        thoughts: [
            {
                author: "Muhammad Rayhan Ananta",
                timestamp: "2 hours ago",
                content: "Feeling energized today! The team meeting went really well and I'm excited about the new projects coming up."
            },
            {
                author: "Abdullah, SE, MM",
                timestamp: "4 hours ago",
                content: "Had a challenging meeting this morning but feeling supported by the team. Grateful for the collaborative environment."
            },
            {
                author: "Hana Nuzula Fajria, S.Pd",
                timestamp: "6 hours ago",
                content: "A bit overwhelmed with the workload today, but taking it one step at a time. The support from colleagues helps a lot."
            },
            {
                author: "Tiastiningrum Nugrahanti, S.Pd",
                timestamp: "8 hours ago",
                content: "Reflecting on a productive week. Feeling hopeful about the positive changes we're implementing for our students."
            }
        ]
    },
    weekly: [
        { day: "Mon", checkins: 25, flagged: 2 },
        { day: "Tue", checkins: 28, flagged: 1 },
        { day: "Wed", checkins: 22, flagged: 4 },
        { day: "Thu", checkins: 30, flagged: 2 },
        { day: "Fri", checkins: 26, flagged: 3 },
        { day: "Sat", checkins: 15, flagged: 1 },
        { day: "Sun", checkins: 18, flagged: 2 }
    ]
};

/* --- Mood Configuration --- */
export const moodConfig = {
    happy: { Icon: null, color: "emerald" },
    excited: { Icon: null, color: "gold" },
    okay: { Icon: null, color: "muted" },
    sad: { Icon: null, color: "primary" }
};

/* --- Period Options --- */
export const periodOptions = [
    { id: "today", label: "Today" },
    { id: "week", label: "Week" },
    { id: "month", label: "Month" },
    { id: "semester", label: "Semester" },
    { id: "all", label: "All Data" }
];
