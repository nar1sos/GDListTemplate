import { fetchLeaderboard } from "../content.js";

export default {
    template: `
        <main v-if="loading" class="loading-state">
            <p>Загрузка данных...</p>
        </main>

        <main v-else class="page-leaderboard-container">
            <!-- ЛЕВАЯ КОЛОНКА: СПИСОК ИГРОКОВ -->
            <div class="board-sidebar">
                <div class="search-bar">
                    <input type="text" v-model="searchQuery" placeholder="Search..." />
                </div>

                <div class="players-list">
                    <div 
                        v-for="(player, index) in filteredPlayers" 
                        :key="player.user" 
                        class="player-item"
                        :class="{ 'active': selectedUser === player.user }"
                        @click="selectedUser = player.user"
                    >
                        <span class="player-rank">#{{ getOriginalRank(player.user) }}</span>
                        <span class="player-name">{{ player.user }}</span>
                        <div class="player-meta">
                            <span class="player-score">{{ Math.round(player.totalScore) }}</span>
                            <span v-if="player.nationality" class="flag">{{ getFlagEmoji(player.nationality) }}</span>
                            <img v-if="player.avatar" :src="player.avatar" class="avatar-small" alt="avatar" />
                        </div>
                    </div>
                </div>
            </div>

            <!-- ПРАВАЯ КОЛОНКА: ДЕТАЛИ ИГРОКА (КАК НА 2 КАРТИНКЕ) -->
            <div class="board-main" v-if="currentPlayer">
                <!-- ШАПКА ИГРОКА -->
                <div class="profile-header">
                    <img v-if="currentPlayer.avatar" :src="currentPlayer.avatar" class="avatar-large" alt="avatar" />
                    <h2>
                        {{ currentPlayer.user }}
                        <span v-if="currentPlayer.nationality" class="flag-large">{{ getFlagEmoji(currentPlayer.nationality) }}</span>
                    </h2>
                </div>

                <!-- КАРТОЧКИ СТАТИСТИКИ -->
                <div class="stats-grid">
                    <div class="stat-card">
                        <span class="stat-icon">🏆</span>
                        <div>
                            <div class="stat-value">#{{ currentRank }}</div>
                            <div class="stat-label">Rank</div>
                        </div>
                    </div>

                    <div class="stat-card">
                        <span class="stat-icon">✦</span>
                        <div>
                            <div class="stat-value">{{ Math.round(currentPlayer.totalScore) }}</div>
                            <div class="stat-label">Score</div>
                        </div>
                    </div>
                </div>

                <!-- САМЫЙ СЛОЖНЫЙ ДЕМОН -->
                <div class="hardest-card" v-if="currentPlayer.hardest">
                    <div class="section-title">🔥 Hardest level</div>
                    <div class="hardest-name">#{{ currentPlayer.hardestRank }} {{ currentPlayer.hardest }}</div>
                </div>

                <!-- MAIN LEVELS (100% ПРОХОЖДЕНИЯ) -->
                <div class="levels-section" v-if="mainLevels.length">
                    <div class="section-header">
                        <span class="section-title">★ Main levels</span>
                        <span class="badge">{{ mainLevels.length }}</span>
                    </div>
                    <div class="tags-grid">
                        <div v-for="rec in mainLevels" :key="rec.levelName" class="level-tag">
                            {{ rec.levelName }}
                        </div>
                    </div>
                </div>

                <!-- EXTENDED LEVELS (ПРОЦЕНТЫ) -->
                <div class="levels-section" v-if="extendedLevels.length">
                    <div class="section-header">
                        <span class="section-title">🟡 Extended levels</span>
                        <span class="badge">{{ extendedLevels.length }}</span>
                    </div>
                    <div class="tags-grid">
                        <div v-for="rec in extendedLevels" :key="rec.levelName" class="level-tag">
                            {{ rec.levelName }} ({{ rec.percent }}%)
                        </div>
                    </div>
                </div>
            </div>
        </main>
    `,

    data: () => ({
        players: [],
        selectedUser: null,
        searchQuery: "",
        loading: true
    }),

    computed: {
        filteredPlayers() {
            if (!this.searchQuery) return this.players;
            const q = this.searchQuery.toLowerCase();
            return this.players.filter(p => p.user.toLowerCase().includes(q));
        },

        currentPlayer() {
            if (!this.players.length) return null;
            return this.players.find(p => p.user === this.selectedUser) || this.players[0];
        },

        currentRank() {
            if (!this.currentPlayer) return 0;
            return this.players.findIndex(p => p.user === this.currentPlayer.user) + 1;
        },

        mainLevels() {
            if (!this.currentPlayer || !this.currentPlayer.records) return [];
            return this.currentPlayer.records.filter(r => Number(r.percent) === 100);
        },

        extendedLevels() {
            if (!this.currentPlayer || !this.currentPlayer.records) return [];
            return this.currentPlayer.records.filter(r => Number(r.percent) < 100);
        }
    },

    async mounted() {
        try {
            this.loading = true;
            const res = await fetchLeaderboard();
            this.players = Array.isArray(res) ? res : [];
            if (this.players.length > 0) {
                this.selectedUser = this.players[0].user;
            }
        } catch (e) {
            console.error("Ошибка загрузки лидерборда:", e);
            this.players = [];
        } finally {
            this.loading = false;
        }
    },

    methods: {
        getOriginalRank(userName) {
            return this.players.findIndex(p => p.user === userName) + 1;
        },

        getFlagEmoji(countryCode) {
            if (!countryCode || countryCode.length !== 2) return '';
            const codePoints = countryCode
                .toUpperCase()
                .split('')
                .map(char => 127397 + char.charCodeAt(0));
            return String.fromCodePoint(...codePoints);
        }
    }
};
