import { fetchLeaderboard } from "../content.js";

export default {
    template: `
        <main v-if="loading">
            <div class="spinner">
                <p>Загрузка лидерборда...</p>
            </div>
        </main>

        <main v-else class="page-leaderboard-container">
            <!-- Таблица лидирующих игроков -->
            <div class="board-container">
                <table class="board">
                    <thead>
                        <tr>
                            <th class="rank">#</th>
                            <th class="user">Игрок</th>
                            <th class="score">Очки</th>
                            <th class="hardest">Самый сложный демон</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr 
                            v-for="(player, i) in players" 
                            :key="player.user"
                            :class="{ 'active': selected === i }"
                            @click="selected = i"
                        >
                            <td class="rank">
                                <p class="type-label-lg">#{{ i + 1 }}</p>
                            </td>
                            <td class="user">
                                <div style="display: flex; align-items: center; gap: 8px;">
                                    <img v-if="player.avatar" :src="player.avatar" style="width: 24px; height: 24px; border-radius: 50%; object-fit: cover;" alt="avatar" />
                                    <span v-if="player.nationality" class="flag">{{ getFlagEmoji(player.nationality) }}</span>
                                    <span class="type-label-lg">{{ player.user }}</span>
                                </div>
                            </td>
                            <td class="score">
                                <p class="type-label-lg">{{ Math.round(player.totalScore) }} pts</p>
                            </td>
                            <td class="hardest">
                                <p class="type-label-md">{{ player.hardest || '—' }}</p>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <!-- Правая панель информации о выбранном игроке -->
            <div class="player-container">
                <div class="player" v-if="currentPlayer">
                    <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
                        <img v-if="currentPlayer.avatar" :src="currentPlayer.avatar" style="width: 48px; height: 48px; border-radius: 50%; object-fit: cover;" alt="avatar" />
                        <h1>{{ currentPlayer.user }}</h1>
                    </div>

                    <p class="type-label-md">Всего очков: <strong>{{ Math.round(currentPlayer.totalScore) }}</strong></p>
                    <p class="type-label-md" v-if="currentPlayer.hardest">
                        Самый сложный демон: <strong>{{ currentPlayer.hardest }}</strong> (#{{ currentPlayer.hardestRank }})
                    </p>

                    <h2>Пройденные уровни ({{ currentPlayer.records.length }})</h2>
                    <table class="records" v-if="currentPlayer.records && currentPlayer.records.length">
                        <tbody>
                            <tr v-for="rec in currentPlayer.records" :key="rec.levelName">
                                <td class="rank">
                                    <p>#{{ rec.rank }}</p>
                                </td>
                                <td class="level">
                                    <p>{{ rec.levelName }}</p>
                                </td>
                                <td class="percent">
                                    <p>{{ rec.percent }}%</p>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div v-else style="padding: 1rem;">
                    <p>Выберите игрока из списка.</p>
                </div>
            </div>
        </main>
    `,

    data: () => ({
        players: [],
        selected: 0,
        loading: true
    }),

    computed: {
        currentPlayer() {
            if (!this.players || !this.players[this.selected]) return null;
            return this.players[this.selected];
        }
    },

    async mounted() {
        try {
            this.loading = true;
            const res = await fetchLeaderboard();
            this.players = Array.isArray(res) ? res : [];
        } catch (e) {
            console.error("Ошибка при загрузке лидерборда GDL:", e);
            this.players = [];
        } finally {
            this.loading = false;
        }
    },

    methods: {
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
