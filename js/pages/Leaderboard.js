import { fetchLeaderboard } from "../content.js";
import Spinner from "../components/Spinner.js";

export default {
    components: { Spinner },
    template: `
        <main v-if="loading">
            <Spinner></Spinner>
        </main>
        
        <div v-else class="leaderboard">
            <!-- ЛЕВАЯ ЧАСТЬ: ПРОФИЛЬ ИГРОКА -->
            <div class="player-container" v-if="selectedPlayer">
                <div class="player">
                    <div class="player-header">
                        <img 
                            :src="getAvatarUrl(selectedPlayer)" 
                            class="avatar"
                            @error="onAvatarError"
                        />
                        <div class="player-title">
                            <span v-if="selectedPlayer.nationality" class="flag">
                                {{ getFlagEmoji(selectedPlayer.nationality) }}
                            </span>
                            <h1>{{ selectedPlayer.user }}</h1>
                        </div>
                    </div>

                    <!-- Карточки RANK и SCORE -->
                    <div class="stats">
                        <div class="stat-card">
                            <div class="stat-icon">🏆</div>
                            <div class="stat-info">
                                <span class="stat-value">#{{ selectedRank }}</span>
                                <span class="stat-label">RANK</span>
                            </div>
                        </div>

                        <div class="stat-card">
                            <div class="stat-icon">✦</div>
                            <div class="stat-info">
                                <span class="stat-value">{{ formatScore(selectedPlayer.totalScore) }}</span>
                                <span class="stat-label">SCORE</span>
                            </div>
                        </div>
                    </div>

                    <!-- Hardest level -->
                    <div class="card hardest-card" v-if="selectedPlayer.hardest">
                        <div class="card-header red">
                            🔥 Hardest level
                        </div>
                        <div class="hardest-name">
                            #{{ selectedPlayer.hardestRank || 1 }} {{ selectedPlayer.hardest }}
                        </div>
                    </div>

                    <!-- Main levels -->
                    <div class="card" v-if="mainLevels.length">
                        <div class="card-header red">
                            <span>★ Main levels</span>
                            <span class="badge">{{ mainLevels.length }}</span>
                        </div>
                        <div class="levels-grid">
                            <div 
                                v-for="(rec, idx) in mainLevels" 
                                :key="idx" 
                                class="level-btn"
                            >
                                {{ rec.levelName || rec }}
                            </div>
                        </div>
                    </div>

                    <!-- Progresses -->
                    <div class="card" v-if="progresses.length">
                        <div class="card-header blue">
                            <span>📊 Progresses</span>
                            <span class="badge blue-badge">{{ progresses.length }}</span>
                        </div>
                        <div class="levels-grid">
                            <div 
                                v-for="(prog, idx) in progresses" 
                                :key="idx" 
                                class="level-btn progress-btn"
                            >
                                {{ prog.levelName }} <span class="percent">({{ prog.percent }}%)</span>
                            </div>
                        </div>
                    </div>

                    <!-- Which are verified (Зеленый блок) -->
                    <div class="card verified-card" v-if="verifiedLevels.length">
                        <div class="card-header green">
                            <span>✔ Which are verified</span>
                            <span class="badge green-badge">{{ verifiedLevels.length }}</span>
                        </div>
                        <div class="levels-grid">
                            <div 
                                v-for="(ver, idx) in verifiedLevels" 
                                :key="idx" 
                                class="level-btn green-btn"
                            >
                                {{ ver.levelName || ver }}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- ПРАВАЯ ЧАСТЬ: СПИСОК ИГРОКОВ -->
            <div class="board">
                <div 
                    v-for="(player, index) in leaderboard" 
                    :key="player.user || index"
                    class="board-item"
                    :class="{ 'active': selectedPlayer?.user === player.user }"
                    @click="selectedPlayer = player"
                >
                    <span class="rank-id">#{{ index + 1 }}</span>
                    
                    <div class="user-info">
                        <img 
                            :src="getAvatarUrl(player)" 
                            class="list-avatar" 
                            @error="onAvatarError"
                        />
                        <span v-if="player.nationality" class="list-flag">
                            {{ getFlagEmoji(player.nationality) }}
                        </span>
                        <span class="user-name">{{ player.user }}</span>
                    </div>

                    <span class="user-score">{{ formatScore(player.totalScore) }}</span>
                </div>
            </div>
        </div>
    `,

    data: () => ({
        leaderboard: [],
        loading: true,
        selectedPlayer: null,
        defaultAvatar: 'https://i.imgur.com/6VBx3io.png'
    }),

    computed: {
        selectedRank() {
            if (!this.selectedPlayer || !this.leaderboard.length) return '-';
            const index = this.leaderboard.findIndex(p => p.user === this.selectedPlayer.user);
            return index !== -1 ? index + 1 : '-';
        },
        mainLevels() {
            if (!this.selectedPlayer?.records) return [];
            return this.selectedPlayer.records.filter(r => !r.percent || r.percent === 100);
        },
        progresses() {
            if (!this.selectedPlayer?.records) return [];
            return this.selectedPlayer.records.filter(r => r.percent && r.percent < 100);
        },
        verifiedLevels() {
            if (!this.selectedPlayer) return [];
            return this.selectedPlayer.verified || [];
        }
    },

    async mounted() {
        const data = await fetchLeaderboard();
        this.leaderboard = Array.isArray(data) ? data : [];
        if (this.leaderboard.length > 0) {
            this.selectedPlayer = this.leaderboard[0];
        }
        this.loading = false;
    },

    methods: {
        formatScore(score) {
            if (score === undefined || score === null) return '0';
            return Number(score).toLocaleString('en-US');
        },
        getAvatarUrl(player) {
            if (player?.avatar) return player.avatar;
            if (player?.icon) return player.icon;
            return `https://github.com/${player?.user}.png`;
        },
        getFlagEmoji(countryCode) {
            if (!countryCode) return '';
            const codeStr = String(countryCode).trim();
            if (codeStr.length !== 2 || !/^[a-zA-Z]{2}$/.test(codeStr)) return codeStr;

            const codePoints = codeStr
                .toUpperCase()
                .split('')
                .map(char => 127397 + char.charCodeAt(0));
            return String.fromCodePoint(...codePoints);
        },
        onAvatarError(e) {
            e.target.src = this.defaultAvatar;
        }
    }
};
