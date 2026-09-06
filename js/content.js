import { score } from "./score.js";

// Безопасный подсчет очков
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

/**
 * Загружает список уровней из _list.json
 */
export async function fetchList() {
    try {
        const listResponse = await fetch("/data/_list.json");
        if (!listResponse.ok) return [];
        const list = await listResponse.json();

        return await Promise.all(
            list.map(async (path, index) => {
                const rank = index + 1;
                try {
                    const levelResponse = await fetch(`/data/${path}.json`);
                    if (!levelResponse.ok) return [null, rank];
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
                    return [null, rank];
                }
            })
        );
    } catch (e) {
        console.error("Ошибка загрузки /data/_list.json:", e);
        return [];
    }
}

/**
 * Загружает список редакторов из _editors.json
 */
export async function fetchEditors() {
    try {
        const response = await fetch("/data/_editors.json");
        if (!response.ok) return [];
        return await response.json();
    } catch (e) {
        console.error("Ошибка загрузки /data/_editors.json:", e);
        return [];
    }
}

/**
 * Собирает лидерборд игроков
 */
export async function fetchLeaderboard() {
    const list = await fetchList();
    const scoreMap = {};

    list.forEach(([level, rank]) => {
        if (!level || !level.records) return;

        for (const record of level.records) {
            const user = record.user;
            if (!user) continue;

            if (!scoreMap[user]) {
                scoreMap[user] = {
                    user: user,
                    nationality: record.nationality || null,
                    avatar: record.avatar || null,
                    totalScore: 0,
                    hardest: null,
                    hardestRank: Infinity,
                    records: [],
                };
            }

            if (!scoreMap[user].nationality && record.nationality) {
                scoreMap[user].nationality = record.nationality;
            }
            if (!scoreMap[user].avatar && record.avatar) {
                scoreMap[user].avatar = record.avatar;
            }

            if (Number(record.percent) === 100) {
                const points = getSafeScore(rank, 100, level.percentToQualify || 100);
                scoreMap[user].totalScore += points;

                if (rank < scoreMap[user].hardestRank) {
                    scoreMap[user].hardestRank = rank;
                    scoreMap[user].hardest = level.name || level.path;
                }

                scoreMap[user].records.push({
                    levelName: level.name || level.path,
                    percent: 100,
                    rank: rank
                });
            }
        }
    });

    return Object.values(scoreMap).sort((a, b) => b.totalScore - a.totalScore);
}
