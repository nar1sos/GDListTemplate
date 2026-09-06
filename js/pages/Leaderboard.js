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
            <!-- 1. ЛЕВАЯ КОЛОНКА: СПИСОК УРОВНЕЙ -->
            <div class="list-container">
                <table class="list" v-if="list && list.length">
                    <tbody>
                        <tr v-for="([level, err], i) in list" :key="i">
                            <td class="rank">
                                <p class="type-label-lg">#{{ i + 1 }}</p>
                            </td>
                            <td class="level" :class="{ 'active': selected === i }">
                                <button type="button" @click="selected = i">
                                    <span class="type-label-lg">{{ level ? level.name : 'Ошибка (' + err + ')' }}</span>
                                    <span v-if="level" class="type-label-md">{{ getAuthorText(level) }}</span>
                                </button>
                            </td>
                        </tr>
                    </tbody>
                </table>
                <p v-else style="padding: 1rem;">Список уровней пуст или не загрузился.</p>
            </div>

            <!-- 2. ЦЕНТРАЛЬНАЯ КОЛОНКА: ИНФОРМАЦИЯ ОБ УРОВНЕ -->
            <div class="level-container">
                <div class="level" v-if="currentLevel">
                    <h1>{{ currentLevel.name }}</h1>
                    <p class="type-label-md">Создатель: {{ getAuthorText(currentLevel) }}</p>
                    <p class="type-label-md" v-if="currentLevel.verifier">Верификатор: {{ currentLevel.verifier }}</p>
                    
                    <div v-if="embedUrl" class="video">
                        <iframe 
                            :src="embedUrl" 
                            frameborder="0" 
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                            allowfullscreen>
                        </iframe>
                    </div>

                    <ul class="stats">
                        <li>
                            <h2>{{ calculateScore(selected + 1, 100, currentLevel.percentToQualify) }}</h2>
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
                        <tbody>
                            <tr v-for="(record, rIdx) in currentLevel.records" :key="rIdx">
                                <td class="user">
                                    <p>{{ record.user }}</p>
                                </td>
                                <td class="percent">
                                    <p>{{ record.percent }}%</p>
                                </td>
                                <td class="link">
                                    <a v-if="record.link" :href="record.link" target="_blank" rel="noopener noreferrer">🎬</a>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                    <p v-else>Рекордов пока нет.</p>
                </div>
                <div v-else style="padding: 1rem;">
                    <p>Выберите уровень из списка слева.</p>
                </div>
            </div>

            <!-- 3. ПРАВАЯ КОЛОНКА: ИНФО И ПРАВИЛА -->
            <div class="meta-container">
                <div class="meta">
                    <div class="inner">
                        <h3>Правила Demonlist</h3>
                        <p>1. Прохождение должно быть полностью записано на видео.</p>
                        <p>2. Обязателен слышимый звук игры или кликов.</p>
                        <p>3. На видео должен присутствовать счётчик FPS/TPS.</p>
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
            if (!this.list || !this.list[this.selected]) return null;
            return this.list[this.selected][0];
        },

        embedUrl() {
            if (!this.currentLevel || !this.currentLevel.verification) return null;
            const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
            const match = String(this.currentLevel.verification).match(regExp);
            return (match && match[2].length === 11) ? `https://www.youtube.com/embed/${match[2]}` : null;
        }
    },

    async mounted() {
        try {
            this.loading = true;
            const res = await fetchList();
            this.list = Array.isArray(res) ? res : [];
        } catch (e) {
            console.error("Ошибка при загрузке списка:", e);
            this.list = [];
        } finally {
            this.loading = false;
        }
    },

    methods: {
        getAuthorText(level) {
            if (!level) return "Unknown";
            if (Array.isArray(level.creators) && level.creators.length > 0) {
                return level.creators.join(", ");
            }
            return level.author || "Unknown";
        },

        calculateScore(rank, percent, minPercent) {
            try {
                if (typeof score === "function") {
                    const res = score(rank, percent, minPercent || 100);
                    if (!isNaN(res)) return Math.round(res);
                }
            } catch (err) {
                // Игнорируем ошибку внешней функции
            }
            return percent === 100 ? Math.max(100 - rank, 10) : 0;
        }
    }
};
