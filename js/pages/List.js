import { store } from "../main.js";
import { fetchLeaderboard, fetchList } from "../content.js";
import { localize } from "../util.js";

import Spinner from "../components/Spinner.js";

export default {
    components: {
        Spinner,
    },
    data: () => ({
        leaderboard: [],
        loading: true,
        selected: 0,
        err: [],
        list: [],
    }),
    template: `
        <main v-if="loading">
            <Spinner></Spinner>
        </main>
        <main v-else class="page-leaderboard-container">
            <div class="page-leaderboard">
                <div class="error-container">
                    <p class="error" v-if="err.length > 0">
                        Leaderboard may be incorrect, as the following levels could not be loaded: {{ err.join(', ') }}
                    </p>
                </div>
                <div class="board-container">
                    <table class="board">
                        <tr v-for="(ientry, i) in leaderboard">
                            <td class="rank">
                                <p class="type-label-lg">#{{ i + 1 }}</p>
                            </td>
                            <td class="total">
                                <p class="type-label-lg">{{ localize(ientry.total) }}</p>
                            </td>
                            <td class="user" :class="{ 'active': selected == i }">
                                <button @click="selected = i">
                                    <span class="type-label-lg">{{ ientry.user }}</span>
                                </button>
                            </td>
                        </tr>
                    </table>
                </div>
                <div class="player-container">
                    <div class="player">
                        <h1>#{{ selected + 1 }} {{ entry.user }}</h1>
                        <h3>{{ localize(entry.total) }}</h3>
                        <h2 v-if="entry.verified && entry.verified.length > 0">Verified ({{ entry.verified.length }})</h2>
                        <table class="table" v-if="entry.verified && entry.verified.length > 0">
                            <tr v-for="score in entry.verified">
                                <td class="rank">
                                    <p>#{{ score.rank }}</p>
                                </td>
                                <td class="level">
                                    <a class="type-label-lg" target="_blank" :href="score.link">{{ score.level }}</a>
                                </td>
                                <td class="score">
                                    <p>+{{ localize(score.score) }}</p>
                                </td>
                                <td class="verifier">
                                    <p>{{ score.verifier || 'N/A' }}</p>
                                </td>
                            </tr>
                        </table>
                        <h2 v-if="entry.completed && entry.completed.length > 0">Completed ({{ entry.completed.length }})</h2>
                        <table class="table" v-if="entry.completed && entry.completed.length > 0">
                            <tr v-for="score in entry.completed">
                                <td class="rank">
                                    <p>#{{ score.rank }}</p>
                                </td>
                                <td class="level">
                                    <a class="type-label-lg" target="_blank" :href="score.link">{{ score.level }}</a>
                                </td>
                                <td class="score">
                                    <p>+{{ localize(score.score) }}</p>
                                </td>
                                <td class="verifier">
                                    <p>{{ score.verifier || 'N/A' }}</p>
                                </td>
                            </tr>
                        </table>
                        <h2 v-if="entry.progressed && entry.progressed.length > 0">Progressed ({{ entry.progressed.length }})</h2>
                        <table class="table" v-if="entry.progressed && entry.progressed.length > 0">
                            <tr v-for="score in entry.progressed">
                                <td class="rank">
                                    <p>#{{ score.rank }}</p>
                                </td>
                                <td class="level">
                                    <a class="type-label-lg" target="_blank" :href="score.link">{{ score.percent }}% {{ score.level }}</a>
                                </td>
                                <td class="score">
                                    <p>+{{ localize(score.score) }}</p>
                                </td>
                                <td class="verifier">
                                    <p>{{ score.verifier || 'N/A' }}</p>
                                </td>
                            </tr>
                        </table>
                    </div>
                </div>
            </div>
        </main>
    `,
    computed: {
        entry() {
            return this.leaderboard[this.selected] || { user: 'Unknown', total: 0, verified: [], completed: [], progressed: [] };
        },
    },
    async mounted() {
        try {
            // Загружаем оба набора данных
            const [leaderboardData, err] = await fetchLeaderboard();
            const listData = await fetchList();
            
            this.list = listData || [];
            this.err = err || [];
            
            // Если лидерборд пустой или нет данных, генерируем из list
            if (!leaderboardData || leaderboardData.length === 0) {
                this.leaderboard = this.generateLeaderboardFromList(this.list);
            } else {
                // Объединяем данные из leaderboard.json и list
                this.leaderboard = this.mergeLeaderboardData(leaderboardData, this.list);
            }
        } catch (error) {
            console.error('Failed to load leaderboard:', error);
            this.err = ['Failed to load leaderboard data'];
            
            // Если все упало, генерируем из list
            this.leaderboard = this.generateLeaderboardFromList(this.list);
        } finally {
            this.loading = false;
        }
    },
    methods: {
        localize,
        
        // Генерация лидерборда из списка уровней
        generateLeaderboardFromList(list) {
            const players = {};
            
            list.forEach(([level, err]) => {
                if (!level || err) return;
                
                // Обработка верификатора
                if (level.verifier) {
                    const verifierName = typeof level.verifier === 'string' ? level.verifier : level.verifier.name;
                    if (!players[verifierName]) {
                        players[verifierName] = {
                            user: verifierName,
                            total: 0,
                            verified: [],
                            completed: [],
                            progressed: []
                        };
                    }
                    
                    // Добавляем уровень в верифицированные
                    const rank = this.getLevelRank(list, level);
                    const scoreValue = this.calculateScore(rank);
                    players[verifierName].verified.push({
                        rank: rank,
                        level: level.name,
                        score: scoreValue,
                        link: level.verification || '#',
                        verifier: verifierName
                    });
                    players[verifierName].total += scoreValue;
                }
                
                // Обработка рекордов
                if (level.records && level.records.length > 0) {
                    level.records.forEach(record => {
                        if (!players[record.user]) {
                            players[record.user] = {
                                user: record.user,
                                total: 0,
                                verified: [],
                                completed: [],
                                progressed: []
                            };
                        }
                        
                        const rank = this.getLevelRank(list, level);
                        const scoreValue = this.calculateScore(rank);
                        
                        if (record.percent >= level.percentToQualify) {
                            players[record.user].completed.push({
                                rank: rank,
                                level: level.name,
                                score: scoreValue,
                                link: record.link || '#',
                                verifier: level.verifier ? (typeof level.verifier === 'string' ? level.verifier : level.verifier.name) : 'N/A'
                            });
                            players[record.user].total += scoreValue;
                        } else {
                            players[record.user].progressed.push({
                                rank: rank,
                                percent: record.percent,
                                level: level.name,
                                score: Math.round(scoreValue * (record.percent / 100)),
                                link: record.link || '#',
                                verifier: level.verifier ? (typeof level.verifier === 'string' ? level.verifier : level.verifier.name) : 'N/A'
                            });
                            players[record.user].total += Math.round(scoreValue * (record.percent / 100));
                        }
                    });
                }
            });
            
            // Сортируем по total и возвращаем как массив
            return Object.values(players).sort((a, b) => b.total - a.total);
        },
        
        // Получение ранга уровня
        getLevelRank(list, targetLevel) {
            const index = list.findIndex(([level]) => level && level.name === targetLevel.name);
            return index !== -1 ? index + 1 : 999;
        },
        
        // Расчет очков для уровня
        calculateScore(rank) {
            if (rank <= 75) return 100;
            if (rank <= 150) return 50;
            return 0;
        },
        
        // Объединение данных из leaderboard.json и list
        mergeLeaderboardData(leaderboardData, list) {
            // Если есть leaderboard.json, используем его как основу
            const merged = [...leaderboardData];
            
            // Добавляем недостающих игроков из list
            const existingUsers = new Set(merged.map(p => p.user));
            const generated = this.generateLeaderboardFromList(list);
            
            generated.forEach(player => {
                if (!existingUsers.has(player.user)) {
                    merged.push(player);
                }
            });
            
            // Сортируем по total
            return merged.sort((a, b) => b.total - a.total);
        }
    }
};
