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

        // Собираем все прохождения из records
        const allRecords = [...(level.records || [])];

        // Учитываем верификатора как 100% прохождение, если его еще нет в records
        if (level.verifier) {
            const hasVerifierRecord = allRecords.some(r => r.user === level.verifier);
            if (!hasVerifierRecord) {
                allRecords.push({
                    user: level.verifier,
                    percent: 100,
                    nationality: level.verifierNationality || null
                });
            }
        }

        for (const record of allRecords) {
            const user = record.user;
            if (!user) continue;

            if (!scoreMap[user]) {
                scoreMap[user] = {
                    user: user,
                    nationality: record.nationality || null,
                    totalScore: 0,
                    hardest: null,
                    hardestRank: Infinity,
                    records: [],
                };
            }

            if (!scoreMap[user].nationality && record.nationality) {
                scoreMap[user].nationality = record.nationality;
            }

            const points = getSafeScore(rank, Number(record.percent), level.percentToQualify || 100);
            scoreMap[user].totalScore += points;

            if (Number(record.percent) === 100) {
                if (rank < scoreMap[user].hardestRank) {
                    scoreMap[user].hardestRank = rank;
                    scoreMap[user].hardest = level.name || level.path;
                }

                const alreadyHasLevel = scoreMap[user].records.some(r => r.levelName === (level.name || level.path));
                if (!alreadyHasLevel) {
                    scoreMap[user].records.push({
                        levelName: level.name || level.path,
                        percent: 100,
                        rank: rank
                    });
                }
            }
        }
    });

    return Object.values(scoreMap).sort((a, b) => b.totalScore - a.totalScore);
}
