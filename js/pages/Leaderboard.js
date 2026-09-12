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
                    <!-- Флаг строго ПЕРЕД ником -->
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

                <!-- Статистика: RANK -->
                <div class="single-stat-container">
                    <div class="card-stat">
                        <span class="stat-icon">🏆</span>
                        <div class="stat-info">
                            <span class="val">#{{ selectedRank }}</span>
                            <span class="lbl">RANK</span>
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
        getPlayerFlag(player) {
            if (!player) return null;

            // 1. Ищем напрямую у игрока
            let raw = player.country || player.nationality || player.nation;

            // 2. Ищем в массиве рекордов игрока
            if (!raw && Array.isArray(player.records)) {
                for (const rec of player.records) {
                    if (rec && (rec.country || rec.nationality || rec.nation)) {
                        raw = rec.country || rec.nationality || rec.nation;
                        break;
                    }
                }
            }

            // 3. Ищем в верифицированных уровнях
            if (!raw && Array.isArray(player.verified)) {
                for (const ver of player.verified) {
                    if (ver && (ver.country || ver.nationality || ver.nation)) {
                        raw = ver.country || ver.nationality || ver.nation;
                        break;
                    }
                }
            }

            // 4. Ищем в объекте уровня / верификатора, если структуры вложенные
            if (!raw && player.levels && Array.isArray(player.levels)) {
                for (const lvl of player.levels) {
                    if (lvl.country || lvl.nationality) {
                        raw = lvl.country || lvl.nationality;
                        break;
                    }
                }
            }

            if (!raw) return null;

            let code = String(raw).trim().toLowerCase();

            // Если передана полная ссылка
            if (code.startsWith('http') || code.startsWith('/')) {
                return raw;
            }

            // Запрашиваем 2-буквенный ISO-код (ua, mn, ru, us и т.д.) у FlagCDN
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
