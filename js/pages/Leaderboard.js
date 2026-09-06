import { fetchList } from "../content.js";
import { score } from "../score.js";

export default {
    template: `
        <main v-if="loading">
            <div class="spinner">
                <p>Загрузка данных...</p>
            </div>
        </main>
        <main v-else class="page-list">
            <div class="list-container">
                <table class="list" v-if="list && list.length">
                    <tr v-for="([level, err], i) in list" :key="i">
                        <td class="rank">
                            <p class="type-label-lg">#{{ i + 1 }}</p>
                        </td>
                        <td class="level" :class="{ 'active': selected === i }">
                            <button @click="selected = i">
                                <span class="type-label-lg">{{ level ? level.name : 'Ошибка (' + err + ')' }}</span>
                                <span v-if="level" class="type-label-md">{{ level.author }}</span>
                            </button>
                        </td>
                    </tr>
                </table>
            </div>
            <div class="level-container">
                <div class="level" v-if="currentLevel">
                    <h1>{{ currentLevel.name }}</h1>
                    <p class="type-label-md">Создатель: {{ currentLevel.author }}</p>
                    <p class="type-label-md" v-if="currentLevel.verifier">Верификатор: {{ currentLevel.verifier }}</p>
                    <div v-if="embedUrl" class="video">
                        <iframe :src="embedUrl" frameborder="0" allowfullscreen></iframe>
                    </div>
                    <ul class="stats">
                        <li>
                            <h2>{{ getPoints(selected + 1, 100, currentLevel.percentToQualify) }}</h2>
                            <p>Очки за 100%</p>
                        </li>
                        <li>
                            <h2>{{ currentLevel.percentToQualify || 100 }}%</h2>
                            <p>Мин. процент</p>
                        </li>
                        <li v-if="currentLevel.id">
                            <h2>{{ currentLevel.id }}</h2>
                            <p>ID Уровня</p>
                        </li>
                    </ul>
                    <h2>Рекорды</h2>
                    <table class="records" v-if="currentLevel.records && currentLevel.records.length">
                        <tr v-for="(record, rIdx) in currentLevel.records" :key="rIdx">
                            <td class="user">
                                <p>{{ record.user }}</p>
                            </td>
                            <td class="percent">
                                <p>{{ record.percent }}%</p>
                            </td>
                            <td class="link">
                                <a v-if="record.link" :href="record.link" target="_blank">🎬</a>
                            </td>
                        </tr>
                    </table>
                    <p v-else>Нет рекордов.</p>
                </div>
            </div>
            <div class="meta-container">
                <div class="meta">
                    <div class="inner">
                        <h3>Правила</h3>
                        <p>1. Запись должна быть с оригинальным звуком.</p>
                        <p>2. Необходим индикатор FPS/TPS.</p>
                    </div>
                </div>
            </div>
        </main>
    `,
    data: () => ({
        list: [],
        selected: 0,
        loading: true
    }),
    computed: {
        currentLevel() {
            if (!this.list[this.selected]) return null;
            return this.list[this.selected][0];
        },
        embedUrl() {
            if (!this.currentLevel || !this.currentLevel.verification) return null;
            const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
            const match = this.currentLevel.verification.match(regExp);
            return (match && match[2].length === 11) ? `https://www.youtube.com/embed/${match[2]}` : null;
        }
    },
    async mounted() {
        this.list = await fetchList();
        this.loading = false;
    },
    methods: {
        getPoints(rank, percent, minPercent) {
            if (typeof score === "function") {
                return Math.round(score(rank, percent, minPercent || 100));
            }
            return percent === 100 ? Math.max(100 - rank, 10) : 0;
        }
    }
};
