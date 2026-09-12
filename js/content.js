// Функция извлечения YouTube ID из любых ссылок
function parseYoutubeId(urlOrId) {
    if (!urlOrId) return '';
    if (typeof urlOrId !== 'string') return '';
    
    const str = urlOrId.trim();
    if (str.length === 11 && !str.includes('/') && !str.includes('.')) {
        return str;
    }
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
                    
                    const rawYt = data.verification || data.ytid || data.video || data.link || data.youtube || '';
                    
                    return {
                        ...data,
                        ytid: parseYoutubeId(rawYt),
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

        const registerPlayer = (rawName, pData = {}) => {
            if (!rawName) return null;
            const name = String(rawName).trim();
            if (!name) return null;

            if (!playersMap[name]) {
                playersMap[name] = {
                    user: name,
                    country: pData.country || pData.nationality || pData.nation || null,
                    avatar: pData.avatar || pData.icon || pData.photo || null,
                    verified: Array.isArray(pData.verified) ? pData.verified : [],
                    records: Array.isArray(pData.records) ? pData.records : [],
                    score: pData.score || pData.points || 0
                };
            } else {
                if (!playersMap[name].country && (pData.country || pData.nationality || pData.nation)) {
                    playersMap[name].country = pData.country || pData.nationality || pData.nation;
                }
                if (!playersMap[name].avatar && (pData.avatar || pData.icon || pData.photo)) {
                    playersMap[name].avatar = pData.avatar || pData.icon || pData.photo;
                }
                if (pData.score || pData.points) {
                    playersMap[name].score = Math.max(playersMap[name].score, pData.score || pData.points || 0);
                }
            }
            return playersMap[name];
        };

        // 1. Читаем файлы игроков
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
                    if (Array.isArray(data)) {
                        data.forEach(p => registerPlayer(p.name || p.user || p.username || p.player, p));
                    } else if (typeof data === 'object' && data !== null) {
                        const innerArray = data.players || data.users || data.profiles || data.leaderboard;
                        if (Array.isArray(innerArray)) {
                            innerArray.forEach(p => registerPlayer(p.name || p.user || p.username || p.player, p));
                        } else {
                            Object.keys(data).forEach(key => {
                                const item = data[key];
                                if (typeof item === 'object' && item !== null) {
                                    registerPlayer(item.name || item.user || item.username || key, item);
                                } else if (typeof item === 'string') {
                                    registerPlayer(item, {});
                                }
                            });
                        }
                    }
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

                        // Верификатор (всегда 100%)
                        if (levelData.verifier) {
                            const pObj = registerPlayer(levelData.verifier, {
                                country: levelData.verifierCountry || levelData.country
                            });

                            if (pObj) {
                                const exists = pObj.verified.some(
                                    v => (typeof v === 'string' ? v : v.levelName) === levelName
                                );
                                if (!exists) {
                                    pObj.verified.push({
                                        levelName: levelName,
                                        rank: rank,
                                        pts: levelPoints
                                    });
                                }
                            }
                        }

                        // Рекорды
                        if (Array.isArray(levelData.records)) {
                            for (const rec of levelData.records) {
                                const recUser = rec.user || rec.name || rec.username;
                                if (!recUser) continue;

                                const pObj = registerPlayer(recUser, {
                                    country: rec.country,
                                    avatar: rec.avatar
                                });

                                if (pObj) {
                                    const exists = pObj.records.some(
                                        r => (typeof r === 'string' ? r : r.levelName) === levelName
                                    );

                                    if (!exists) {
                                        pObj.records.push({
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
                        }
                    } catch (err) {}
                }
            }
        } catch (err) {}

        // 3. Вычисление очков и Hardest (ТОЛЬКО 100%)
        const leaderboard = Object.values(playersMap);

        leaderboard.forEach(p => {
            let total = p.score || 0;
            let hardestItem = null;

            // Верификации (100%)
            if (Array.isArray(p.verified)) {
                p.verified.forEach(v => {
                    const pts = typeof v === 'object' && v.pts ? v.pts : 50;
                    const rank = typeof v === 'object' && v.rank ? v.rank : 999;
                    const levelName = typeof v === 'object' ? v.levelName : v;
                    total += pts;

                    if (!hardestItem || rank < hardestItem.rank) {
                        hardestItem = { levelName, rank };
                    }
                });
            }

            // Рекорды (фильтруем: ТОЛЬКО 100%)
            if (Array.isArray(p.records)) {
                p.records.forEach(r => {
                    const pts = typeof r === 'object' && r.pts ? r.pts : 10;
                    const rank = typeof r === 'object' && r.rank ? r.rank : 999;
                    const levelName = typeof r === 'object' ? r.levelName : r;
                    const percent = typeof r === 'object' && r.percent !== undefined ? r.percent : 100;

                    total += pts;

                    if (percent === 100) {
                        if (!hardestItem || rank < hardestItem.rank) {
                            hardestItem = { levelName, rank };
                        }
                    }
                });
            }

            p.totalScore = total;

            // ТОЛЬКО НАЗВАНИЕ УРОВНЯ
            if (hardestItem) {
                p.hardest = hardestItem.levelName;
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
