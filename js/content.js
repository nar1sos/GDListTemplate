// Функция загрузки лидерборда с переносом страны (country) из уровней к игроку
export async function fetchLeaderboard() {
    try {
        // Загружаем список всех файлов уровней из /data/_list.json или напрямую
        const listReq = await fetch('./data/_list.json');
        const levelFiles = await listReq.json();

        const playersMap = {};

        for (const file of levelFiles) {
            try {
                const res = await fetch(`./data/${file}.json`);
                const levelData = await res.json();

                // 1. Проверяем верификатора уровня
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
                    playersMap[vName].verified.push(levelData.name || file);
                }

                // 2. Проверяем рекорды других игроков в этом уровне
                if (Array.isArray(levelData.records)) {
                    for (const rec of levelData.records) {
                        const pName = rec.user;
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

                        // Сохраняем страну, если она есть в рекорде
                        if (!playersMap[pName].country && (rec.country || rec.nationality || rec.nation)) {
                            playersMap[pName].country = rec.country || rec.nationality || rec.nation;
                        }

                        // Сохраняем аватар, если есть
                        if (!playersMap[pName].avatar && rec.avatar) {
                            playersMap[pName].avatar = rec.avatar;
                        }

                        playersMap[pName].records.push({
                            levelName: levelData.name || file,
                            percent: rec.percent || 100,
                            hz: rec.hz || 60,
                            link: rec.link || ''
                        });
                    }
                }
            } catch (err) {
                console.error(`Ошибка загрузки уровня ${file}:`, err);
            }
        }

        // Преобразуем объект в массив и сортируем
        const leaderboard = Object.values(playersMap);

        // Пример простейшей сортировки: по количеству рекордов + верификаций
        leaderboard.sort((a, b) => {
            const scoreA = (a.verified ? a.verified.length * 2 : 0) + (a.records ? a.records.length : 0);
            const scoreB = (b.verified ? b.verified.length * 2 : 0) + (b.records ? b.records.length : 0);
            return scoreB - scoreA;
        });

        // Назначаем hardest уровень для каждого
        leaderboard.forEach(p => {
            if (p.verified && p.verified.length > 0) {
                p.hardest = p.verified[0];
            } else if (p.records && p.records.length > 0) {
                p.hardest = p.records[0].levelName;
            }
        });

        return leaderboard;
    } catch (e) {
        console.error("Ошибка генерации лидерборда:", e);
        return [];
    }
}
