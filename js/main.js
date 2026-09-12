import routes from './routes.js';

export const store = Vue.reactive({
    dark: JSON.parse(localStorage.getItem('dark')) || false,
    toggleDark() {
        this.dark = !this.dark;
        localStorage.setItem('dark', JSON.stringify(this.dark));
    },
});

const app = Vue.createApp({
    data: () => ({ store }),
});

// Проверяем, что VueRouter существует и массив routes валиден
if (typeof VueRouter !== 'undefined' && Array.isArray(routes)) {
    const router = VueRouter.createRouter({
        history: VueRouter.createWebHashHistory(),
        routes,
    });
    app.use(router);
} else {
    console.error("Ошибка инициализации VueRouter или routes.js");
}

app.mount('#app');
