import { fetchLeaderboard } from '../content.js';
import { localize } from '../util.js';
import Spinner from '../components/Spinner.js';

export default {
    components: {
        Spinner,
    },
    data: () => ({
        leaderboard: [],
        countryLeaderboard: [],
        loading: true,
        selected: 0,
        err: [],
        tab: 'players', // 'players' или 'countries'
    }),
    template: `
        <main v-if="loading">
            <Spinner></Spinner>
        </main>
        <main v-else class="page-leaderboard-container">
            <div class="page-leaderboard">
                
                <!-- Табы переключения: Игроки / Страны -->
                <div class="tabs-container">
                    <button 
                        class="tab-button" 
                        :class="{ active: tab === 'players' }" 
                        @click="tab = 'players'"
                    >
                        👤 Игроки
                    </button>
                    <button 
                        class="tab-button" 
                        :class="{ active: tab === 'countries' }" 
                        @click="tab = 'countries'"
                    >
                        🌐 Страны
                    </button>
                </div>

                <div class="error-container" v-if="err && err.length > 0">
                    <p class="error">
                        Ошибки загрузки уровней: {{ err.join(', ') }}
                    </p>
                </div>

                <!-- ВКЛАДКА ИГРОКОВ -->
                <template v-if="tab === 'players'">
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
                                <img 
                                    v-if="ientry.country" 
                                    :src="'https://flagcdn.com/24x18/' + ientry.country + '.png'" 
                                    class="flag-icon"
                                />
                                <span class="user-name">{{ ientry.user }}</span>
                                <span class="total-score">{{ localize(ientry.total) }}</span>
                            </li>
                        </ul>
                    </div>

                    <div class="player-container" v-if="entry">
                        <div class="player-profile">
                            <div class="profile-header">
                                <img 
                                    v-if="entry.country" 
                                    :src="'https://flagcdn.com/48x36/' + entry.country + '.png'" 
                                    class="profile-flag"
                                />
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
                </template>

                <!-- ВКЛАДКА СТРАН -->
                <template v-else-if="tab === 'countries'">
                    <div class="country-board-full">
                        <ul class="board-list">
                            <li 
                                v-for="(c, i) in countryLeaderboard" 
                                :key="i"
                                class="board-item country-item"
                            >
                                <span class="rank-label">#{{ i + 1 }}</span>
                                <img :src="'https://flagcdn.com/32x24/' + c.code + '.png'" class="flag-icon-large" />
                                <span class="user-name">{{ c.code.toUpperCase() }}</span>
                                <span class="total-score">{{ localize(c.total) }} pts</span>
                            </li>
                        </ul>
                    </div>
                </template>

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
            const [leaderboard, err, countryLeaderboard] = await fetchLeaderboard();
            this.leaderboard = leaderboard || [];
            this.err = err || [];
            this.countryLeaderboard = countryLeaderboard || [];
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
