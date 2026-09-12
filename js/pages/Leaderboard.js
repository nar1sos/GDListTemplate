import { fetchLeaderboard } from "../content.js";
import Spinner from "../components/Spinner.js";

export default {
    components: { Spinner },
    template: `
        <main v-if="loading" class="leaderboard-wrapper">
            <Spinner></Spinner>
        </main>
        
        <div v-else class="leaderboard-wrapper">
            <!-- ЛЕВАЯ КОЛОНКА (СПИСОК ИГРОКОВ) -->
            <div class="sidebar-list">
                <div 
                    v-for="(player, index) in leaderboard" 
                    :key="player.user || index"
                    class="sidebar-item"
                    :class="{ 'active': selectedPlayer?.user === player.user }"
                    @click="selectedPlayer = player"
                >
                    <span class="rank-num">#{{ index + 1 }}</span>
                    
                    <div class="user-block">
                        <span v-if="player.nationality" class="flag" :title="player.nationality">
                            {{ getFlagEmoji(player.nationality) }}
                        </span>
                        <span class="username">{{ player.user }}</span>
                    </div>

                    <span class="user-score">{{ Math.round(player.totalScore || 0) }}</span>
                </div>

                <div v-if="leaderboard.length === 0" style="padding: 12px; color: #8b9bb4;">
                    Список пуст
                </div>
            </div>

            <!-- ПРАВАЯ КОЛОНКА (ПРОФИЛЬ ИГРОКА) -->
            <div class="profile-card" v-if="selectedPlayer">
                <!-- Шапка профиля -->
                <div class="profile-title">
                    <span v-if="selectedPlayer.nationality" class="flag-main">
                        {{ getFlagEmoji(selectedPlayer.nationality) }}
                    </span>
                    <h1>{{ selectedPlayer.user }}</h1>
                </div>

                <!-- Статистика: RANK и SCORE -->
                <div class="grid-stats">
                    <div class="card-stat">
                        <div class="icon">🏆</div>
                        <div class="info">
                            <span class="val">#{{ selectedRank }}</span>
                            <span class="lbl">RANK</span>
                        </div>
                    </div>

                    <div class="card-stat">
                        <div class="icon">⚡</div>
                        <div class="info">
                            <span class="val">{{ (selectedPlayer.totalScore || 0).toFixed(2) }}</span>
                            <span class="lbl">SCORE</span>
                        </div>
                    </div>
                </div>

                <!-- Блок Hardest level -->
                <div class="card-hardest" v-if="selectedPlayer.hardest">
                    <div class="hardest-title">
                        <span>🔥</span> HARDEST DEMON
                    </div>
                    <div class="hardest-value">
                        #{{ selectedPlayer.hardestRank }} — {{ selectedPlayer.hardest }}
                    </div>
                </div>

                <!-- Блок Пройденных уровней (Main levels / Records) -->
                <div class="section-levels">
                    <div class="section-top">
                        <div class="title">
                            <span>🎮</span> COMPLETED DEMONS
                        </div>
                        <span class="count-badge">
                            {{ completedRecords.length }}
                        </span>
                    </div>

                    <div class="pills-grid" v-if="completedRecords.length">
                        <div 
                            v-for="(rec, rIdx) in completedRecords" 
                            :key="rIdx" 
                            class="level-pill"
                        >
                            #{{ rec.rank }} {{ rec.levelName }} {{ rec.percent < 100 ? '(' + rec.percent + '%)' : '' }}
                        </div>
                    </div>
                    <div v-else style="color: #8b9bb4; font-size: 0.9rem;">
                        У игрока пока нет подтвержденных рекордов
                    </div>
                </div>

                <!-- Блок Заверифицированных уровней -->
                <div class="section-levels" v-if="selectedPlayer.verified && selectedPlayer.verified.length">
                    <div class="section-top">
                        <div class="title">
                            <span>👑</span> VERIFIED LEVELS
                        </div>
                        <span class="count-badge">
                            {{ selectedPlayer.verified.length }}
                        </span>
                    </div>

                    <div class="pills-grid">
                        <div 
                            v-for="(ver, vIdx) in selectedPlayer.verified" 
                            :key="vIdx" 
                            class="level-pill"
                        >
                            {{ ver }}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,

    data: () => ({
        leaderboard: [],
        loading: true,
        selectedPlayer: null
    }),

    computed: {
        selectedRank() {
            if (!this.selectedPlayer || !this.leaderboard.length) return '-';
            const index = this.leaderboard.findIndex(p => p.user === this.selectedPlayer.user);
            return index !== -1 ? index + 1 : '-';
        },
        completedRecords() {
            if (!this.selectedPlayer || !Array.isArray(this.selectedPlayer.records)) return [];
            return this.selectedPlayer.records;
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
        getFlagEmoji(countryCode) {
            if (countryCode === null || countryCode === undefined) return '';
            const codeStr = String(countryCode).trim();
            if (codeStr.length !== 2) return codeStr;
            if (!/^[a-zA-Z]{2}$/.test(codeStr)) return codeStr;

            const codePoints = codeStr
                .toUpperCase()
                .split('')
                .map(char => 127397 + char.charCodeAt(0));
            return String.fromCodePoint(...codePoints);
        }
    }
};
