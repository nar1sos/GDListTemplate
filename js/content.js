import { score } from "./score.js";

/**
 * Загружает список уровней из файла _list.json
 */
export async function fetchList() {
    try {
        const listResponse = await fetch("/data/_list.json");
        const list = await listResponse.json();

        return await Promise.all(
            list.map(async (path, rank) => {
                try {
                    const levelResponse = await fetch(`/data/${path}.json`);
                    const level = await levelResponse.json();
                    return [
                        {
                            ...level,
                            path,
                            records: level.records || [],
                        },
                        rank + 1,
                    ];
                } catch {
                    return [null, rank + 1];
                }
            })
        );
    } catch {
        return [];
    }
}

/**
 * Собирает табличку лидеров напрямую из файлов уровней
 */
export async function fetchLeaderboard() {
    const list = await fetchList();
    const scoreMap = {};

    for (const [level, rank] of list) {
        if (!level || !level.records) continue;

        for (const record of level.records) {
            const user = record.user;
            if (!user) continue;

            // Если игрок встречается в первый раз — создаем запись
            if (!scoreMap[user]) {
                scoreMap[user] = {
                    user,
                    nationality: record.nationality || null,
                    avatar: record.avatar || null,
                    totalScore: 0,
                    hardest: null,
                    hardestRank: Infinity,
                    records: [],
                };
            }

            // Если у игрока еще нет флага или авы в базе, но они указаны в текущем рекорде
            if (!scoreMap[user].nationality && record.nationality) {
                scoreMap[user].nationality = record.nationality;
            }
            if (!scoreMap[user].avatar && record.avatar) {
                scoreMap[user].avatar = record.avatar;
            }

            // Расчет очков за рекорд (если пройден на 100%)
            if (record.percent === 100) {
                const points = score(rank, 100, level.percentToQualify || 100);
                scoreMap[user].totalScore += points;

                // Определение храненения хардста (чем меньше rank, тем выше лвл)
                if (rank < scoreMap[user].hardestRank) {
                    scoreMap[user].hardestRank = rank;
                    scoreMap[user].hardest = level.name;
                }

                scoreMap[user].records.push({
                    levelName: level.name,
                    percent: 100,
                    rank: rank
                });
            }
        }
    }

    // Сортируем игроков по очкам
    return Object.values(scoreMap).sort((a, b) => b.totalScore - a.totalScore);
}
