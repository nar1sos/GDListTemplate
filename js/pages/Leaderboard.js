import { fetchLeaderboard } from "../content.js";
import Spinner from "../components/Spinner.js";

export default {
    components: { Spinner },
    template: `
        <main v-if="loading" class="gdl-loading">
            <Spinner></Spinner>
        </main>
        <div v-else class="gdl-wrapper">
            <!-- Поиск по игрокам -->
            <div class="gdl-search-bar">
                <div class="search-input-wrapper">
                    <span class="search-icon">🔍</span>
                    <input 
                        type="text" 
                        v-model="searchQuery" 
                        placeholder="Search player..." 
                        class="gdl-input"
                    />
                    <button v-if="searchQuery" @click="searchQuery = ''" class="clear-btn">✕</button>
                </div>
            </div>

            <div class="gdl-leaderboard-grid">
                <!-- Слева: Список игроков -->
                <div class="gdl-players-list">
                    <div 
                        v-for="(player, index) in filteredLeaderboard" 
                        :key="player.user"
                        class="gdl-player-card"
                        :class="{ 'active': selectedPlayer?.user === player.user }"
                        @click="selectedPlayer = player"
                    >
                        <span class="player-rank">#{{ getOriginalRank(player) }}</span>
                        
                        <div class="player-avatar-wrapper">
                            <img 
                                :src="player.avatar || '/assets/no-avatar.png'" 
                                alt="avatar" 
                                class="player-avatar"
                                @error="handleAvatarError"
                            />
                        </div>

                        <div class="player-main-info">
                            <div class="player-name-row">
                                <span class="player-name">{{ player.user }}</span>
                                <span v-if="player.nationality" class="player-flag" :title="player.nationality">
                                    {{ getFlagEmoji(player.nationality) }}
                                </span>
                            </div>
                            <span class="player-score">{{ player.totalScore.toFixed(2) }} pts</span>
                        </div>
                    </div>

                    <div v-if="filteredLeaderboard.length === 0" class="empty-results">
                        Игрок "{{ searchQuery }}" не найден
                    </div>
                </div>

                <!-- Справа: Карточка выбранного игрока -->
                <div class="gdl-player-details" v-if="selectedPlayer">
                    <div class="gdl-meta-box">
                        <div class="details-header">
                            <img 
                                :src="selectedPlayer.avatar || '/assets/no-avatar.png'" 
                                alt="avatar" 
                                class="details-avatar"
                                @error="handleAvatarError"
                            />
                            <div class="details-user-info">
                                <h2>
                                    {{ selectedPlayer.user }}
                                    <span v-if="selectedPlayer.nationality" class="player-flag">
                                        {{ getFlagEmoji(selectedPlayer.nationality) }}
                                    </span>
                                </h2>
                                <p class="details-score">Total Score: <strong>{{ selectedPlayer.totalScore.toFixed(2) }} pts</strong></p>
                            </div>
                        </div>

                        <!-- Самый сложный пройденный уровень -->
                        <div class="details-hardest" v-if="selectedPlayer.hardest">
                            <span class="hardest-label">Hardest Demon:</span>
                            <span class="hardest-value">#{{ selectedPlayer.hardestRank }} — {{ selectedPlayer.hardest }}</span>
                        </div>

                        <!-- Верифицированные уровни -->
                        <div class="details-section" v-if="selectedPlayer.verified && selectedPlayer.verified.length">
                            <h3>Verified Demons ({{ selectedPlayer.verified.length }})</h3>
                            <ul class="verified-list">
                                <li v-for="lvl in selectedPlayer.verified" :key="lvl">
                                    🏆 {{ lvl }}
                                </li>
                            </ul>
                        </div>

                        <!-- Рекорды игрока -->
                        <div class="details-section">
                            <h3>Records ({{ selectedPlayer.records.length }})</h3>
                            <div class="player-records-list" v-if="selectedPlayer.records.length">
                                <div 
                                    v-for="(rec, rIdx) in selectedPlayer.records" 
                                    :key="rIdx" 
                                    class="player-record-card"
                                >
                                    <span class="record-level-rank">#{{ rec.rank }}</span>
                                    <span class="record-level-name">{{ rec.levelName }}</span>
                                    <span class="record-percent" :class="{ 'hundred': rec.percent === 100 }">
                                        {{ rec.percent }}%
                                    </span>
                                </div>
                            </div>
                            <div v-else class="no-records">У игрока пока нет подтвержденных рекордов</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,

    data: () => ({
        leaderboard: [],
        loading: true,
        searchQuery: "",
        selectedPlayer: null
    }),

    computed: {
        filteredLeaderboard() {
            if (!this.searchQuery.trim()) return this.leaderboard;
            const q = this.searchQuery.toLowerCase().trim();
            return this.leaderboard.filter(p => p.user.toLowerCase().includes(q));
        }
    },

    async mounted() {
        this.leaderboard = await fetchLeaderboard();
        if (this.leaderboard.length > 0) {
            this.selectedPlayer = this.leaderboard[0];
        }
        this.loading = false;
    },

    methods: {
        getOriginalRank(player) {
            return this.leaderboard.findIndex(p => p.user === player.user) + 1;
        },
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
