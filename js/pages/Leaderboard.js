import { fetchLeaderboard } from "../content.js";

const styles = `
.leaderboard-wrapper {
    display: flex;
    gap: 16px;
    padding: 24px;
    max-width: 1280px;
    margin: 0 auto;
    font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    color: #ffffff;
    box-sizing: border-box;
}

.sidebar-list {
    width: 280px;
    background: #0f141d;
    border: 1px solid #1a2233;
    border-radius: 12px;
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 6px;
    flex-shrink: 0;
}

.sidebar-item {
    display: flex;
    align-items: center;
    padding: 10px 14px;
    border-radius: 8px;
    background: transparent;
    cursor: pointer;
    font-size: 0.95rem;
    transition: background 0.15s ease, border-color 0.15s ease;
    border: 1px solid transparent;
}

.sidebar-item:hover {
    background: #141b27;
}

.sidebar-item.active {
    background: #141b2d;
    border: 1px solid #283754;
}

.rank-num {
    color: #3b82f6;
    font-size: 0.85rem;
    font-weight: 700;
    width: 32px;
}

.user-block {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-grow: 1;
}

.user-block .flag {
    font-size: 1.1rem;
}

.user-block .username {
    font-weight: 700;
    color: #ffffff;
}

.user-score {
    color: #8b9bb4;
    font-size: 0.85rem;
    font-weight: 600;
}

.profile-card {
    flex-grow: 1;
    background: #0f141d;
    border: 1px solid #1a2233;
    border-radius: 12px;
    padding: 32px;
    display: flex;
    flex-direction: column;
    gap: 24px;
}

.profile-title {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    gap: 12px;
    margin-bottom: 8px;
}

.flag-main {
    font-size: 2.8rem;
    line-height: 1;
}

.profile-title h1 {
    margin: 0;
    font-size: 2.2rem;
    font-weight: 800;
    letter-spacing: -0.5px;
}

.grid-stats {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
}

.card-stat {
    background: #131926;
    border: 1px solid #1e283d;
    border-radius: 10px;
    padding: 20px 24px;
    display: flex;
    align-items: center;
    gap: 20px;
}

.card-stat .icon {
    font-size: 1.8rem;
    display: flex;
    align-items: center;
    justify-content: center;
}

.card-stat .info {
    display: flex;
    flex-direction: column;
}

.card-stat .val {
    font-size: 1.5rem;
    font-weight: 800;
    color: #ffffff;
    line-height: 1.1;
}

.card-stat .lbl {
    font-size: 0.75rem;
    color: #5d739c;
    font-weight: 800;
    letter-spacing: 0.8px;
    margin-top: 4px;
}

.card-hardest {
    background: #131926;
    border: 1px solid #3d2325;
    border-radius: 10px;
    padding: 16px 20px;
}

.hardest-title {
    color: #ff5252;
    font-size: 0.85rem;
    font-weight: 700;
    display: flex;
    align-items: center;
    gap: 6px;
}

.hardest-value {
    font-size: 1.15rem;
    font-weight: 800;
    color: #ffffff;
    margin-top: 6px;
}

.section-levels {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.section-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.section-top .title {
    color: #ff5252;
    font-size: 0.9rem;
    font-weight: 700;
    display: flex;
    align-items: center;
    gap: 6px;
}

.count-badge {
    background: #1a2336;
    color: #627ca8;
    border-radius: 12px;
    padding: 2px 10px;
    font-size: 0.8rem;
    font-weight: 700;
}

.pills-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
}

.level-pill {
    background: #141c2e;
    border: 1px solid #202d4a;
    padding: 10px 16px;
    border-radius: 8px;
    font-size: 0.9rem;
    font-weight: 700;
    color: #ffffff;
    transition: background 0.15s ease;
}

.level-pill:hover {
    background: #1c2740;
}
`;

// Внедрение стилей в документ
if (!document.getElementById("leaderboard-styles")) {
    const styleSheet = document.createElement("style");
    styleSheet.id = "leaderboard-styles";
    styleSheet.innerText = styles;
    document.head.appendChild(styleSheet);
}

export default {
    template: `
        <main v-if="loading" class="gdl-loading">
            <p style="padding: 20px; text-align: center;">Загрузка данных...</p>
        </main>

        <main v-else class="leaderboard-wrapper">
            <!-- ЛЕВАЯ ЧАСТЬ: СПИСОК ИГРОКОВ -->
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
                        <span v-if="player.nationality" class="flag">{{ getFlagEmoji(player.nationality) }}</span>
                        <span class="username">{{ player.user }}</span>
                    </div>
                    <span class="user-score">{{ formatScore(player.totalScore) }}</span>
                </div>
            </div>

            <!-- ПРАВАЯ ЧАСТЬ: ПРОФИЛЬ ИГРОКА -->
            <div class="profile-card" v-if="currentPlayer">
                <div class="profile-title">
                    <span v-if="currentPlayer.nationality" class="flag-main">{{ getFlagEmoji(currentPlayer.nationality) }}</span>
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
