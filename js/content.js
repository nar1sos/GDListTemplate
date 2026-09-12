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
                    return {
                        ...data,
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

// Генерация лидерборда игроков
export async function fetchLeaderboard() {
    try {
        const playersMap = {};

        const possiblePlayerFiles = [
            './data/_players.json',
            './data/_leaderboard.json',
            './data/players.json',
            './data/leaderboard.json',
            './data/_users.json'
        ];

        let staticPlayers = [];

        for (const filePath of possiblePlayerFiles) {
            try {
                const res = await fetch(filePath);
                if (res.ok) {
                    staticPlayers = await res.json();
                    break;
                }
            } catch (err) {}
        }

        if (Array.isArray(staticPlayers)) {
            staticPlayers.forEach(p => {
                const name = p.name || p.user || p.username;
                if (!name) return;
                
                playersMap[name] = {
                    user: name,
                    country: p.country || p.nationality || p.nation || null,
                    avatar: p.avatar || p.icon || null,
                    verified: Array.isArray(p.verified) ? p.verified : [],
                    records: Array.isArray(p.records) ? p.records : [],
                    ...p
                };
            });
        }

        try {
            const listReq = await fetch('./data/_list.json');
            if (listReq.ok) {
                const levelFiles = await listReq.json();

                for (const file of levelFiles) {
                    try {
                        const res = await fetch(`./data/${file}.json`);
                        if (!res.ok) continue;
                        const levelData = await res.json();

                        if (levelData.verifier) {
                            const vName = levelData.verifier;
                            if (!playersMap[vName]) {
                                playersMap[vName] = {
                                    user: vName,
                                    country: levelData.verifierCountry || levelData.country || null,
                                    verified: [],
                                    records: []
                                };
                            }
                            if (!playersMap[vName].country && (levelData.verifierCountry || levelData.country)) {
                                playersMap[vName].country = levelData.verifierCountry || levelData.country;
                            }
                            const levelName = levelData.name || file;
                            if (!playersMap[vName].verified.includes(levelName)) {
                                playersMap[vName].verified.push(levelName);
                            }
                        }

                        if (Array.isArray(levelData.records)) {
                            for (const rec of levelData.records) {
                                const pName = rec.user || rec.name;
                                if (!pName) continue;

                                if (!playersMap[pName]) {
                                    playersMap[pName] = {
                                        user: pName,
                                        country: rec.country || rec.nationality || rec.nation || null,
                                        avatar: rec.avatar || null,
                                        verified: [],
                                        records: []
                                    };
                                }

                                if (!playersMap[pName].country && (rec.country || rec.nationality || rec.nation)) {
                                    playersMap[pName].country = rec.country || rec.nationality || rec.nation;
                                }

                                const levelName = levelData.name || file;
                                const exists = playersMap[pName].records.some(
                                    r => (typeof r === 'string' ? r : r.levelName) === levelName
                                );

                                if (!exists) {
                                    playersMap[pName].records.push({
                                        levelName: levelName,
                                        percent: rec.percent || 100,
                                        hz: rec.hz || 60,
                                        link: rec.link || '',
                                        country: rec.country || rec.nationality || rec.nation || null
                                    });
                                }
                            }
                        }
                    } catch (err) {}
                }
            }
        } catch (err) {}

        const leaderboard = Object.values(playersMap);

        leaderboard.sort((a, b) => {
            const scoreA = (a.verified ? a.verified.length * 2 : 0) + (a.records ? a.records.length : 0);
            const scoreB = (b.verified ? b.verified.length * 2 : 0) + (b.records ? b.records.length : 0);
            return scoreB - scoreA;
        });

        leaderboard.forEach(p => {
            if (p.verified && p.verified.length > 0) {
                p.hardest = typeof p.verified[0] === 'string' ? p.verified[0] : p.verified[0].levelName;
            } else if (p.records && p.records.length > 0) {
                p.hardest = typeof p.records[0] === 'string' ? p.records[0] : p.records[0].levelName;
            }
        });

        return leaderboard;
    } catch (e) {
        console.error("Error in fetchLeaderboard:", e);
        return [];
    }
}
