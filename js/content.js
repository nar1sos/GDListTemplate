// Функция, которая достает чистый ID (например, "TaFpNLy8ZBU") из ЛЮБОЙ ссылки
function parseYoutubeId(urlOrId) {
    if (!urlOrId) return '';
    if (typeof urlOrId !== 'string') return '';
    
    const str = urlOrId.trim();
    
    // Если уже передан 11-значный ID без слэшей
    if (str.length === 11 && !str.includes('/') && !str.includes('.')) {
        return str;
    }
    
    // Регулярное выражение для всех типов YouTube ссылок (youtu.be, watch?v=, embed и т.д.)
    const regExp = /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/;
    const match = str.match(regExp);
    
    return (match && match[1]) ? match[1] : '';
}

// Загрузка списка уровней (_list.json)
export async function fetchList() {
    try {
        const listReq = await fetch('./data/_list.json');
        if (!listReq.ok) return [];
        const levelFiles = await listReq.json();

        const list = await Promise.all(
            levelFiles.map(async (file, index) => {
                try {
                    const res = await fetch(`./data/${file}.json`);
                    if (!res.ok) return null;
                    const data = await res.json();
                    
                    // Берем ссылку из любого возможного поля (verification, ytid, video, link, youtube)
                    const rawYt = data.verification || data.ytid || data.video || data.link || data.youtube || '';
                    
                    return {
                        ...data,
                        ytid: parseYoutubeId(rawYt), // Здесь получаются чистые 11 символов ID
                        rank: index + 1,
                        path: file
                    };
                } catch (e) {
                    console.error(`Error loading level ${file}:`, e);
                    return null;
                }
            })
        );

        return list.filter(item => item !== null);
    } catch (e) {
        console.error("Error in fetchList:", e);
        return [];
    }
}

// Загрузка редакторов (_editors.json)
export async function fetchEditors() {
    try {
        const res = await fetch('./data/_editors.json');
        if (!res.ok) return [];
        return await res.json();
    } catch (e) {
        console.warn("Файл _editors.json не найден:", e);
        return [];
    }
}

// Загрузка и генерация лидерборда игроков
export async function fetchLeaderboard() {
    try {
        const playersMap = {};

        // 1. Читаем файлы игроков из папки data
        const possiblePlayerFiles = [
            './data/players.json',
            './data/profiles.json',
            './data/_players.json',
            './data/_leaderboard.json'
        ];

        for (const filePath of possiblePlayerFiles) {
            try {
                const res = await fetch(filePath);
                if (res.ok) {
                    const data = await res.json();
                    const playersArray = Array.isArray(data) ? data : (data.players || data.users || data.profiles || []);
                    
                    playersArray.forEach(p => {
                        const name = p.name || p.user || p.username;
                        if (!name) return;

                        playersMap[name] = {
                            user: name,
                            country: p.country || p.nationality || p.nation || null,
                            avatar: p.avatar || p.icon || null,
                            verified: Array.isArray(p.verified) ? p.verified : [],
                            records: Array.isArray(p.records) ? p.records : [],
                            score: p.score || p.points || 0
                        };
                    });
                }
            } catch (err) {}
        }

        // 2. Сканируем уровни
        try {
            const listReq = await fetch('./data/_list.json');
            if (listReq.ok) {
                const levelFiles = await listReq.json();

                for (let index = 0; index < levelFiles.length; index++) {
                    const file = levelFiles[index];
                    const rank = index + 1;
                    const levelPoints = Math.max(100 - (rank - 1) * 2, 5);

                    try {
                        const res = await fetch(`./data/${file}.json`);
                        if (!res.ok) continue;
                        const levelData = await res.json();
                        const levelName = levelData.name || file;

                        // Верификатор
                        if (levelData.verifier) {
                            const vName = levelData.verifier;
                            if (!playersMap[vName]) {
                                playersMap[vName] = {
                                    user: vName,
                                    country: levelData.verifierCountry || levelData.country || null,
                                    verified: [],
                                    records: [],
                                    score: 0
                                };
                            }
                            const existsInVerified = playersMap[vName].verified.some(
                                v => (typeof v === 'string' ? v : v.levelName) === levelName
                            );
                            if (!existsInVerified) {
                                playersMap[vName].verified.push({
                                    levelName: levelName,
                                    rank: rank,
                                    pts: levelPoints
                                });
                            }
                        }

                        // Рекорды
                        if (Array.isArray(levelData.records)) {
                            for (const rec of levelData.records) {
                                const pName = rec.user || rec.name || rec.username;
                                if (!pName) continue;

                                if (!playersMap[pName]) {
                                    playersMap[pName] = {
                                        user: pName,
                                        country: rec.country || rec.nationality || rec.nation || null,
                                        avatar: rec.avatar || null,
                                        verified: [],
                                        records: [],
                                        score: 0
                                    };
                                } else if (!playersMap[pName].avatar && rec.avatar) {
                                    playersMap[pName].avatar = rec.avatar;
                                }

                                const existsInRecords = playersMap[pName].records.some(
                                    r => (typeof r === 'string' ? r : r.levelName) === levelName
                                );

                                if (!existsInRecords) {
                                    playersMap[pName].records.push({
                                        levelName: levelName,
                                        percent: rec.percent || 100,
                                        hz: rec.hz || 60,
                                        link: rec.link || rec.video || '',
                                        rank: rank,
                                        pts: Math.round((levelPoints * (rec.percent || 100)) / 100)
                                    });
                                }
                            }
                        }
                    } catch (err) {}
                }
            }
        } catch (err) {}

        // 3. Расчет очков
        const leaderboard = Object.values(playersMap);

        leaderboard.forEach(p => {
            let total = p.score || 0;

            if (Array.isArray(p.verified)) {
                p.verified.forEach(v => {
                    total += typeof v === 'object' && v.pts ? v.pts : 50;
                });
            }

            if (Array.isArray(p.records)) {
                p.records.forEach(r => {
                    total += typeof r === 'object' && r.pts ? r.pts : 10;
                });
            }

            p.totalScore = total;

            if (p.verified && p.verified.length > 0) {
                p.hardest = typeof p.verified[0] === 'string' ? p.verified[0] : p.verified[0].levelName;
            } else if (p.records && p.records.length > 0) {
                p.hardest = typeof p.records[0] === 'string' ? p.records[0] : p.records[0].levelName;
            } else {
                p.hardest = 'None';
            }
        });

        leaderboard.sort((a, b) => b.totalScore - a.totalScore);

        return leaderboard;
    } catch (e) {
        console.error("Error in fetchLeaderboard:", e);
        return [];
    }
}
