const USERS_KEY = "cinemaxCesdeUsers";
const SESSION_KEY = "cinemaxCesdeSession";

const authDialog = document.querySelector("#authDialog");
const authButton = document.querySelector("#authButton");
const loginForm = document.querySelector("#loginForm");
const registerForm = document.querySelector("#registerForm");
const authMessage = document.querySelector("#authMessage");
const toast = document.querySelector("#toast");
let toastTimeout;

function readStorage(key, fallback) {
    try {
        const value = localStorage.getItem(key);
        return value ? JSON.parse(value) : fallback;
    } catch {
        return fallback;
    }
}

function getUsers() {
    const users = readStorage(USERS_KEY, []);
    return Array.isArray(users) ? users : [];
}

function getCurrentUser() {
    const email = localStorage.getItem(SESSION_KEY);
    return getUsers().find((user) => user.email === email) || null;
}

function showToast(message) {
    window.clearTimeout(toastTimeout);
    if (authDialog.open) {
        authMessage.textContent = message;
        authMessage.hidden = false;
        toastTimeout = window.setTimeout(() => { authMessage.hidden = true; }, 3200);
        return;
    }

    toast.textContent = message;
    toast.classList.add("is-visible");
    toastTimeout = window.setTimeout(() => toast.classList.remove("is-visible"), 3200);
}

function updateSessionButton() {
    const user = getCurrentUser();
    authButton.textContent = user ? "Cerrar sesión" : "Iniciar sesión";
    authButton.setAttribute("aria-label", user ? `Cerrar sesión de ${user.name}` : "Iniciar sesión");
}

function openAuth(mode = "login") {
    setAuthMode(mode);
    authDialog.showModal();
}

function setAuthMode(mode) {
    const isRegister = mode === "register";
    authMessage.hidden = true;
    authMessage.textContent = "";
    loginForm.hidden = isRegister;
    registerForm.hidden = !isRegister;
    document.querySelector("#authTitle").textContent = isRegister ? "Crea tu cuenta." : "Qué bueno verte.";
    document.querySelectorAll("[data-auth-mode]").forEach((tab) => {
        const active = tab.dataset.authMode === mode;
        tab.classList.toggle("is-active", active);
        tab.setAttribute("aria-selected", String(active));
    });
}

authButton.addEventListener("click", () => {
    if (getCurrentUser()) {
        localStorage.removeItem(SESSION_KEY);
        updateSessionButton();
        showToast("Sesión cerrada. ¡Hasta la próxima función!");
        return;
    }
    openAuth();
});

document.querySelectorAll("[data-auth-mode]").forEach((tab) => {
    tab.addEventListener("click", () => setAuthMode(tab.dataset.authMode));
});

registerForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(registerForm);
    const name = formData.get("name").trim();
    const email = formData.get("email").trim().toLowerCase();
    const password = formData.get("password");
    const users = getUsers();

    if (users.some((user) => user.email === email)) {
        showToast("Ya existe una cuenta con ese correo.");
        return;
    }

    users.push({ name, email, password, tickets: [] });
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    localStorage.setItem(SESSION_KEY, email);
    registerForm.reset();
    authDialog.close();
    updateSessionButton();
    showToast(`¡Bienvenido, ${name}!`);
});

loginForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(loginForm);
    const email = formData.get("email").trim().toLowerCase();
    const password = formData.get("password");
    const user = getUsers().find((account) => account.email === email);

    if (!user) {
        showToast("No existe una cuenta con ese correo.");
        return;
    }

    if (user.password !== password) {
        showToast("La contraseña es incorrecta.");
        return;
    }

    localStorage.setItem(SESSION_KEY, user.email);
    loginForm.reset();
    authDialog.close();
    updateSessionButton();
    showToast(`¡Bienvenido, ${user.name}!`);
});

updateSessionButton();