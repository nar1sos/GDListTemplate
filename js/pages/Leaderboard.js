import { fetchLeaderboard } from "../content.js";
import Spinner from "../components/Spinner.js";

export default {
    components: { Spinner },
    template: `
        <main v-if="loading">
            <Spinner></Spinner>
        </main>
        <div v-else class="board-container">
            <!-- Список игроков (слева) -->
            <div class="board">
                <div 
                    v-for="(player, index) in leaderboard" 
                    :key="player.user || index"
                    class="player"
                    :class="{ 'active': selectedPlayer?.user === player.user }"
                    @click="selectedPlayer = player"
                >
                    <span class="rank">#{{ index + 1 }}</span>
                    
                    <img 
                        :src="player.avatar || '/assets/no-avatar.png'" 
                        alt="avatar" 
                        class="avatar"
                        @error="handleAvatarError"
                    />

                    <div class="player-info">
                        <div class="name-row">
                            <span class="name">{{ player.user }}</span>
                            <span v-if="player.nationality" class="flag" :title="player.nationality">
                                {{ getFlagEmoji(player.nationality) }}
                            </span>
                        </div>
                        <span class="score">{{ (player.totalScore || 0).toFixed(2) }} pts</span>
                    </div>
                </div>

                <div v-if="leaderboard.length === 0" class="empty-list">
                    Список игроков пуст
                </div>
            </div>

            <!-- Детали игрока (справа) -->
            <div class="meta-container" v-if="selectedPlayer">
                <div class="meta">
                    <div class="meta-header">
                        <img 
                            :src="selectedPlayer.avatar || '/assets/no-avatar.png'" 
                            alt="avatar" 
                            class="meta-avatar"
                            @error="handleAvatarError"
                        />
                        <div class="meta-user">
                            <h2>
                                {{ selectedPlayer.user }}
                                <span v-if="selectedPlayer.nationality">
                                    {{ getFlagEmoji(selectedPlayer.nationality) }}
                                </span>
                            </h2>
                            <p class="score-total">Total Score: <strong>{{ (selectedPlayer.totalScore || 0).toFixed(2) }} pts</strong></p>
                        </div>
                    </div>

                    <div class="meta-section" v-if="selectedPlayer.hardest">
                        <h3>Hardest Demon</h3>
                        <p>#{{ selectedPlayer.hardestRank }} — {{ selectedPlayer.hardest }}</p>
                    </div>

                    <div class="meta-section" v-if="selectedPlayer.records && selectedPlayer.records.length">
                        <h3>Records ({{ selectedPlayer.records.length }})</h3>
                        <div class="records-grid">
                            <div 
                                v-for="(rec, rIdx) in selectedPlayer.records" 
                                :key="rIdx" 
                                class="record-card"
                            >
                                <span class="rec-rank">#{{ rec.rank }}</span>
                                <span class="rec-name">{{ rec.levelName }}</span>
                                <span class="rec-percent">{{ rec.percent }}%</span>
                            </div>
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

    async mounted() {
        const data = await fetchLeaderboard();
        this.leaderboard = Array.isArray(data) ? data : [];
        if (this.leaderboard.length > 0) {
            this.selectedPlayer = this.leaderboard[0];
        }
        this.loading = false;
    },

    methods: {
        handleAvatarError(e) {
            e.target.src = 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg';
        },
        getFlagEmoji(countryCode) {
            if (!countryCode || countryCode.length !== 2) return countryCode || '';
            const codePoints = countryCode
                .toUpperCase()
                .split('')
                .map(char => 127397 + char.charCodeAt(0));
            return String.fromCodePoint(...codePoints);
        }
    }
};
