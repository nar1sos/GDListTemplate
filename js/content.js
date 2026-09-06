import { score } from "./score.js";

function getSafeScore(rank, percent, minPercent) {
    try {
        if (typeof score === 'function') {
            const val = score(rank, percent, minPercent);
            return isNaN(val) ? 0 : val;
        }
    } catch (e) {
        console.warn("Ошибка в функции score():", e);
    }
    return percent === 100 ? Math.max(100 - rank, 10) : 0;
}

export async function fetchList() {
    try {
        const listResponse = await fetch("/data/_list.json");
        if (!listResponse.ok) return [];
        const list = await listResponse.json();

        const results = await Promise.all(
            list.map(async (path, index) => {
                const rank = index + 1;
                try {
                    const levelResponse = await fetch(`/data/${path}.json`);
                    if (!levelResponse.ok) {
                        console.error(`Не удалось загрузить файл уровня: /data/${path}.json`);
                        return null;
                    }
                    const level = await levelResponse.json();
                    return [
                        {
                            ...level,
                            path,
                            records: Array.isArray(level.records) ? level.records : [],
                        },
                        rank,
                    ];
                } catch (e) {
                    console.error(`Ошибка синтаксиса JSON в файле /data/${path}.json:`, e);
                    return null;
                }
            })
        );

        return results.filter(item => item !== null);
    } catch (e) {
        console.error("Ошибка загрузки /data/_list.json:", e);
        return [];
    }
}

export async function fetchEditors() {
    try {
        const response = await fetch("/data/_editors.json");
        if (!response.ok) return [];
        return await response.json();
    } catch (e) {
        return [];
    }
}

export async function fetchLeaderboard() {
    const list = await fetchList();
    const scoreMap = {};

    list.forEach(([level, rank]) => {
        if (!level) return;

        const levelName = level.name || level.path;
        const allRecords = [...(level.records || [])];

        // Добавляем верификатора как игрока
        if (level.verifier) {
            const verifierName = level.verifier;
            
            if (!scoreMap[verifierName]) {
                scoreMap[verifierName] = {
                    user: verifierName,
                    nationality: level.verifierNationality || level.nationality || level.country || null,
                    avatar: level.verifierAvatar || level.avatar || null,
                    totalScore: 0,
                    hardest: null,
                    hardestRank: Infinity,
                    records: [],
                    verified: []
                };
            }

            // Добавляем уровень в список верифицированных
            if (!scoreMap[verifierName].verified.includes(levelName)) {
                scoreMap[verifierName].verified.push(levelName);
            }

            const hasVerifierRecord = allRecords.some(r => r.user === verifierName);
            if (!hasVerifierRecord) {
                allRecords.push({
                    user: verifierName,
                    percent: 100,
                    nationality: level.verifierNationality || level.nationality || level.country || null,
                    avatar: level.verifierAvatar || level.avatar || null
                });
            }
        }

        for (const record of allRecords) {
            const user = record.user;
            if (!user) continue;

            const flag = record.nationality || record.country || null;
            const avatar = record.avatar || null;

            if (!scoreMap[user]) {
                scoreMap[user] = {
                    user: user,
                    nationality: flag,
                    avatar: avatar,
                    totalScore: 0,
                    hardest: null,
                    hardestRank: Infinity,
                    records: [],
                    verified: []
                };
            }

            if (!scoreMap[user].nationality && flag) {
                scoreMap[user].nationality = flag;
            }
            if (!scoreMap[user].avatar && avatar) {
                scoreMap[user].avatar = avatar;
            }

            const points = getSafeScore(rank, Number(record.percent), level.percentToQualify || 100);
            scoreMap[user].totalScore += points;

            if (Number(record.percent) === 100) {
                if (rank < scoreMap[user].hardestRank) {
                    scoreMap[user].hardestRank = rank;
                    scoreMap[user].hardest = levelName;
                }
            }

            const alreadyHasLevel = scoreMap[user].records.some(r => r.levelName === levelName);
            if (!alreadyHasLevel) {
                scoreMap[user].records.push({
                    levelName: levelName,
                    percent: Number(record.percent),
                    rank: rank
                });
            }
        }
    });

    return Object.values(scoreMap).sort((a, b) => b.totalScore - a.totalScore);
}
