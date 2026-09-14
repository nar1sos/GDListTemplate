// Функция извлечения YouTube ID из любых ссылок
function parseYoutubeId(urlOrId) {
    if (!urlOrId) return '';
    if (typeof urlOrId !== 'string') return '';
    
    const str = urlOrId.trim();
    if (str.length === 11 && !str.includes('/') && !str.includes('.')) {
        return str;
    }
    const regExp = /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/;
    const match = str.match(regExp);
    return (match && match[1]) ? match[1] : '';
}

// Загрузка списка уровней (_list.json)
export async function fetchList() {
    try {
        const listReq = await fetch('./data/_list.json');
        if (!listReq.ok) return [];
        const levelFiles = await listReq.json();

        const list = await Promise.all(
            levelFiles.map(async (file, index) => {
                try {
                    const res = await fetch(`./data/${file}.json`);
                    if (!res.ok) return null;
                    const data = await res.json();
                    
                    const rawYt = data.verification || data.ytid || data.video || data.link || data.youtube || '';
                    
                    return {
                        ...data,
                        ytid: parseYoutubeId(rawYt),
                        rank: index + 1,
                        path: file
                    };
                } catch (e) {
                    console.error(`Error loading level ${file}:`, e);
                    return null;
                }
            })
        );

        return list.filter(item => item !== null);
    } catch (e) {
        console.error("Error in fetchList:", e);
        return [];
    }
}

// Загрузка редакторов (_editors.json)
export async function fetchEditors() {
    try {
        const res = await fetch('./data/_editors.json');
        if (!res.ok) return [];
        return await res.json();
    } catch (e) {
        console.warn("Файл _editors.json не найден:", e);
        return [];
    }
}

// Загрузка и генерация лидерборда игроков
export async function fetchLeaderboard() {
    try {
        const playersMap = {};
        const playerOrder = []; // Строгий порядок из файлов игроков

        const registerPlayer = (rawName, pData = {}) => {
            if (!rawName) return null;
            const name = String(rawName).trim();
            if (!name) return null;

            if (!playersMap[name]) {
                playersMap[name] = {
                    user: name,
                    country: pData.country || pData.nationality || pData.nation || null,
                    avatar: pData.avatar || pData.icon || pData.photo || null,
                    verified: Array.isArray(pData.verified) ? pData.verified : [],
                    records: Array.isArray(pData.records) ? pData.records : []
                };
            } else {
                if (!playersMap[name].country && (pData.country || pData.nationality || pData.nation)) {
                    playersMap[name].country = pData.country || pData.nationality || pData.nation;
                }
                if (!playersMap[name].avatar && (pData.avatar || pData.icon || pData.photo)) {
                    playersMap[name].avatar = pData.avatar || pData.icon || pData.photo;
                }
            }
            return playersMap[name];
        };

        // 1. Читаем точные файлы: сначала players.json (топ), затем profiles.json
        const targetFiles = [
            './data/players.json',
            './data/profiles.json'
        ];

        for (const filePath of targetFiles) {
            try {
                const res = await fetch(filePath);
                if (res.ok) {
                    const data = await res.json();
                    const list = Array.isArray(data) ? data : (data.players || data.users || []);
                    
                    list.forEach(p => {
                        const name = typeof p === 'string' ? p : (p.name || p.user || p.username || p.player);
                        if (name) {
                            registerPlayer(name, typeof p === 'object' ? p : {});
                            if (!playerOrder.includes(name)) {
                                playerOrder.push(name);
                            }
                        }
                    });
                }
            } catch (err) {
                console.error(`Error loading ${filePath}:`, err);
            }
        }

        // 2. Сканируем уровни для привязки рекордов и верификаций
        try {
            const listReq = await fetch('./data/_list.json');
            if (listReq.ok) {
                const levelFiles = await listReq.json();

                for (let index = 0; index < levelFiles.length; index++) {
                    const file = levelFiles[index];
                    const rank = index + 1;

                    try {
                        const res = await fetch(`./data/${file}.json`);
                        if (!res.ok) continue;
                        const levelData = await res.json();
                        const levelName = levelData.name || file;

                        // Верификатор
                        if (levelData.verifier && playersMap[levelData.verifier]) {
                            const pObj = playersMap[levelData.verifier];
                            const exists = pObj.verified.some(
                                v => (typeof v === 'string' ? v : v.levelName) === levelName
                            );
                            if (!exists) {
                                pObj.verified.push({ levelName, rank });
                            }
                        }

                        // Рекорды
                        if (Array.isArray(levelData.records)) {
                            for (const rec of levelData.records) {
                                const recUser = rec.user || rec.name || rec.username;
                                if (recUser && playersMap[recUser]) {
                                    const pObj = playersMap[recUser];
                                    const exists = pObj.records.some(
                                        r => (typeof r === 'string' ? r : r.levelName) === levelName
                                    );

                                    if (!exists) {
                                        pObj.records.push({
                                            levelName,
                                            percent: rec.percent || 100,
                                            hz: rec.hz || 60,
                                            link: rec.link || rec.video || '',
                                            rank
                                        });
                                    }
                                }
                            }
                        }
                    } catch (err) {}
                }
            }
        } catch (err) {}

        // 3. Собираем массив строго в порядке из players.json и profiles.json
        return playerOrder.map(name => {
            const p = playersMap[name];
            let hardestItem = null;

            if (Array.isArray(p.verified)) {
                p.verified.forEach(v => {
                    const rank = typeof v === 'object' && v.rank ? v.rank : 9999;
                    const levelName = typeof v === 'object' ? v.levelName : v;
                    if (!hardestItem || rank < hardestItem.rank) hardestItem = { levelName, rank };
                });
            }

            if (Array.isArray(p.records)) {
                p.records.forEach(r => {
                    const rank = typeof r === 'object' && r.rank ? r.rank : 9999;
                    const levelName = typeof r === 'object' ? r.levelName : r;
                    const percent = typeof r === 'object' && r.percent !== undefined ? r.percent : 100;
                    if (percent === 100 && (!hardestItem || rank < hardestItem.rank)) {
                        hardestItem = { levelName, rank };
                    }
                });
            }

            p.hardest = hardestItem ? hardestItem.levelName : 'None';
            return p;
        });
    } catch (e) {
        console.error("Error in fetchLeaderboard:", e);
        return [];
    }
}
