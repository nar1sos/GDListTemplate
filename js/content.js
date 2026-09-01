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
    if (!list) return [[], []];

    const scoreMap = {};
    const errs = [];

    list.forEach(([level, err], rank) => {
        if (err || !level) {
            if (err) errs.push(err);
            return;
        }

        // Verification (Защита от undefined у verifier)
        const rawVerifier = level.verifier ? String(level.verifier).trim() : null;
        if (rawVerifier) {
            const verifier = Object.keys(scoreMap).find(
                (u) => u.toLowerCase() === rawVerifier.toLowerCase(),
            ) || rawVerifier;

            scoreMap[verifier] ??= {
                verified: [],
                completed: [],
                progressed: [],
            };

            scoreMap[verifier].verified.push({
                rank: rank + 1,
                level: level.name || level.path,
                score: score(rank + 1, 100, level.percentToQualify || 100),
                link: level.verification || '',
            });
        }

        // Records (Защита от undefined у user в рекордах)
        if (Array.isArray(level.records)) {
            level.records.forEach((record) => {
                if (!record || !record.user) return;
                
                const rawUser = String(record.user).trim();
                const user = Object.keys(scoreMap).find(
                    (u) => u.toLowerCase() === rawUser.toLowerCase(),
                ) || rawUser;

                scoreMap[user] ??= {
                    verified: [],
                    completed: [],
                    progressed: [],
                };

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

    // Wrap in extra Object containing the user and total score
    const res = Object.entries(scoreMap).map(([user, scores]) => {
        const { verified, completed, progressed } = scores;
        const total = [verified, completed, progressed]
            .flat()
            .reduce((prev, cur) => prev + (cur.score || 0), 0);

        return {
            user,
            total: round(total),
            ...scores,
        };
    });

    // Sort by total score
    return [res.sort((a, b) => b.total - a.total), errs];
}
