import { store } from "../main.js";
import { embed } from "../util.js";
import { score } from "../score.js";
import { fetchEditors, fetchList } from "../content.js";

import Spinner from "../components/Spinner.js";
import LevelAuthors from "../components/List/LevelAuthors.js";

const roleIconMap = {
    owner: "crown",
    admin: "user-gear",
    helper: "user-shield",
    dev: "code",
    trial: "user-lock",
};

export default {
    components: { Spinner, LevelAuthors },
    template: `
        <main v-if="loading">
            <Spinner></Spinner>
        </main>
        <main v-else class="gdl-page-list">
            <!-- Поисковая строка и фильтр -->
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

            <div class="gdl-content-grid">
                <!-- Карточки уровней (в стиле Global Demonlist) -->
                <div class="gdl-cards-container">
                    <div 
                        v-for="([level, err], i) in filteredList" 
                        :key="i"
                        class="gdl-level-card"
                        :class="{ 'active': selectedLevelIndex === getOriginalIndex(level), 'error': !level }"
                        @click="selectLevelByItem(level, i)"
                    >
                        <!-- Превью уровня (вытаскиваем превью из YouTube) -->
                        <div class="gdl-card-thumb">
                            <img 
                                v-if="level" 
                                :src="getThumbnail(level)" 
                                alt="Level Thumbnail"
                                @error="handleImgError"
                            />
                            <div v-else class="thumb-placeholder">Error</div>
                            <span class="rank-badge">#{{ getOriginalIndex(level) + 1 }}</span>
                        </div>

                        <!-- Информация об уровне -->
                        <div class="gdl-card-info" v-if="level">
                            <div class="card-header">
                                <span class="rank-number">#{{ getOriginalIndex(level) + 1 }}</span>
                                <h3 class="level-title">{{ level.name }}</h3>
                            </div>
                            <div class="card-authors">
                                <span class="author-name">{{ level.author || 'Unknown' }}</span>
                                <span class="separator" v-if="level.verifier">•</span>
                                <span class="verifier-name" v-if="level.verifier">{{ level.verifier }}</span>
                            </div>
                            <div class="card-points">
                                <span class="points-min">{{ (score(getOriginalIndex(level) + 1, level.percentToQualify || 100, level.percentToQualify) || 0).toFixed(2) }}</span>
                                <span class="points-dash">—</span>
                                <span class="points-max">{{ (score(getOriginalIndex(level) + 1, 100, level.percentToQualify) || 0).toFixed(2) }}</span>
                                <span class="points-label">points</span>
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

                <!-- Правая колонка: Детали выбранного уровня & Правила -->
                <div class="gdl-details-container">
                    <!-- Детали уровня -->
                    <div class="gdl-level-detail-box" v-if="level">
                        <h2 class="detail-title">{{ level.name }}</h2>

                        <LevelAuthors
                            :author="level.author"
                            :creators="level.creators"
                            :verifier="level.verifier"
                        ></LevelAuthors>

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
                                <span class="stat-value">{{ level.password || 'Free' }}</span>
                            </div>
                        </div>

                        <!-- Таблица рекордов -->
                        <div class="records-section">
                            <h3 class="section-subtitle">Records</h3>
                            <p class="records-req" v-if="selected + 1 <= 75">
                                <strong>{{ level.percentToQualify }}%</strong> или лучше для прохождения
                            </p>
                            <p class="records-req" v-else-if="selected + 1 <= 150">
                                <strong>100%</strong> для прохождения
                            </p>
                            <p class="records-req" v-else>
                                Этот уровень больше не принимает новые рекорды.
                            </p>

                            <div class="records-table-wrapper">
                                <table class="records-table">
                                    <tbody>
                                        <tr v-for="(record, rIdx) in level.records" :key="rIdx" class="record-row">
                                            <td class="percent-col">{{ record.percent }}%</td>
                                            <td class="user-col">
                                                <a :href="record.link" target="_blank" class="user-link">
                                                    {{ record.user }}
                                                </a>
                                            </td>
                                            <td class="hz-col">{{ record.hz }}Hz</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    <!-- Правила & Эдиторы -->
                    <div class="gdl-meta-box">
                        <div class="errors-list" v-if="errors.length > 0">
                            <div class="error-badge" v-for="error of errors" :key="error">
                                {{ error }}
                            </div>
                        </div>

                        <template v-if="editors && editors.length">
                            <h3>List Editors</h3>
                            <ul class="editors-list">
                                <li v-for="editor in editors" :key="editor.name">
                                    <img
                                        :src="\`/assets/\${roleIconMap[editor.role]}\${store.dark ? '-dark' : ''}.svg\`"
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
                                <li><strong>1. Запрещены читы.</strong> Любое использование читов, взломов и других способов нечестного прохождения запрещено.</li>
                                <li><strong>2. Обязательные клики.</strong> Видео рекорда должно содержать клики мыши или тапы по экрану.</li>
                                <li><strong>3. RAW-футаж.</strong> Рекорд должен быть предоставлен в виде оригинальной записи без монтажа.</li>
                                <li><strong>4. Без багов и секрет-веев.</strong> Использование secret ways, bug routes и скипов запрещено.</li>
                            </ol>
                        </div>
                    </div>
                </div>
            </div>
        </main>
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

        if (!this.list) {
            this.errors = ["Failed to load list. Retry in a few minutes or notify list staff."];
        } else {
            this.errors.push(
                ...this.list
                    .filter(([_, err]) => err)
                    .map(([_, err]) => `Failed to load level (${err}.json)`)
            );
            if (!this.editors) {
                this.errors.push("Failed to load list editors.");
            }
        }

        this.loading = false;
    },

    methods: {
        embed,
        score,
        getOriginalIndex(level) {
            if (!level) return 0;
            return this.list.findIndex(([l, _]) => l === level);
        },
        selectLevelByItem(level, filteredIdx) {
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
            e.target.src = 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg'; // fallback
        }
    },
};
