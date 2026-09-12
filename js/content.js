export async function fetchLeaderboard() {
    try {
        const playersMap = {};

        // 1. СПИСОК ВОЗМОЖНЫХ ИМЕН ФАЙЛА ИГРОКОВ
        const possiblePlayerFiles = [
            './data/_players.json',
            './data/_leaderboard.json',
            './data/players.json',
            './data/leaderboard.json',
            './data/_users.json'
        ];

        let staticPlayers = [];

        // Пробуем по очереди загрузить файл игроков
        for (const filePath of possiblePlayerFiles) {
            try {
                const res = await fetch(filePath);
                if (res.ok) {
                    staticPlayers = await res.json();
                    console.log(`Успешно загружен файл игроков: ${filePath}`);
                    break; // Нашли файл — выходим из цикла
                }
            } catch (err) {
                // Игнорируем 404 и пробуем следующий
            }
        }

        // Заносим игроков из файла в общую базу
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

        // 2. ДОБАВЛЯЕМ ДАННЫЕ ИЗ ФАЙЛОВ УРОВНЕЙ (_list.json)
        try {
            const listReq = await fetch('./data/_list.json');
            if (listReq.ok) {
                const levelFiles = await listReq.json();

                for (const file of levelFiles) {
                    try {
                        const res = await fetch(`./data/${file}.json`);
                        if (!res.ok) continue;
                        const levelData = await res.json();

                        // А. Верификатор
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

                        // Б. Рекорды из уровня
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
                    } catch (err) {
                        console.error(`Ошибка обработки ${file}:`, err);
                    }
                }
            }
        } catch (err) {
            console.error("Ошибка загрузки _list.json в лидерборде:", err);
        }

        const leaderboard = Object.values(playersMap);

        // Сортировка игроков по количеству зачтенных уровней/рекордов
        leaderboard.sort((a, b) => {
            const scoreA = (a.verified ? a.verified.length * 2 : 0) + (a.records ? a.records.length : 0);
            const scoreB = (b.verified ? b.verified.length * 2 : 0) + (b.records ? b.records.length : 0);
            return scoreB - scoreA;
        });

        // Определяем Hardest level
        leaderboard.forEach(p => {
            if (p.verified && p.verified.length > 0) {
                p.hardest = typeof p.verified[0] === 'string' ? p.verified[0] : p.verified[0].levelName;
            } else if (p.records && p.records.length > 0) {
                p.hardest = typeof p.records[0] === 'string' ? p.records[0] : p.records[0].levelName;
            }
        });

        return leaderboard;
    } catch (e) {
        console.error("Ошибка генерации лидерборда:", e);
        return [];
    }
}
