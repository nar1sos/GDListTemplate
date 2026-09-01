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
    }),
    template: `
        <main v-if="loading">
            <Spinner></Spinner>
        </main>
        <main v-else class="page-leaderboard-container">
            <div class="page-leaderboard">
                <div class="error-container" v-if="err && err.length > 0">
                    <p class="error">
                        Leaderboard may be incorrect, as the following levels could not be loaded: {{ err.join(', ') }}
                    </p>
                </div>

                <!-- Левая панель со списком игроков -->
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

                <!-- Правая панель с карточкой профиля -->
                <div class="player-container" v-if="entry">
                    <div class="player-profile">
                        
                        <!-- Заголовок профиля -->
                        <div class="profile-header">
                            <div class="profile-avatar"></div>
                            <h1 class="profile-name">{{ entry.user }}</h1>
                        </div>

                        <!-- Карточки статистики: Rank & Score -->
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

                        <!-- Блок Hardest Level -->
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

                        <!-- Секция прохождений (Verified / Completed) -->
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

                        <!-- Секция прогрессов (Progressed) -->
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
            return this.leaderboard && this.leaderboard.length > 0 ? this.leaderboard[this.selected] : null;
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
                const [leaderboard, err] = res;
                this.leaderboard = leaderboard || [];
                this.err = err || [];
            } else if (res) {
                this.leaderboard = res.leaderboard || res;
                this.err = res.err || [];
            }
        } catch (e) {
            console.error(e);
        } finally {
            this.loading = false;
        }
    },
    methods: {
        localize,
    },
};
