// 1. Загрузка списка уровней для главной страницы (List.js)
export async function fetchList() {
    try {
        const listReq = await fetch('./data/_list.json');
        const levelFiles = await listReq.json();

        const levels = await Promise.all(
            levelFiles.map(async (file, index) => {
                try {
                    const res = await fetch(`./data/${file}.json`);
                    const data = await res.json();
                    
                    // Гарантируем, что records всегда массив
                    const recordsArray = Array.isArray(data.records) ? data.records : [];

                    return {
                        ...data,
                        rank: index + 1,
                        name: data.name || file,
                        author: data.author || "Unknown",
                        verifier: data.verifier || "Unknown",
                        ytid: data.ytid || "",
                        percentToQualify: data.percentToQualify || 100,
                        records: recordsArray,
                        path: file
                    };
                } catch (e) {
                    console.error(`Ошибка чтения файла уровня ${file}:`, e);
                    return null;
                }
            })
        );

        return levels.filter(lvl => lvl !== null);
    } catch (e) {
        console.error("Ошибка загрузки _list.json:", e);
        return [];
    }
}

// 2. Загрузка редакторов/модераторов
export async function fetchEditors() {
    try {
        const res = await fetch('./data/_editors.json');
        if (!res.ok) return [];
        return await res.json();
    } catch (e) {
        console.warn("Файл _editors.json не найден.");
        return [];
    }
}

// 3. Загрузка Лидерборда (уровни + отдельные файлы игроков)
export async function fetchLeaderboard() {
    try {
        const playersMap = {};

        // А. Пытаемся подгрузить файл зарегистрированных игроков (_players.json или _leaderboard.json)
        let staticPlayers = [];
        try {
            const pRes = await fetch('./data/_players.json');
            if (pRes.ok) {
                staticPlayers = await pRes.json();
            }
        } catch (e) {
            // если файла _players.json нет, проверяем _leaderboard.json
            try {
                const pRes2 = await fetch('./data/_leaderboard.json');
                if (pRes2.ok) staticPlayers = await pRes2.json();
            } catch (err) {}
        }

        // Заносим статических игроков в карту
        if (Array.isArray(staticPlayers)) {
            staticPlayers.forEach(p => {
                const name = p.name || p.user;
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

        // Б. Сканируем файлы уровней из _list.json
        const listReq = await fetch('./data/_list.json');
        const levelFiles = await listReq.json();

        for (const file of levelFiles) {
            try {
                const res = await fetch(`./data/${file}.json`);
                const levelData = await res.json();

                // 1. Верификатор
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
                    if (!playersMap[vName].verified.includes(levelData.name || file)) {
                        playersMap[vName].verified.push(levelData.name || file);
                    }
                }

                // 2. Рекорды из файлов уровней
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

                        if (!playersMap[pName].avatar && rec.avatar) {
                            playersMap[pName].avatar = rec.avatar;
                        }

                        const exists = playersMap[pName].records.some(
                            r => (r.levelName || r) === (levelData.name || file)
                        );
                        if (!exists) {
                            playersMap[pName].records.push({
                                levelName: levelData.name || file,
                                percent: rec.percent || 100,
                                hz: rec.hz || 60,
                                link: rec.link || '',
                                country: rec.country || rec.nationality || rec.nation || null
                            });
                        }
                    }
                }
            } catch (err) {
                console.error(`Ошибка загрузки уровня ${file}:`, err);
            }
        }

        const leaderboard = Object.values(playersMap);

        // Сортировка по очкам/рекордам
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
        console.error("Ошибка генерации лидерборда:", e);
        return [];
    }
}
