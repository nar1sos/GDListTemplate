import { fetchLeaderboard } from "../content.js";

export default {
    template: `
        <div class="gdl-wrapper">
            
            <!-- Загрузка -->
            <div v-if="loading" class="no-records" style="text-align: center; padding: 40px;">
                Загрузка лидерборда...
            </div>

            <!-- Нет данных -->
            <div v-else-if="!leaderboard || leaderboard.length === 0" class="no-records" style="text-align: center; padding: 40px;">
                Игроки не найдены. Проверьте файлы уровней в /data/
            </div>

            <!-- Сетка лидерборда -->
            <div v-else class="leaderboard-grid">
                
                <!-- ЛЕВАЯ КОЛОНКА (СПИСОК ИГРОКОВ) -->
                <div class="leaderboard-list">
                    <div 
                        v-for="(user, i) in leaderboard" 
                        :key="user.user"
                        class="leaderboard-card"
                        :class="{ 'active': selectedUserIndex === i }"
                        @click="selectedUserIndex = i"
                    >
                        <span class="rank-num">#{{ i + 1 }}</span>
                        
                        <!-- Флаг -->
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
                        <span class="user-score">{{ Math.round(user.totalScore || 0).toLocaleString() }}</span>
                    </div>
                </div>

                <!-- ПРАВАЯ КОЛОНКА (ПРОФИЛЬ) -->
                <div class="profile-container" v-if="selectedUser">
                    
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
                                <span class="stat-val">{{ Math.round(selectedUser.totalScore || 0).toLocaleString() }}</span>
                                <span class="stat-lbl">SCORE</span>
                            </div>
                        </div>
                    </div>

                    <div class="hardest-box" v-if="selectedUser.hardest">
                        <div class="hardest-label">🔥 Hardest level</div>
                        <div class="hardest-title">#{{ selectedUser.hardestRank }} {{ selectedUser.hardest }}</div>
                    </div>

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
        loading: true
    }),

    computed: {
        selectedUser() {
            if (!this.leaderboard || this.leaderboard.length === 0) return null;
            return this.leaderboard[this.selectedUserIndex] || this.leaderboard[0];
        }
    },

    async mounted() {
        try {
            this.loading = true;
            this.leaderboard = await fetchLeaderboard();
        } catch (e) {
            console.error("Ошибка при загрузке лидерборда:", e);
        } finally {
            this.loading = false;
        }
    },

    methods: {
        handleAvatarError(e) {
            e.target.src = 'https://i.postimg.cc/mD43TzN3/default-avatar.png';
        }
    }
};
