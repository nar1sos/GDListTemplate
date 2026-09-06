export async function fetchLeaderboard() {
    const list = await fetchList();
    const scoreMap = {};

    list.forEach(([level, rank]) => {
        if (!level) return;

        const allRecords = [...(level.records || [])];

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
                    nationality: record.nationality || record.country || null,
                    avatar: record.avatar || null,
                    totalScore: 0,
                    hardest: null,
                    hardestRank: Infinity,
                    records: [],
                };
            }

            // Если у юзера еще не сохранен флаг или аватар — подтягиваем из текущего рекорда
            if (!scoreMap[user].nationality && (record.nationality || record.country)) {
                scoreMap[user].nationality = record.nationality || record.country;
            }
            if (!scoreMap[user].avatar && record.avatar) {
                scoreMap[user].avatar = record.avatar;
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
