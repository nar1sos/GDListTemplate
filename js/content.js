/**
 * js/content.js
 */

// 1. Загрузка списка уровней
export async function fetchList() {
    try {
        const res = await fetch('./data/list.json');
        if (!res.ok) return [];
        return await res.json();
    } catch (e) {
        console.error("Ошибка при загрузке list.json:", e);
        return [];
    }
}

// 2. Загрузка списка эдиторов (редакторов/модераторов)
export async function fetchEditors() {
    try {
        const res = await fetch('./data/editors.json');
        if (!res.ok) return [];
        return await res.json();
    } catch (e) {
        console.error("Ошибка при загрузке editors.json:", e);
        return [];
    }
}

// 3. Загрузка лидерборда игроков
export async function fetchLeaderboard() {
    try {
        // 1. Порядок игроков
        const playersOrderRes = await fetch('./data/players.json');
        if (!playersOrderRes.ok) throw new Error('Не удалось загрузить data/players.json');
        const playersOrder = await playersOrderRes.json();

        // 2. Кастомные профили (для тех, у кого 0 рекордов)
        let profiles = {};
        try {
            const profRes = await fetch('./data/profiles.json');
            if (profRes.ok) profiles = await profRes.json();
        } catch (e) {}

        // 3. Список уровней
        const levelNames = await fetchList();

        const playersMap = {};

        // Инициализируем карту
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

        // 4. Сканируем файлы уровней
        for (let i = 0; i < levelNames.length; i++) {
            const levelName = levelNames[i];
            const levelRank = i + 1;

            try {
                const levelRes = await fetch(`./data/${levelName}.json`);
                if (!levelRes.ok) continue;
                const levelData = await levelRes.json();
                const levelPoints = levelData.points || levelData.score || 100;

                // --- Верификатор ---
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

                // --- Рекорды ---
                const recordsList = levelData.records || levelData.vids || [];
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

                    if (rec.avatar) playersMap[userKey].avatar = rec.avatar;
                    if (rec.hz || rec.nationality) playersMap[userKey].nationality = rec.hz || rec.nationality;

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
            } catch (err) {
                console.warn(`Не удалось прочитать уровень ${levelName}:`, err);
            }
        }

        // 5. Возвращаем массив в порядке из players.json
        return playersOrder.map(name => {
            const key = name.toLowerCase();
            return playersMap[key] || {
                user: name,
                avatar: '',
                nationality: '',
                totalScore: 0,
                hardest: '',
                hardestRank: 0,
                records: [],
                verified: []
            };
        });

    } catch (e) {
        console.error("Ошибка при сборке лидерборда:", e);
        return [];
    }
}
