import { fetchList } from "../content.js";
import Spinner from "../components/Spinner.js";

export default {
    components: { Spinner },
    template: `
        <main v-if="loading" class="list-wrapper">
            <Spinner></Spinner>
        </main>

        <div v-else class="list-container">
            <!-- ЛЕВАЯ ЧАСТЬ: ИНФОРМАЦИЯ О ВЫБРАННОМ УРОВНЕ -->
            <div class="level-content" v-if="selectedLevel">
                <!-- ВИДЕО -->
                <div class="video-container" v-if="selectedLevel.ytid">
                    <iframe 
                        :src="embed(selectedLevel.ytid)" 
                        frameborder="0" 
                        allowfullscreen
                    ></iframe>
                </div>

                <!-- ИНФОРМАЦИЯ -->
                <div class="level-info">
                    <h1>{{ selectedLevel.name }}</h1>
                    <p class="author">
                        By <strong>{{ selectedLevel.author }}</strong> | Verified by <strong>{{ selectedLevel.verifier }}</strong>
                    </p>

                    <div class="stats-grid">
                        <div class="stat-card">
                            <span class="lbl">POINTS</span>
                            <span class="val">{{ score(selectedLevel.rank) }}</span>
                        </div>
                        <div class="stat-card">
                            <span class="lbl">QUALIFY</span>
                            <span class="val">{{ selectedLevel.percentToQualify }}%</span>
                        </div>
                    </div>
                </div>

                <!-- РЕКОРДЫ (RECORDS) -->
                <div class="records-section">
                    <h2>Records ({{ recordsList.length }})</h2>
                    <div class="records-list" v-if="recordsList.length">
                        <div 
                            v-for="(rec, idx) in recordsList" 
                            :key="idx" 
                            class="record-item"
                        >
                            <span class="rec-user">{{ rec.user || rec.name }}</span>
                            <span class="rec-detail">{{ rec.percent }}% ({{ rec.hz || 60 }}Hz)</span>
                            <a v-if="rec.link" :href="rec.link" target="_blank" class="rec-link">▶</a>
                        </div>
                    </div>
                    <p v-else class="no-records">No records yet.</p>
                </div>
            </div>

            <!-- ПРАВАЯ ЧАСТЬ: СПИСОК УРОВНЕЙ -->
            <div class="sidebar-list">
                <div 
                    v-for="level in list" 
                    :key="level.path || level.rank" 
                    class="sidebar-item"
                    :class="{ 'active': selectedLevel?.name === level.name }"
                    @click="selectedLevel = level"
                >
                    <span class="rank-num">#{{ level.rank }}</span>
                    <div class="level-name-block">
                        <span class="lname">{{ level.name }}</span>
                        <span class="lauthor">{{ level.author }}</span>
                    </div>
                </div>
            </div>
        </div>
    `,

    data: () => ({
        list: [],
        loading: true,
        selectedLevel: null
    }),

    computed: {
        recordsList() {
            if (!this.selectedLevel || !this.selectedLevel.records) return [];
            // Защита от случая, если records — объект или undefined
            if (!Array.isArray(this.selectedLevel.records)) return [];
            return this.selectedLevel.records;
        }
    },

    async mounted() {
        const data = await fetchList();
        this.list = Array.isArray(data) ? data : [];
        if (this.list.length > 0) {
            this.selectedLevel = this.list[0];
        }
        this.loading = false;
    },

    methods: {
        embed(ytid) {
            if (!ytid) return '';
            if (ytid.includes('youtube.com') || ytid.includes('youtu.be')) {
                const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
                const match = ytid.match(regExp);
                return (match && match[2].length === 11) ? `https://www.youtube.com/embed/${match[2]}` : ytid;
            }
            return `https://www.youtube.com/embed/${ytid}`;
        },

        score(rank) {
            if (!rank || typeof rank !== 'number') return 0;
            // Пример расчета очков по рангу
            return Math.max(100 - (rank - 1) * 2, 5);
        }
    }
};
