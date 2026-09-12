/**
 * js/content.js
 */

// 1. Загрузка списка всех демонов для листа уровней
export async function fetchList() {
    try {
        const listRes = await fetch('/data/list.json');
        if (!listRes.ok) return [];
        const levelNames = await listRes.json();

        // Загружаем данные каждого уровня параллельно
        const list = await Promise.all(
            levelNames.map(async (name, index) => {
                try {
                    const res = await fetch(`/data/${name}.json`);
                    if (!res.ok) return null;
                    const data = await res.json();
                    return {
                        ...data,
                        rank: index + 1,
                        path: name
                    };
                } catch (e) {
                    console.warn(`Не удалось загрузить уровень: ${name}`, e);
                    return null;
                }
            })
        );

        return list.filter(item => item !== null);
    } catch (e) {
        console.error("Ошибка при загрузке листа уровней:", e);
        return [];
    }
}

// 2. Загрузка списка эдиторов (модераторов)
export async function fetchEditors() {
    try {
        const res = await fetch('/data/editors.json');
        if (!res.ok) return [];
        return await res.json();
    } catch (e) {
        console.error("Ошибка при загрузке editors.json:", e);
        return [];
    }
}

// 3. Загрузка лидерборда игроков (порядок СТРОГО из players.json)
export async function fetchLeaderboard() {
    try {
        // 1. Загружаем твой ручной порядок игроков из players.json
        let playersOrder = [];
        try {
            const playersOrderRes = await fetch('/data/players.json');
            if (playersOrderRes.ok) playersOrder = await playersOrderRes.json();
        } catch (e) {
            console.error("Не удалось загрузить /data/players.json", e);
        }

        // 2. Загружаем кастомные профили (аватарки и флаги)
        let profiles = {};
        try {
            const profRes = await fetch('/data/profiles.json');
            if (profRes.ok) profiles = await profRes.json();
        } catch (e) {}

        // 3. Загружаем список уровней (с защитой от 404)
        let levelNames = [];
        try {
            const listRes = await fetch('/data/list.json');
            if (listRes.ok) levelNames = await listRes.json();
        } catch (e) {
            console.warn("Файл /data/list.json не найден, продолжение без уровней");
        }

        const playersMap = {};

        // Инициализируем ВСЕХ игроков из players.json (даже с 0 рекордов)
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

        // 4. Сканируем файлы уровней и привязываем рекорды к игрокам
        for (let i = 0; i < levelNames.length; i++) {
            const levelName = levelNames[i];
            const levelRank = i + 1;

            try {
                const levelRes = await fetch(`/data/${levelName}.json`);
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

                    // Если игрока еще не было в карте, создаем его
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
            } catch (err) {
                console.warn(`Не удалось прочитать уровень ${levelName}:`, err);
            }
        }

        // 5. Формируем итоговый массив СТРОГО в твоем порядке из players.json
        const result = [];
        const addedKeys = new Set();

        playersOrder.forEach(name => {
            const key = name.toLowerCase();
            if (playersMap[key]) {
                result.push(playersMap[key]);
                addedKeys.add(key);
            }
        });

        // Добавляем игроков, которые есть в уровнях, но отсутствуют в players.json
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
