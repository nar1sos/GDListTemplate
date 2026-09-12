/**
 * Загрузка лидерборда игроков
 */
export async function fetchLeaderboard() {
    try {
        // 1. Загружаем порядок игроков
        const playersOrderRes = await fetch('./data/players.json');
        if (!playersOrderRes.ok) throw new Error('Не удалось загрузить data/players.json');
        const playersOrder = await playersOrderRes.json();

        // 2. Загружаем кастомные профили (если есть)
        let profiles = {};
        try {
            const profRes = await fetch('./data/profiles.json');
            if (profRes.ok) profiles = await profRes.json();
        } catch (e) {}

        // 3. Загружаем список уровней
        const listRes = await fetch('./data/list.json');
        if (!listRes.ok) throw new Error('Не удалось загрузить data/list.json');
        const levelNames = await listRes.json();

        const playersMap = {};

        // Инициализируем карту игроками из players.json
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

        // 4. Сканируем файлы уровней и собираем рекорды
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

                    // Обновляем аву и флаг из записи рекорда, если они там указаны
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

        // 5. Возвращаем массив в точном порядке из players.json
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
