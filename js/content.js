import { score } from "./score.js";

// Безопасный подсчет очков (если score.js не загрузился или выдал NaN)
function getSafeScore(rank, percent, minPercent) {
    try {
        if (typeof score === 'function') {
            const val = score(rank, percent, minPercent);
            return isNaN(val) ? 0 : val;
        }
    } catch (e) {
        console.warn("Ошибка в функция score():", e);
    }
    // Простой фоллбек на случай ошибки в score.js
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
            list.map(async (path, rank) => {
                try {
                    const levelResponse = await fetch(`/data/${path}.json`);
                    if (!levelResponse.ok) return [null, rank + 1];
                    const level = await levelResponse.json();
                    return [
                        {
                            ...level,
                            path,
                            records: Array.isArray(level.records) ? level.records : [],
                        },
                        rank + 1,
                    ];
                } catch (e) {
                    return [null, rank + 1];
                }
            })
        );
    } catch (e) {
        console.error("Ошибка загрузки /data/_list.json:", e);
        return [];
    }
}

/**
 * Собирает лидерборд напрямую из файлов уровней
 */
export async function fetchLeaderboard() {
    const list = await fetchList();
    const scoreMap = {};

    for (const item of list) {
        if (!item || !item[0]) continue;
        const level = item[0];
        const rank = item[1];

        if (!level.records) continue;

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

            // Подтягиваем флаг и аву, если появились в следующих записях
            if (!scoreMap[user].nationality && record.nationality) {
                scoreMap[user].nationality = record.nationality;
            }
            if (!scoreMap[user].avatar && record.avatar) {
                scoreMap[user].avatar = record.avatar;
            }

            // Подсчет 100% прохождений
            if (Number(record.percent) === 100) {
                const points = getSafeScore(rank, 100, level.percentToQualify || 100);
                scoreMap[user].totalScore += points;

                if (rank < scoreMap[user].hardestRank) {
                    scoreMap[user].hardestRank = rank;
                    scoreMap[user].hardest = level.name;
                }

                scoreMap[user].records.push({
                    levelName: level.name || level.path,
                    percent: 100,
                    rank: rank
                });
            }
        }
    }

    return Object.values(scoreMap).sort((a, b) => b.totalScore - a.totalScore);
}
