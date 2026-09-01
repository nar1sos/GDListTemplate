import { fetchLeaderboard } from '../content.js';
import { localize } from '../util.js';
import Spinner from '../components/Spinner.js';

export default {
    components: {
        Spinner,
    },
    data: () => ({
        leaderboard: [],
        loading: true,
        selected: 0,
        err: [],
        debugError: null,
    }),
    template: `
        <main v-if="loading">
            <Spinner></Spinner>
        </main>
        <main v-else-if="debugError" class="page-leaderboard-container">
            <div style="padding: 2rem; color: #ff5555; background: #1e1e1e; border-radius: 8px;">
                <h2>Ошибка при загрузке Лидерборда:</h2>
                <pre>{{ debugError }}</pre>
            </div>
        </main>
        <main v-else class="page-leaderboard-container">
            <div class="page-leaderboard">
                <div class="error-container" v-if="err && err.length > 0">
                    <p class="error">
                        Не удалось загрузить следующие уровни: {{ err.join(', ') }}
                    </p>
                </div>

                <div class="board-container">
                    <ul class="board-list">
                        <li 
                            v-for="(ientry, i) in leaderboard" 
                            :key="i"
                            class="board-item"
                            :class="{ 'active': selected === i }"
                            @click="selected = i"
                        >
                            <span class="rank-label">#{{ i + 1 }}</span>
                            <span class="user-name">{{ ientry.user }}</span>
                            <span class="total-score">{{ localize(ientry.total) }}</span>
                        </li>
                    </ul>
                </div>

                <div class="player-container" v-if="entry">
                    <div class="player-profile">
                        <div class="profile-header">
                            <div class="profile-avatar"></div>
                            <h1 class="profile-name">{{ entry.user }}</h1>
                        </div>

                        <div class="stats-grid">
                            <div class="stat-card">
                                <span class="stat-icon trophy-icon">🏆</span>
                                <div class="stat-info">
                                    <div class="stat-value">#{{ selected + 1 }}</div>
                                    <div class="stat-label">Rank</div>
                                </div>
                            </div>
                            <div class="stat-card">
                                <span class="stat-icon score-icon">✦</span>
                                <div class="stat-info">
                                    <div class="stat-value">{{ localize(entry.total) }}</div>
                                    <div class="stat-label">Score</div>
                                </div>
                            </div>
                        </div>

                        <div class="hardest-card" v-if="hardestLevel">
                            <div class="hardest-header">
                                <span class="fire-icon">🔥</span>
                                <span class="hardest-label">Hardest level</span>
                            </div>
                            <div class="hardest-content">
                                <span class="hardest-rank">#{{ hardestLevel.rank }}</span>
                                <a :href="hardestLevel.link" target="_blank" class="hardest-title">{{ hardestLevel.level }}</a>
                            </div>
                        </div>

                        <div class="levels-category" v-if="allCompletedLevels.length > 0">
                            <div class="category-header">
                                <div class="category-title">
                                    <span class="star-icon">★</span>
                                    <span>Main levels</span>
                                </div>
                                <span class="badge">{{ allCompletedLevels.length }}</span>
                            </div>
                            <div class="chips-container">
                                <a 
                                    v-for="(score, idx) in allCompletedLevels" 
                                    :key="idx" 
                                    :href="score.link" 
                                    target="_blank" 
                                    class="level-chip"
                                >
                                    {{ score.level }}
                                </a>
                            </div>
                        </div>

                        <div class="levels-category" v-if="entry.progressed && entry.progressed.length > 0">
                            <div class="category-header">
                                <div class="category-title">
                                    <span class="infinity-icon">∞</span>
                                    <span>Progressed levels</span>
                                </div>
                                <span class="badge">{{ entry.progressed.length }}</span>
                            </div>
                            <div class="chips-container">
                                <a 
                                    v-for="(score, idx) in entry.progressed" 
                                    :key="idx" 
                                    :href="score.link" 
                                    target="_blank" 
                                    class="level-chip chip-progress"
                                >
                                    {{ score.percent }}% {{ score.level }}
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    `,
    computed: {
        entry() {
            return (this.leaderboard && this.leaderboard[this.selected]) ? this.leaderboard[this.selected] : null;
        },
        allCompletedLevels() {
            if (!this.entry) return [];
            const verified = this.entry.verified || [];
            const completed = this.entry.completed || [];
            return [...verified, ...completed];
        },
        hardestLevel() {
            if (!this.allCompletedLevels.length) return null;
            return [...this.allCompletedLevels].sort((a, b) => a.rank - b.rank)[0];
        }
    },
    async mounted() {
        try {
            const res = await fetchLeaderboard();
            if (Array.isArray(res)) {
                this.leaderboard = res[0] || [];
                this.err = res[1] || [];
            } else if (res) {
                this.leaderboard = res.leaderboard || [];
                this.err = res.err || [];
            }
        } catch (err) {
            console.error("Ошибка в Leaderboard:", err);
            this.debugError = err.stack || err.toString();
        } finally {
            this.loading = false;
        }
    },
    methods: {
        localize,
    },
};
