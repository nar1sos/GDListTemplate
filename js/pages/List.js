import { store } from "../main.js";
import { embed } from "../util.js";
import { score } from "../score.js";
import { fetchEditors, fetchList } from "../content.js";

import Spinner from "../components/Spinner.js";

const roleIconMap = {
    owner: "crown",
    admin: "user-gear",
    helper: "user-shield",
    dev: "code",
    trial: "user-lock",
};

export default {
    components: { Spinner },
    template: `
        <main v-if="loading" class="gdl-loading">
            <Spinner></Spinner>
        </main>
        <div v-else class="gdl-wrapper">
            <!-- Поиск -->
            <div class="gdl-search-bar">
                <div class="search-input-wrapper">
                    <span class="search-icon">🔍</span>
                    <input 
                        type="text" 
                        v-model="searchQuery" 
                        placeholder="Search levels, authors, verifiers..." 
                        class="gdl-input"
                    />
                    <button v-if="searchQuery" @click="searchQuery = ''" class="clear-btn">✕</button>
                </div>
            </div>

            <!-- Главный контент -->
            <div class="gdl-content-grid">
                
                <!-- Список карт -->
                <div class="gdl-cards-container">
                    <div 
                        v-for="([lvl, err], i) in filteredList" 
                        :key="i"
                        class="gdl-level-card"
                        :class="{ 'active': selectedLevelIndex === getOriginalIndex(lvl), 'error': !lvl }"
                        @click="selectLevelByItem(lvl)"
                    >
                        <div class="gdl-card-thumb">
                            <img 
                                v-if="lvl" 
                                :src="getThumbnail(lvl)" 
                                alt="Thumbnail"
                                @error="handleImgError"
                            />
                            <div v-else class="thumb-placeholder">Error</div>
                            <span class="rank-badge">#{{ getOriginalIndex(lvl) + 1 }}</span>
                        </div>

                        <div class="gdl-card-info" v-if="lvl">
                            <div class="card-header">
                                <span class="rank-number">#{{ getOriginalIndex(lvl) + 1 }}</span>
                                <h3 class="level-title">{{ lvl.name }}</h3>
                            </div>
                            <div class="card-authors">
                                <span class="author-name">{{ lvl.author || 'Unknown' }}</span>
                                <span class="separator" v-if="lvl.verifier">•</span>
                                <span class="verifier-name" v-if="lvl.verifier">{{ lvl.verifier }}</span>
                            </div>
                            <div class="card-points">
                                <span class="points-min">{{ (score(getOriginalIndex(lvl) + 1, lvl.percentToQualify || 100, lvl.percentToQualify) || 0).toFixed(2) }}</span>
                                <span class="points-dash">—</span>
                                <span class="points-max">{{ (score(getOriginalIndex(lvl) + 1, 100, lvl.percentToQualify) || 0).toFixed(2) }}</span>
                                <span class="points-label">pts</span>
                            </div>
                        </div>

                        <div class="gdl-card-info" v-else>
                            <h3 class="level-title error-text">Error loading level ({{ err }}.json)</h3>
                        </div>
                    </div>

                    <div v-if="filteredList.length === 0" class="empty-results">
                        Ничего не найдено по запросу "{{ searchQuery }}"
                    </div>
                </div>

                <!-- Правая колонка -->
                <div class="gdl-details-container">
                    
                    <div class="gdl-level-detail-box" v-if="level">
                        <h2 class="detail-title">{{ level.name }}</h2>

                        <!-- Чистый блок авторов -->
                        <div class="authors-clean-block">
                            <div class="author-item" v-if="level.creators && level.creators.length">
                                <div class="author-label">CREATORS</div>
                                <div class="author-val">{{ level.creators.join(', ') }}</div>
                            </div>
                            <div class="author-item" v-else-if="level.author">
                                <div class="author-label">CREATORS</div>
                                <div class="author-val">{{ level.author }}</div>
                            </div>

                            <div class="author-item" v-if="level.verifier">
                                <div class="author-label">VERIFIER</div>
                                <div class="author-val">{{ level.verifier }}</div>
                            </div>

                            <div class="author-item" v-if="level.author && level.creators && level.creators.length">
                                <div class="author-label">PUBLISHER</div>
                                <div class="author-val">{{ level.author }}</div>
                            </div>
                        </div>

                        <div class="video-wrapper">
                            <iframe
                                class="video"
                                id="videoframe"
                                :src="video"
                                frameborder="0"
                                allowfullscreen
                            ></iframe>
                        </div>

                        <div class="gdl-stats-grid">
                            <div class="stat-item">
                                <span class="stat-label">Points</span>
                                <span class="stat-value">{{ score(selected + 1, 100, level.percentToQualify) }}</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">ID</span>
                                <span class="stat-value">{{ level.id }}</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">Password</span>
                                <span class="stat-value">{{ level.password || 'Free Copy' }}</span>
                            </div>
                        </div>

                        <!-- Секция рекордов в стиле оригинала -->
                        <div class="records-section">
                            <div class="records-header">
                                <span class="records-trophy">🏆</span>
                                <div class="records-header-text">
                                    <h3 class="section-subtitle">Records</h3>
                                    <p class="records-count-info" v-if="level.records">
                                        <strong>{{ level.records.length }}</strong> records in total, 
                                        <span class="highlight-100">{{ level.records.filter(r => r.percent === 100).length }}</span> of which are 100%
                                    </p>
                                </div>
                            </div>

                            <div class="records-list" v-if="level.records && level.records.length > 0">
                                <div v-for="(record, rIdx) in level.records" :key="rIdx" class="record-card">
                                    <div class="record-user-info">
                                        <span class="user-name">{{ record.user }}</span>
                                    </div>
                                    <div class="record-meta-info">
                                        <span class="percent-tag">{{ record.percent }}%</span>
                                        <a :href="record.link" target="_blank" class="record-video-btn" title="Watch video">
                                            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>
                                            </svg>
                                        </a>
                                    </div>
                                </div>
                            </div>
                            <div v-else class="no-records">No records yet</div>
                        </div>
                    </div>

                    <!-- Эдиторы и Правила -->
                    <div class="gdl-meta-box">
                        <template v-if="editors && editors.length">
                            <h3>List Editors</h3>
                            <ul class="editors-list">
                                <li v-for="editor in editors" :key="editor.name">
                                    <img
                                        :src="\`/assets/\${roleIconMap[editor.role]}-dark.svg\`"
                                        :alt="editor.role"
                                        class="role-icon"
                                    >
                                    <a v-if="editor.link" :href="editor.link" target="_blank" class="editor-link">
                                        {{ editor.name }}
                                    </a>
                                    <span v-else class="editor-name">{{ editor.name }}</span>
                                </li>
                            </ul>
                        </template>

                        <div class="rules-section">
                            <h3>Rules</h3>
                            <ol class="rules-list">
                                <li><strong>1. Запрещены читы.</strong> Любое использование читов запрещено.</li>
                                <li><strong>2. Обязательные клики.</strong> Запись должна содержать слышимые клики.</li>
                                <li><strong>3. RAW-футаж.</strong> Оригинальная запись без скрывающего монтажа.</li>
                                <li><strong>4. Без секрет-веев.</strong> Скипы и баг-маршруты запрещены.</li>
                            </ol>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    `,

    data: () => ({
        list: [],
        editors: [],
        loading: true,
        selected: 0,
        searchQuery: "",
        errors: [],
        roleIconMap,
        store
    }),

    computed: {
        filteredList() {
            if (!this.searchQuery.trim()) return this.list;
            const q = this.searchQuery.toLowerCase().trim();
            return this.list.filter(([lvl, _]) => {
                if (!lvl) return false;
                const nameMatch = lvl.name?.toLowerCase().includes(q);
                const authorMatch = lvl.author?.toLowerCase().includes(q);
                const verifierMatch = lvl.verifier?.toLowerCase().includes(q);
                return nameMatch || authorMatch || verifierMatch;
            });
        },
        selectedLevelIndex() {
            return this.selected;
        },
        level() {
            return this.list[this.selected]?.[0] || null;
        },
        video() {
            if (!this.level) return '';
            const link = this.level.showcase || this.level.verification;
            return embed(link);
        },
    },

    async mounted() {
        this.list = await fetchList();
        this.editors = await fetchEditors();
        this.loading = false;
    },

    methods: {
        embed,
        score,
        getOriginalIndex(level) {
            if (!level) return 0;
            return this.list.findIndex(([l, _]) => l === level);
        },
        selectLevelByItem(level) {
            if (!level) return;
            const origIdx = this.getOriginalIndex(level);
            if (origIdx !== -1) {
                this.selected = origIdx;
            }
        },
        getYoutubeId(url) {
            if (!url) return null;
            const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
            return match ? match[1] : null;
        },
        getThumbnail(level) {
            if (level.thumbnail) return level.thumbnail;
            const videoUrl = level.verification || level.showcase;
            const ytId = this.getYoutubeId(videoUrl);
            if (ytId) {
                return `https://i.ytimg.com/vi/${ytId}/hqdefault.jpg`;
            }
            return '/assets/no-thumb.png';
        },
        handleImgError(e) {
            e.target.src = 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg';
        }
    },
};
