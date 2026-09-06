import { fetchLeaderboard, fetchList } from "../content.js";
import { score } from "../score.js";

export default {
    template: `
        <div class="gdl-wrapper">
            <div class="leaderboard-grid">
                
                <!-- ЛЕВАЯ КОЛОНКА: Списочный топ игрока (здесь ФЛАГ) -->
                <div class="leaderboard-list">
                    <div 
                        v-for="(user, i) in leaderboard" 
                        :key="user.user"
                        class="leaderboard-card"
                        :class="{ 'active': selectedUserIndex === i }"
                        @click="selectedUserIndex = i"
                    >
                        <span class="rank-num">#{{ i + 1 }}</span>
                        
                        <!-- Флаг страны (emoji или картинка-флаг) -->
                        <span class="user-flag" v-if="user.nationality">
                            <img 
                                v-if="user.nationality.startsWith('http') || user.nationality.endsWith('.png')" 
                                :src="user.nationality" 
                                alt="flag" 
                                class="flag-icon"
                            />
                            <span v-else>{{ user.nationality }}</span>
                        </span>

                        <span class="user-name">{{ user.user }}</span>
                        <span class="user-score">{{ (user.totalScore || 0).toLocaleString() }}</span>
                    </div>
                </div>

                <!-- ПРАВАЯ КОЛОНКА: Карточка профиля (здесь АВАТАРКА) -->
                <div class="profile-container" v-if="selectedUser">
                    
                    <!-- Шапка профиля -->
                    <div class="profile-header-box">
                        <div class="profile-avatar-wrapper">
                            <!-- Аватарка игрока (если есть, иначе дефолтная картинка) -->
                            <img 
                                :src="selectedUser.avatar || '/assets/default-avatar.png'" 
                                :alt="selectedUser.user"
                                class="profile-avatar-img"
                                @error="handleAvatarError"
                            />
                        </div>
                        <h2 class="profile-username">{{ selectedUser.user }}</h2>
                    </div>

                    <!-- Карточки статистики: Rank и Score -->
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
                                <span class="stat-val">{{ (selectedUser.totalScore || 0).toLocaleString() }}</span>
                                <span class="stat-lbl">SCORE</span>
                            </div>
                        </div>
                    </div>

                    <!-- Hardest level -->
                    <div class="hardest-box" v-if="selectedUser.hardest">
                        <div class="hardest-label">🔥 Hardest level</div>
                        <div class="hardest-title">#1 {{ selectedUser.hardest }}</div>
                    </div>

                    <!-- Main levels (Completed) -->
                    <div class="completed-box" v-if="selectedUser.verified && selectedUser.verified.length">
                        <div class="completed-header">
                            <span class="completed-title">★ Main levels</span>
                            <span class="completed-count">{{ completedList.length }}</span>
                        </div>
                        <div class="completed-tags">
                            <span 
                                v-for="rec in completedList" 
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
        list: [],
        leaderboard: [],
        selectedUserIndex: 0,
    }),

    computed: {
        selectedUser() {
            return this.leaderboard[this.selectedUserIndex] || null;
        },
        completedList() {
            if (!this.selectedUser || !this.selectedUser.verified) return [];
            return this.selectedUser.verified.filter(r => r.percent === 100);
        }
    },

    async mounted() {
        this.list = await fetchList();
        this.leaderboard = await fetchLeaderboard();
    },

    methods: {
        handleAvatarError(e) {
            e.target.src = 'https://i.postimg.cc/mD43TzN3/default-avatar.png';
        }
    }
};
