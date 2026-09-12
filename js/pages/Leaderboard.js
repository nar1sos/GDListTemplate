import { fetchLeaderboard } from "../content.js";
import Spinner from "../components/Spinner.js";

export default {
    components: { Spinner },
    template: `
        <main v-if="loading" class="leaderboard-wrapper">
            <Spinner></Spinner>
        </main>
        
        <div v-else class="leaderboard-wrapper">
            <!-- БОЛЬШАЯ ЛЕВАЯ КОЛОНКА: ПРОФИЛЬ ИГРОКА -->
            <div class="profile-card" v-if="selectedPlayer">
                <!-- Шапка с аватаркой и именем -->
                <div class="profile-header">
                    <div class="avatar-wrapper">
                        <img 
                            :src="getAvatarUrl(selectedPlayer)" 
                            :alt="selectedPlayer.user"
                            class="profile-avatar"
                            @error="onAvatarError"
                        />
                    </div>
                    <div class="profile-title">
                        <img 
                            v-if="selectedPlayer.nationality" 
                            :src="getFlagUrl(selectedPlayer.nationality)" 
                            class="flag-img" 
                            :alt="selectedPlayer.nationality"
                        />
                        <h1>{{ selectedPlayer.user }}</h1>
                    </div>
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
                        <div class="icon">✦</div>
                        <div class="info">
                            <span class="val">{{ formatScore(selectedPlayer.totalScore) }}</span>
                            <span class="lbl">SCORE</span>
                        </div>
                    </div>
                </div>

                <!-- Блок Hardest level -->
                <div class="card-hardest" v-if="selectedPlayer.hardest">
                    <div class="hardest-title">
                        🔥 Hardest level
                    </div>
                    <div class="hardest-value">
                        #{{ selectedPlayer.hardestRank || 1 }} {{ selectedPlayer.hardest }}
                    </div>
                </div>

                <!-- Секция Main levels (100% прохождения) -->
                <div class="section-levels" v-if="mainLevels.length">
                    <div class="section-top">
                        <div class="title main-title">
                            ★ Main levels
                        </div>
                        <span class="count-badge">{{ mainLevels.length }}</span>
                    </div>
                    <div class="pills-grid">
                        <div 
                            v-for="(rec, idx) in mainLevels" 
                            :key="idx" 
                            class="level-pill"
                        >
                            {{ rec.levelName || rec }}
                        </div>
                    </div>
                </div>

                <!-- Секция Progresses (< 100% прохождения) -->
                <div class="section-levels" v-if="progresses.length">
                    <div class="section-top">
                        <div class="title progress-title">
                            📊 Progresses
                        </div>
                        <span class="count-badge">{{ progresses.length }}</span>
                    </div>
                    <div class="pills-grid">
                        <div 
                            v-for="(prog, idx) in progresses" 
                            :key="idx" 
                            class="level-pill progress-pill"
                        >
                            {{ prog.levelName }} <span class="percent-text">({{ prog.percent }}%)</span>
                        </div>
                    </div>
                </div>

                <!-- Секция Which are verified (ЗЕЛЕНАЯ ПОДЛОЖКА) -->
                <div class="section-levels verified-section" v-if="verifiedLevels.length">
                    <div class="section-top">
                        <div class="title verified-title">
                            <span class="check-icon">✔</span> Which are verified
                        </div>
                        <span class="count-badge verified-badge">{{ verifiedLevels.length }}</span>
                    </div>
                    <div class="pills-grid">
                        <div 
                            v-for="(ver, idx) in verifiedLevels" 
                            :key="idx" 
                            class="level-pill verified-pill"
                        >
                            {{ ver.levelName || ver }}
                        </div>
                    </div>
                </div>
            </div>

            <!-- УЗКАЯ ПРАВАЯ КОЛОНКА: СПИСОК ИГРОКОВ -->
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
                        <img 
                            :src="getAvatarUrl(player)" 
                            class="list-avatar" 
                            @error="onAvatarError"
                        />
                        <img 
                            v-if="player.nationality" 
                            :src="getFlagUrl(player.nationality)" 
                            class="flag-img-sm" 
                        />
                        <span class="username">{{ player.user }}</span>
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
            return Number(score).toLocaleString('ru-RU');
        },
        getAvatarUrl(player) {
            if (player?.avatar) return player.avatar;
            if (player?.icon) return player.icon;
            return `https://github.com/${player?.user}.png`; // Фолбэк на GitHub аватарку по нику
        },
        getFlagUrl(countryCode) {
            if (!countryCode) return '';
            const code = String(countryCode).toLowerCase().trim();
            // Поддержка ISO-кодов стран через Flagcdn
            return `https://flagcdn.com/24x18/${code}.png`;
        },
        onAvatarError(e) {
            e.target.src = this.defaultAvatar;
        }
    }
};
