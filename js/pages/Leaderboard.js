import { fetchLeaderboard } from "../content.js";

export default {
    template: `
        <main v-if="loading" class="gdl-loading">
            <div class="spinner">
                <p>Загрузка лидерборда...</p>
            </div>
        </main>

        <main v-else class="page-leaderboard">
            <div class="board-container">
                <h1>Топ Игроков</h1>

                <table class="leaderboard-table" v-if="players && players.length">
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
                                <div class="user-info">
                                    <img v-if="player.avatar" :src="player.avatar" class="avatar" alt="avatar" />
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
                <p v-else style="padding: 1rem;">Лидерборд пуст или данные не загрузились.</p>
            </div>

            <!-- Правая панель с подробностями выбранного игрока -->
            <div class="player-details" v-if="currentPlayer">
                <h2>{{ currentPlayer.user }}</h2>
                <p>Всего очков: <strong>{{ Math.round(currentPlayer.totalScore) }}</strong></p>
                <p v-if="currentPlayer.hardest">Самый сложный: <strong>{{ currentPlayer.hardest }}</strong> (#{{ currentPlayer.hardestRank }})</p>

                <h3>Пройденные уровни ({{ currentPlayer.records.length }})</h3>
                <ul class="player-records-list">
                    <li v-for="rec in currentPlayer.records" :key="rec.levelName">
                        <span class="level-rank">#{{ rec.rank }}</span>
                        <span class="level-name">{{ rec.levelName }}</span>
                        <span class="level-percent">{{ rec.percent }}%</span>
                    </li>
                </ul>
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
            console.error("Ошибка при загрузке лидерборда:", e);
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
