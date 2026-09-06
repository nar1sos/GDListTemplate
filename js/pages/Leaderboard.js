import { fetchLeaderboard } from "../content.js";

export default {
    template: `
        <main v-if="loading" class="gdl-loading">
            <p style="padding: 20px; text-align: center; color: #fff;">Загрузка данных...</p>
        </main>

        <main v-else class="leaderboard-wrapper">
            <!-- СПИСОК ИГРОКОВ СПРАВА -->
            <div class="sidebar-list">
                <div 
                    v-for="(player, i) in players" 
                    :key="player.user"
                    class="sidebar-item"
                    :class="{ 'active': selectedUser === player.user }"
                    @click="selectedUser = player.user"
                >
                    <span class="rank-num">#{{ i + 1 }}</span>
                    <div class="user-block">
                        <img 
                            v-if="player.avatar" 
                            :src="player.avatar" 
                            class="avatar-mini" 
                            @error="$event.target.style.display='none'"
                        />
                        
                        <!-- Отображение флага -->
                        <img 
                            v-if="isUrl(player.nationality)" 
                            :src="player.nationality" 
                            class="flag-img-mini" 
                        />
                        <span v-else-if="player.nationality" class="flag">{{ renderFlag(player.nationality) }}</span>

                        <span class="username">{{ player.user }}</span>
                    </div>
                    <span class="user-score">{{ formatScore(player.totalScore) }}</span>
                </div>
            </div>

            <!-- ПРОФИЛЬ ИГРОКА СЛЕВА -->
            <div class="profile-card" v-if="currentPlayer">
                <div class="profile-title">
                    <img 
                        v-if="currentPlayer.avatar" 
                        :src="currentPlayer.avatar" 
                        class="avatar-large" 
                        @error="$event.target.style.display='none'"
                    />

                    <img 
                        v-if="isUrl(currentPlayer.nationality)" 
                        :src="currentPlayer.nationality" 
                        class="flag-img-large" 
                    />
                    <span v-else-if="currentPlayer.nationality" class="flag-main">{{ renderFlag(currentPlayer.nationality) }}</span>

                    <h1>{{ currentPlayer.user }}</h1>
                </div>

                <div class="grid-stats">
                    <div class="card-stat">
                        <span class="icon">🏆</span>
                        <div class="info">
                            <div class="val">#{{ currentRank }}</div>
                            <div class="lbl">RANK</div>
                        </div>
                    </div>

                    <div class="card-stat">
                        <span class="icon">✦</span>
                        <div class="info">
                            <div class="val">{{ formatScore(currentPlayer.totalScore) }}</div>
                            <div class="lbl">SCORE</div>
                        </div>
                    </div>
                </div>

                <div class="card-hardest" v-if="currentPlayer.hardest">
                    <div class="hardest-title">🔥 Hardest level</div>
                    <div class="hardest-value">#{{ currentPlayer.hardestRank }} {{ currentPlayer.hardest }}</div>
                </div>

                <div class="section-levels" v-if="mainLevels.length">
                    <div class="section-top">
                        <span class="title">★ Main levels</span>
                        <span class="count-badge">{{ mainLevels.length }}</span>
                    </div>
                    <div class="pills-grid">
                        <div v-for="rec in mainLevels" :key="rec.levelName" class="level-pill">
                            {{ rec.levelName }}
                        </div>
                    </div>
                </div>
            </div>
        </main>
    `,

    data: () => ({
        players: [],
        selectedUser: null,
        loading: true
    }),

    computed: {
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
        formatScore(val) {
            if (!val && val !== 0) return '0';
            const parts = Number(val).toFixed(3).split('.');
            parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, " ");
            return parts.join(',');
        },

        isUrl(str) {
            return typeof str === 'string' && (str.startsWith('http://') || str.startsWith('https://') || str.startsWith('/'));
        },

        renderFlag(country) {
            if (!country) return '';
            if (country.length === 2) {
                const codePoints = country
                    .toUpperCase()
                    .split('')
                    .map(char => 127397 + char.charCodeAt(0));
                return String.fromCodePoint(...codePoints);
            }
            return country;
        }
    }
};
