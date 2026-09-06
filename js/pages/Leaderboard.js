import { fetchLeaderboard } from "../content.js";

const styles = `
.leaderboard-wrapper {
    display: flex;
    flex-direction: row-reverse;
    gap: 24px;
    padding: 24px 32px;
    width: 100%;
    min-height: calc(100vh - 80px);
    box-sizing: border-box;
    font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    color: #ffffff;
}

.sidebar-list {
    width: 380px;
    flex-shrink: 0;
    background: #0f141d;
    border: 1px solid #1a2233;
    border-radius: 12px;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    height: fit-content;
    max-height: 85vh;
    overflow-y: auto;
}

.sidebar-item {
    display: flex;
    align-items: center;
    padding: 12px 16px;
    border-radius: 8px;
    background: #131924;
    cursor: pointer;
    font-size: 1.05rem;
    transition: all 0.15s ease;
    border: 1px solid transparent;
}

.sidebar-item:hover {
    background: #1a2333;
}

.sidebar-item.active {
    background: #1a253b;
    border: 1px solid #283754;
}

.rank-num {
    color: #3b82f6;
    font-size: 0.95rem;
    font-weight: 700;
    width: 38px;
}

.user-block {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-grow: 1;
}

.avatar-mini {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    object-fit: cover;
    background: #202b3d;
    flex-shrink: 0;
}

.flag-img-mini {
    width: 22px;
    height: 15px;
    object-fit: cover;
    border-radius: 2px;
    flex-shrink: 0;
    box-shadow: 0 0 2px rgba(0,0,0,0.5);
}

.user-block .username {
    font-weight: 700;
    color: #ffffff;
}

.user-score {
    color: #8b9bb4;
    font-size: 0.95rem;
    font-weight: 600;
}

.profile-card {
    flex-grow: 1;
    background: #0f141d;
    border: 1px solid #1a2233;
    border-radius: 12px;
    padding: 40px;
    display: flex;
    flex-direction: column;
    gap: 32px;
}

.profile-title {
    display: flex;
    align-items: center;
    gap: 16px;
}

.avatar-large {
    width: 72px;
    height: 72px;
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid #283754;
    flex-shrink: 0;
}

.flag-img-large {
    width: 38px;
    height: 26px;
    object-fit: cover;
    border-radius: 4px;
    flex-shrink: 0;
    box-shadow: 0 0 4px rgba(0,0,0,0.6);
}

.profile-title h1 {
    margin: 0;
    font-size: 2.8rem;
    font-weight: 800;
    letter-spacing: -0.5px;
}

.grid-stats {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
}

.card-stat {
    background: #131926;
    border: 1px solid #1e283d;
    border-radius: 12px;
    padding: 24px 28px;
    display: flex;
    align-items: center;
    gap: 24px;
}

.card-stat .icon {
    font-size: 2.2rem;
    display: flex;
    align-items: center;
    justify-content: center;
}

.card-stat .info {
    display: flex;
    flex-direction: column;
}

.card-stat .val {
    font-size: 2rem;
    font-weight: 800;
    color: #ffffff;
    line-height: 1.1;
}

.card-stat .lbl {
    font-size: 0.85rem;
    color: #5d739c;
    font-weight: 800;
    letter-spacing: 1px;
    margin-top: 6px;
}

.card-hardest {
    background: #131926;
    border: 1px solid #3d2325;
    border-radius: 12px;
    padding: 20px 24px;
}

.hardest-title {
    color: #ff5252;
    font-size: 1rem;
    font-weight: 700;
    display: flex;
    align-items: center;
    gap: 8px;
}

.hardest-value {
    font-size: 1.4rem;
    font-weight: 800;
    color: #ffffff;
    margin-top: 8px;
}

.section-levels {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.section-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.section-top .title {
    color: #ff5252;
    font-size: 1.1rem;
    font-weight: 700;
    display: flex;
    align-items: center;
    gap: 8px;
}

.count-badge {
    background: #1a2336;
    color: #627ca8;
    border-radius: 12px;
    padding: 4px 12px;
    font-size: 0.9rem;
    font-weight: 700;
}

.pills-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
}

.level-pill {
    background: #141c2e;
    border: 1px solid #202d4a;
    padding: 12px 20px;
    border-radius: 8px;
    font-size: 1.05rem;
    font-weight: 700;
    color: #ffffff;
    transition: background 0.15s ease;
}

.level-pill:hover {
    background: #1c2740;
}
`;

if (!document.getElementById("leaderboard-styles-wide")) {
    const styleSheet = document.createElement("style");
    styleSheet.id = "leaderboard-styles-wide";
    styleSheet.innerText = styles;
    document.head.appendChild(styleSheet);
}

export default {
    template: `
        <main v-if="loading" class="gdl-loading">
            <p style="padding: 20px; text-align: center; color: #fff;">Загрузка данных...</p>
        </main>

        <main v-else class="leaderboard-wrapper">
            <!-- СПИСОК ИГРОКОВ (СПРАВА) -->
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
                        <!-- Иконка аватарки -->
                        <img 
                            v-if="player.avatar" 
                            :src="player.avatar" 
                            class="avatar-mini" 
                            @error="$event.target.style.display='none'"
                        />
                        
                        <!-- Картинка флага по коду страны -->
                        <img 
                            v-if="player.nationality" 
                            :src="getFlagUrl(player.nationality)" 
                            class="flag-img-mini" 
                            @error="$event.target.style.display='none'"
                        />

                        <span class="username">{{ player.user }}</span>
                    </div>
                    <span class="user-score">{{ formatScore(player.totalScore) }}</span>
                </div>
            </div>

            <!-- ПРОФИЛЬ ИГРОКА (СЛЕВА) -->
            <div class="profile-card" v-if="currentPlayer">
                <div class="profile-title">
                    <img 
                        v-if="currentPlayer.avatar" 
                        :src="currentPlayer.avatar" 
                        class="avatar-large" 
                        @error="$event.target.style.display='none'"
                    />

                    <img 
                        v-if="currentPlayer.nationality" 
                        :src="getFlagUrl(currentPlayer.nationality)" 
                        class="flag-img-large" 
                        @error="$event.target.style.display='none'"
                    />

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

        getFlagUrl(countryCode) {
            if (!countryCode) return '';
            if (countryCode.startsWith('http://') || countryCode.startsWith('https://')) {
                return countryCode;
            }
            return `https://flagcdn.com/w40/${countryCode.toLowerCase()}.png`;
        }
    }
};
