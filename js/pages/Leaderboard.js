import { fetchLeaderboard } from "../content.js";
import Spinner from "../components/Spinner.js";

export default {
    components: { Spinner },
    template: `
        <main v-if="loading" class="leaderboard-wrapper">
            <Spinner></Spinner>
        </main>
        
        <div v-else class="leaderboard-container">
            <!-- ЛЕВАЯ КОЛОНКА: ПРОФИЛЬ -->
            <div class="profile-card" v-if="selectedPlayer">
                <!-- Аватарка -->
                <div class="profile-header">
                    <div class="avatar-ring">
                        <img 
                            :src="getAvatarUrl(selectedPlayer)" 
                            class="profile-avatar"
                            @error="onAvatarError"
                        />
                    </div>
                    <!-- Имя и флаг ПЕРЕД ником -->
                    <div class="profile-title">
                        <img 
                            v-if="getPlayerFlag(selectedPlayer)" 
                            :src="getPlayerFlag(selectedPlayer)" 
                            class="flag-img" 
                            @error="onFlagError"
                        />
                        <h1>{{ selectedPlayer.user }}</h1>
                    </div>
                </div>

                <!-- Статистика: RANK и SCORE -->
                <div class="grid-stats">
                    <div class="card-stat">
                        <span class="stat-icon">🏆</span>
                        <div class="stat-info">
                            <span class="val">#{{ selectedRank }}</span>
                            <span class="lbl">RANK</span>
                        </div>
                    </div>

                    <div class="card-stat">
                        <span class="stat-icon">✦</span>
                        <div class="stat-info">
                            <span class="val">{{ formatScore(selectedPlayer.totalScore) }}</span>
                            <span class="lbl">SCORE</span>
                        </div>
                    </div>
                </div>

                <!-- Hardest level -->
                <div class="section-box hardest-box" v-if="selectedPlayer.hardest">
                    <div class="box-title red-title">
                        🔥 Hardest level
                    </div>
                    <div class="hardest-name">
                        #{{ selectedPlayer.hardestRank || 1 }} {{ selectedPlayer.hardest }}
                    </div>
                </div>

                <!-- Main levels -->
                <div class="section-box" v-if="mainLevels.length">
                    <div class="box-header">
                        <div class="box-title red-title">
                            ★ Main levels
                        </div>
                        <span class="badge-count">{{ mainLevels.length }}</span>
                    </div>
                    <div class="pills-flex">
                        <div 
                            v-for="(lvl, idx) in mainLevels" 
                            :key="idx" 
                            class="pill-btn"
                        >
                            {{ lvl }}
                        </div>
                    </div>
                </div>

                <!-- Progresses -->
                <div class="section-box" v-if="progresses.length">
                    <div class="box-header">
                        <div class="box-title blue-title">
                            📊 Progresses
                        </div>
                        <span class="badge-count">{{ progresses.length }}</span>
                    </div>
                    <div class="pills-flex">
                        <div 
                            v-for="(prog, idx) in progresses" 
                            :key="idx" 
                            class="pill-btn progress-pill"
                        >
                            {{ prog.levelName }} <span class="blue-text">({{ prog.percent }}%)</span>
                        </div>
                    </div>
                </div>

                <!-- Which are verified -->
                <div class="section-box verified-box" v-if="verifiedLevels.length">
                    <div class="box-header">
                        <div class="box-title green-title">
                            <span class="check-circle">✓</span> Which are verified
                        </div>
                        <span class="badge-count green-badge">{{ verifiedLevels.length }}</span>
                    </div>
                    <div class="pills-flex">
                        <div 
                            v-for="(ver, idx) in verifiedLevels" 
                            :key="idx" 
                            class="pill-btn verified-pill"
                        >
                            {{ ver.levelName || ver }}
                        </div>
                    </div>
                </div>
            </div>

            <!-- ПРАВАЯ КОЛОНКА: СПИСОК ИГРОКОВ -->
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
                            v-if="getPlayerFlag(player)" 
                            :src="getPlayerFlag(player)" 
                            class="list-flag-img" 
                            @error="onFlagError"
                        />
                        <span class="username">{{ player.user }}</span>
                    </div>
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
            if (!this.selectedPlayer) return [];
            
            const records = (this.selectedPlayer.records || [])
                .filter(r => !r.percent || r.percent === 100)
                .map(r => r.levelName || r);
                
            const verified = (this.selectedPlayer.verified || [])
                .map(v => v.levelName || v);

            return [...new Set([...records, ...verified])];
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
            return Math.round(Number(score)).toLocaleString('ru-RU');
        },
        getPlayerFlag(player) {
            if (!player) return null;

            // Берутся любые поля страны (в объекте игрока или его записях)
            let raw = player.nationality || player.nation || player.country;

            if (!raw && player.records && player.records.length > 0) {
                const rec = player.records.find(r => r.nationality || r.nation || r.country);
                if (rec) raw = rec.nationality || rec.nation || rec.country;
            }

            if (!raw) return null;

            let code = String(raw).trim().toLowerCase();

            // Если уже полноценный URL
            if (code.startsWith('http') || code.startsWith('/')) {
                return raw;
            }

            // Прямой запрос к FlagCDN по двум буквам страны (mn, ru, ua, us и т.д.)
            return `https://flagcdn.com/w40/${code.slice(0, 2)}.png`;
        },
        getAvatarUrl(player) {
            if (player?.avatar) return player.avatar;
            if (player?.icon) return player.icon;
            return `https://github.com/${player?.user}.png`;
        },
        onAvatarError(e) {
            e.target.src = this.defaultAvatar;
        },
        onFlagError(e) {
            e.target.style.display = 'none';
        }
    }
};
