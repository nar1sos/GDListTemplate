import { fetchLeaderboard } from "../content.js";

export default {
    template: `
        <div class="gdl-wrapper">
            <div class="leaderboard-grid">
                
                <!-- ЛЕВАЯ КОЛОНКА (СПИСОК ЛИДЕРОВ): ПОКАЗЫВАЕТ ФЛАГ -->
                <div class="leaderboard-list">
                    <div 
                        v-for="(user, i) in leaderboard" 
                        :key="user.user"
                        class="leaderboard-card"
                        :class="{ 'active': selectedUserIndex === i }"
                        @click="selectedUserIndex = i"
                    >
                        <span class="rank-num">#{{ i + 1 }}</span>
                        
                        <!-- ФЛАГ ИГРОКА (если есть) -->
                        <span class="user-flag" v-if="user.nationality">
                            <img 
                                v-if="user.nationality.length <= 3"
                                :src="'/assets/flags/' + user.nationality.toLowerCase() + '.svg'" 
                                alt="flag" 
                                class="flag-icon"
                                @error="$event.target.style.display='none'"
                            />
                            <span v-else>{{ user.nationality }}</span>
                        </span>

                        <span class="user-name">{{ user.user }}</span>
                        <span class="user-score">{{ (user.totalScore || 0).toLocaleString('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) }}</span>
                    </div>
                </div>

                <!-- ПРАВАЯ КОЛОНКА (ПРОФИЛЬ): ПОКАЗЫВАЕТ АВАТАРКУ -->
                <div class="profile-container" v-if="selectedUser">
                    
                    <!-- Шапка: Аватарка + Имя -->
                    <div class="profile-header-box">
                        <div class="profile-avatar-wrapper">
                            <img 
                                :src="selectedUser.avatar || 'https://i.postimg.cc/mD43TzN3/default-avatar.png'" 
                                :alt="selectedUser.user"
                                class="profile-avatar-img"
                                @error="handleAvatarError"
                            />
                        </div>
                        <h2 class="profile-username">{{ selectedUser.user }}</h2>
                    </div>

                    <!-- Статистика Rank & Score -->
                    <div class="stats-row">
                        <div class="stat-box">
                            <span class="stat-icon">🏆</span>
                            <div class="stat-info">
                                <span class="stat-val">#{{ selectedUserIndex + 1 }}</span>
                                <span class="stat-lbl">RANK</span>
                            </div>
                        </div>

                        <div class="stat-box">
                            <span class="stat-icon">✦</span>
                            <div class="stat-info">
                                <span class="stat-val">{{ (selectedUser.totalScore || 0).toLocaleString('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) }}</span>
                                <span class="stat-lbl">SCORE</span>
                            </div>
                        </div>
                    </div>

                    <!-- Hardest level -->
                    <div class="hardest-box" v-if="selectedUser.hardest">
                        <div class="hardest-label">🔥 Hardest level</div>
                        <div class="hardest-title">#{{ selectedUser.hardestRank }} {{ selectedUser.hardest }}</div>
                    </div>

                    <!-- Main levels (Пройденные 100% уровни) -->
                    <div class="completed-box" v-if="selectedUser.records && selectedUser.records.length">
                        <div class="completed-header">
                            <span class="completed-title">★ Main levels</span>
                            <span class="completed-count">{{ selectedUser.records.length }}</span>
                        </div>
                        <div class="completed-tags">
                            <span 
                                v-for="rec in selectedUser.records" 
                                :key="rec.levelName" 
                                class="completed-tag"
                            >
                                {{ rec.levelName }}
                            </span>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    `,

    data: () => ({
        leaderboard: [],
        selectedUserIndex: 0,
    }),

    computed: {
        selectedUser() {
            return this.leaderboard[this.selectedUserIndex] || null;
        }
    },

    async mounted() {
        this.leaderboard = await fetchLeaderboard();
    },

    methods: {
        handleAvatarError(e) {
            e.target.src = 'https://i.postimg.cc/mD43TzN3/default-avatar.png';
        }
    }
};
