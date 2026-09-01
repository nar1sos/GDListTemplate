import { round, score } from './score.js';

/**
 * Path to directory containing `_list.json` and all levels
 */
const dir = '/data';

export async function fetchList() {
    const listResult = await fetch(`${dir}/_list.json`);
    try {
        const list = await listResult.json();
        return await Promise.all(
            list.map(async (path, rank) => {
                const levelResult = await fetch(`${dir}/${path}.json`);
                try {
                    const level = await levelResult.json();
                    return [
                        {
                            ...level,
                            path,
                            records: Array.isArray(level.records)
                                ? level.records.sort((a, b) => (b.percent || 0) - (a.percent || 0))
                                : [],
                        },
                        null,
                    ];
                } catch {
                    console.error(`Failed to load level #${rank + 1} ${path}.`);
                    return [null, path];
                }
            }),
        );
    } catch {
        console.error(`Failed to load list.`);
        return null;
    }
}

export async function fetchEditors() {
    try {
        const editorsResults = await fetch(`${dir}/_editors.json`);
        const editors = await editorsResults.json();
        return editors;
    } catch {
        return null;
    }
}

export async function fetchLeaderboard() {
    const list = await fetchList();
    if (!list) return [[], [], []];

    const scoreMap = {};
    const countryMap = {};
    const errs = [];

    list.forEach(([level, err], rank) => {
        if (err || !level) {
            if (err) errs.push(err);
            return;
        }

        // Верификатор
        const rawVerifier = level.verifier ? String(level.verifier).trim() : null;
        if (rawVerifier) {
            const verifier = Object.keys(scoreMap).find(
                (u) => u.toLowerCase() === rawVerifier.toLowerCase(),
            ) || rawVerifier;

            scoreMap[verifier] ??= {
                country: level.country || null,
                verified: [],
                completed: [],
                progressed: [],
            };

            if (level.country) scoreMap[verifier].country = level.country;

            scoreMap[verifier].verified.push({
                rank: rank + 1,
                level: level.name || level.path,
                score: score(rank + 1, 100, level.percentToQualify || 100),
                link: level.verification || '',
            });
        }

        // Рекорды
        if (Array.isArray(level.records)) {
            level.records.forEach((record) => {
                if (!record || !record.user) return;
                
                const rawUser = String(record.user).trim();
                const user = Object.keys(scoreMap).find(
                    (u) => u.toLowerCase() === rawUser.toLowerCase(),
                ) || rawUser;

                scoreMap[user] ??= {
                    country: record.country || null,
                    verified: [],
                    completed: [],
                    progressed: [],
                };

                if (record.country) scoreMap[user].country = record.country;

                const { completed, progressed } = scoreMap[user];
                const recPercent = record.percent || 0;

                if (recPercent === 100) {
                    completed.push({
                        rank: rank + 1,
                        level: level.name || level.path,
                        score: score(rank + 1, 100, level.percentToQualify || 100),
                        link: record.link || '',
                    });
                } else {
                    progressed.push({
                        rank: rank + 1,
                        level: level.name || level.path,
                        percent: recPercent,
                        score: score(rank + 1, recPercent, level.percentToQualify || 100),
                        link: record.link || '',
                    });
                }
            });
        }
    });

    const res = Object.entries(scoreMap).map(([user, data]) => {
        const { verified, completed, progressed, country } = data;
        const total = [verified, completed, progressed]
            .flat()
            .reduce((prev, cur) => prev + (cur.score || 0), 0);

        const totalScore = round(total);

        if (country) {
            const code = String(country).toLowerCase();
            countryMap[code] = (countryMap[code] || 0) + totalScore;
        }

        return {
            user,
            country: country ? String(country).toLowerCase() : null,
            total: totalScore,
            verified,
            completed,
            progressed,
        };
    }).sort((a, b) => b.total - a.total);

    const countryLeaderboard = Object.entries(countryMap)
        .map(([code, total]) => ({ code, total: round(total) }))
        .sort((a, b) => b.total - a.total);

    return [res, errs, countryLeaderboard];
}
