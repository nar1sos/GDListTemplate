/**
 * js/content.js
 */

// 1. Загрузка списка всех демонов для листа уровней
export async function fetchList() {
    try {
        const listRes = await fetch('./data/_list.json');
        if (!listRes.ok) return [];
        const levelNames = await listRes.json();

        if (!Array.isArray(levelNames)) return [];

        const list = await Promise.all(
            levelNames.map(async (name, index) => {
                try {
                    const res = await fetch(`./data/${name}.json`);
                    if (!res.ok) return [null, name];
                    const data = await res.json();
                    return [
                        {
                            ...data,
                            rank: index + 1,
                            path: name,
                            name: data.name || name,
                            author: data.author || 'Unknown',
                            verifier: data.verifier || 'Unknown',
                            creators: data.creators || [],
                            records: data.records || data.vids || []
                        },
                        null
                    ];
                } catch (e) {
                    console.warn(`Не удалось загрузить уровень: ${name}`, e);
                    return [null, name];
                }
            })
        );

        return list;
    } catch (e) {
        console.error("Ошибка при загрузке листа уровней:", e);
        return [];
    }
}

// 2. Загрузка списка эдиторов (модераторов)
export async function fetchEditors() {
    try {
        const res = await fetch('./data/_editors.json');
        if (!res.ok) return [];
        return await res.json();
    } catch (e) {
        console.warn("Файл ./data/_editors.json не найден");
        return [];
    }
}

// 3. Загрузка лидерборда игроков
export async function fetchLeaderboard() {
    try {
        let playersOrder = [];
        try {
            const playersOrderRes = await fetch('./data/players.json');
            if (playersOrderRes.ok) playersOrder = await playersOrderRes.json();
        } catch (e) {
            console.error("Не удалось загрузить ./data/players.json", e);
        }

        let profiles = {};
        try {
            const profRes = await fetch('./data/profiles.json');
            if (profRes.ok) profiles = await profRes.json();
        } catch (e) {}

        let levelNames = [];
        try {
            const listRes = await fetch('./data/_list.json');
            if (listRes.ok) levelNames = await listRes.json();
        } catch (e) {
            console.warn("Файл ./data/_list.json не найден");
        }

        const playersMap = {};

        if (Array.isArray(playersOrder)) {
            playersOrder.forEach(name => {
                const key = name.toLowerCase();
                const prof = profiles[key] || profiles[name] || {};

                playersMap[key] = {
                    user: name,
                    avatar: prof.avatar || '',
                    nationality: prof.nationality || prof.hz || '',
                    totalScore: 0,
                    hardest: '',
                    hardestRank: 0,
                    records: [],
                    verified: []
                };
            });
        }

        if (Array.isArray(levelNames)) {
            for (let i = 0; i < levelNames.length; i++) {
                const levelName = levelNames[i];
                const levelRank = i + 1;

                try {
                    const levelRes = await fetch(`./data/${levelName}.json`);
                    if (!levelRes.ok) continue;
                    const levelData = await levelRes.json();
                    const levelPoints = levelData.points || levelData.score || 100;

                    if (levelData.verifier) {
                        const verifierKey = levelData.verifier.toLowerCase();
                        if (!playersMap[verifierKey]) {
                            const prof = profiles[verifierKey] || {};
                            playersMap[verifierKey] = {
                                user: levelData.verifier,
                                avatar: prof.avatar || '',
                                nationality: prof.nationality || prof.hz || '',
                                totalScore: 0,
                                hardest: '',
                                hardestRank: 0,
                                records: [],
                                verified: []
                            };
                        }
                        playersMap[verifierKey].verified.push(levelData.name || levelName);
                    }

                    const recordsList = levelData.records || levelData.vids || [];
                    if (Array.isArray(recordsList)) {
                        recordsList.forEach(rec => {
                            const userKey = rec.user ? rec.user.toLowerCase() : '';
                            if (!userKey) return;

                            if (!playersMap[userKey]) {
                                const prof = profiles[userKey] || {};
                                playersMap[userKey] = {
                                    user: rec.user,
                                    avatar: prof.avatar || '',
                                    nationality: prof.nationality || prof.hz || '',
                                    totalScore: 0,
                                    hardest: '',
                                    hardestRank: 0,
                                    records: [],
                                    verified: []
                                };
                            }

                            if (rec.avatar && !playersMap[userKey].avatar) playersMap[userKey].avatar = rec.avatar;
                            if ((rec.hz || rec.nationality) && !playersMap[userKey].nationality) {
                                playersMap[userKey].nationality = rec.hz || rec.nationality;
                            }

                            const percent = Number(rec.percent || 100);

                            playersMap[userKey].records.push({
                                levelName: levelData.name || levelName,
                                percent: percent,
                                rank: levelRank
                            });

                            const earnedScore = percent === 100 ? levelPoints : (levelPoints * (percent / 100));
                            playersMap[userKey].totalScore += earnedScore;

                            if (percent === 100) {
                                if (!playersMap[userKey].hardestRank || levelRank < playersMap[userKey].hardestRank) {
                                    playersMap[userKey].hardestRank = levelRank;
                                    playersMap[userKey].hardest = levelData.name || levelName;
                                }
                            }
                        });
                    }
                } catch (err) {
                    console.warn(`Не удалось прочитать уровень ${levelName}:`, err);
                }
            }
        }

        const result = [];
        const addedKeys = new Set();

        if (Array.isArray(playersOrder)) {
            playersOrder.forEach(name => {
                const key = name.toLowerCase();
                if (playersMap[key]) {
                    result.push(playersMap[key]);
                    addedKeys.add(key);
                }
            });
        }

        Object.keys(playersMap).forEach(key => {
            if (!addedKeys.has(key)) {
                result.push(playersMap[key]);
            }
        });

        return result;

    } catch (e) {
        console.error("Ошибка при сборке лидерборда:", e);
        return [];
    }
}
