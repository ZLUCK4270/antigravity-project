// Referencias a elementos del DOM
const authSection     = document.getElementById('auth-section');
const dashboardSection = document.getElementById('dashboard-section');
const loginForm       = document.getElementById('login-form');
const registerForm    = document.getElementById('register-form');
const btnToggleAuth   = document.getElementById('btn-toggle-auth');
const btnToggleLogin  = document.getElementById('btn-toggle-login');
const authMessage     = document.getElementById('auth-message');

const userDisplay     = document.getElementById('user-display');
const btnLogout       = document.getElementById('btn-logout');

const timerDisplay    = document.getElementById('timer-display');
const statusBadge     = document.getElementById('status-badge');
const btnStart        = document.getElementById('btn-start');
const btnPause        = document.getElementById('btn-pause');
const btnResume       = document.getElementById('btn-resume');
const btnEnd          = document.getElementById('btn-end');

const historyList     = document.getElementById('history-list');

// Estado global
let currentUser      = null;
let currentSession   = null;
let timerInterval    = null;
let workedMsOnPause  = 0;   // tiempo trabajado acumulado antes de la pausa actual

// ─── Inicialización ──────────────────────────────────────────────────────────
async function init() {
    const { data: { session } } = await sb.auth.getSession();
    handleSession(session);

    sb.auth.onAuthStateChange((_event, session) => {
        handleSession(session);
    });
}

function handleSession(session) {
    if (session) {
        currentUser = session.user;
        userDisplay.textContent = currentUser.email;
        showDashboard();
        loadCurrentState();
        loadHistory();
    } else {
        currentUser = null;
        showAuth();
    }
}

// ─── Cambio de pantallas ─────────────────────────────────────────────────────
function showAuth() {
    authSection.classList.remove('hidden');
    authSection.classList.add('active');
    dashboardSection.classList.add('hidden');
    dashboardSection.classList.remove('active');
}

function showDashboard() {
    authSection.classList.add('hidden');
    authSection.classList.remove('active');
    dashboardSection.classList.remove('hidden');
    dashboardSection.classList.add('active');
}

// ─── Autenticación ───────────────────────────────────────────────────────────
btnToggleAuth.addEventListener('click', () => {
    loginForm.classList.add('hidden');
    registerForm.classList.remove('hidden');
    authMessage.textContent = '';
});

btnToggleLogin.addEventListener('click', () => {
    registerForm.classList.add('hidden');
    loginForm.classList.remove('hidden');
    authMessage.textContent = '';
});

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    authMessage.textContent = 'Iniciando sesión...';
    authMessage.style.color = 'var(--text-secondary)';

    try {
        const { error } = await sb.auth.signInWithPassword({ email, password });
        if (error) throw error;
        authMessage.textContent = '';
    } catch (err) {
        authMessage.textContent = err.message || 'Error al iniciar sesión';
        authMessage.style.color = 'var(--danger)';
        console.error('Error login:', err);
    }
});

registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value;

    authMessage.textContent = 'Creando cuenta...';
    authMessage.style.color = 'var(--text-secondary)';

    try {
        const { error } = await sb.auth.signUp({ email, password });
        if (error) throw error;

        authMessage.textContent = '¡Registro exitoso! Ahora inicia sesión.';
        authMessage.style.color = 'var(--success)';
        registerForm.classList.add('hidden');
        loginForm.classList.remove('hidden');
    } catch (err) {
        authMessage.textContent = err.message || 'Error en el registro';
        authMessage.style.color = 'var(--danger)';
        console.error('Error registro:', err);
    }
});

btnLogout.addEventListener('click', async () => {
    await sb.auth.signOut();
});

// ─── Carga estado actual ─────────────────────────────────────────────────────
async function loadCurrentState() {
    if (!currentUser) return;

    const { data, error } = await sb
        .from('jornadas')
        .select('*')
        .eq('usuario_id', currentUser.id)
        .is('fin', null)
        .maybeSingle();

    if (error) {
        console.error('Error al cargar jornada activa:', error.message);
        return;
    }

    if (data) {
        currentSession = data;
        const now = new Date();

        if (data.estado === 'activa') {
            let ms = now - new Date(data.inicio);
            if (data.break_inicio && data.break_fin) {
                ms -= (new Date(data.break_fin) - new Date(data.break_inicio));
            }
            workedMsOnPause = ms;
            startTimer();
        } else if (data.estado === 'pausada') {
            let ms = new Date(data.break_inicio) - new Date(data.inicio);
            if (data.break_fin) {
                ms += (new Date(data.break_fin) - new Date(data.break_inicio));
            }
            workedMsOnPause = ms;
            updateTimerDisplay();
        }

        updateControls();
    } else {
        currentSession = null;
        workedMsOnPause = 0;
        stopTimer();
        timerDisplay.textContent = '00:00:00';
        updateControls();
    }
}

function updateControls() {
    btnStart.classList.add('hidden');
    btnPause.classList.add('hidden');
    btnResume.classList.add('hidden');
    btnEnd.classList.add('hidden');

    if (!currentSession) {
        btnStart.classList.remove('hidden');
        statusBadge.textContent = 'Inactivo';
        statusBadge.style.color = 'var(--text-secondary)';
        return;
    }

    btnEnd.classList.remove('hidden');

    if (currentSession.estado === 'activa') {
        btnPause.classList.remove('hidden');
        statusBadge.textContent = 'Trabajando';
        statusBadge.style.color = 'var(--success)';
    } else if (currentSession.estado === 'pausada') {
        btnResume.classList.remove('hidden');
        statusBadge.textContent = 'En Pausa';
        statusBadge.style.color = 'var(--warning)';
    }
}

// ─── Temporizador ────────────────────────────────────────────────────────────
function startTimer() {
    stopTimer();
    timerInterval = setInterval(updateTimerDisplay, 1000);
    updateTimerDisplay(); // actualización inmediata
}

function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

function updateTimerDisplay() {
    if (!currentSession) {
        timerDisplay.textContent = '00:00:00';
        return;
    }

    const now = new Date();
    let ms = workedMsOnPause;

    if (currentSession.estado === 'activa') {
        if (currentSession.break_inicio && !currentSession.break_fin) {
            // pausa en curso → no contamos más
        } else {
            const lastStart = currentSession.break_fin || currentSession.inicio;
            ms += now - new Date(lastStart);
        }
    }
    // si está pausado → mostramos el valor congelado

    const { h, m, s } = msToHms(ms);
    timerDisplay.textContent = `${pad(h)}:${pad(m)}:${pad(s)}`;
}

function msToHms(ms) {
    const totalSec = Math.floor(ms / 1000);
    return {
        h: Math.floor(totalSec / 3600),
        m: Math.floor((totalSec % 3600) / 60),
        s: totalSec % 60
    };
}

function pad(n) {
    return String(n).padStart(2, '0');
}

// ─── Acciones ────────────────────────────────────────────────────────────────
btnStart.addEventListener('click', async () => {
    try {
        const { data, error } = await sb
            .from('jornadas')
            .insert([{
                usuario_id: currentUser.id,
                estado: 'activa',
                inicio: new Date().toISOString()
            }])
            .select()
            .single();

        if (error) throw error;

        currentSession = data;
        workedMsOnPause = 0;
        updateControls();
        startTimer();
    } catch (err) {
        console.error('Error iniciar jornada:', err);
        alert('No se pudo iniciar la jornada');
    }
});

btnPause.addEventListener('click', async () => {
    try {
        const now = new Date().toISOString();
        const { data, error } = await sb
            .from('jornadas')
            .update({
                estado: 'pausada',
                break_inicio: now
            })
            .eq('id', currentSession.id)
            .select()
            .single();

        if (error) throw error;

        currentSession = data;
        workedMsOnPause = new Date() - new Date(currentSession.inicio);
        updateControls();
        updateTimerDisplay();
    } catch (err) {
        console.error('Error pausar:', err);
        alert('Error al pausar');
    }
});

btnResume.addEventListener('click', async () => {
    try {
        const now = new Date().toISOString();
        const { data, error } = await sb
            .from('jornadas')
            .update({
                estado: 'activa',
                break_fin: now
            })
            .eq('id', currentSession.id)
            .select()
            .single();

        if (error) throw error;

        currentSession = data;
        const pausaMs = new Date(now) - new Date(currentSession.break_inicio);
        workedMsOnPause += pausaMs;
        updateControls();
        startTimer();
    } catch (err) {
        console.error('Error reanudar:', err);
        alert('Error al reanudar');
    }
});

btnEnd.addEventListener('click', async () => {
    try {
        const updates = {
            fin: new Date().toISOString(),
            estado: 'completada'
        };

        if (currentSession.estado === 'pausada' && !currentSession.break_fin) {
            updates.break_fin = new Date().toISOString();
        }

        const { error } = await sb
            .from('jornadas')
            .update(updates)
            .eq('id', currentSession.id);

        if (error) throw error;

        currentSession = null;
        workedMsOnPause = 0;
        stopTimer();
        timerDisplay.textContent = '00:00:00';
        updateControls();
        loadHistory();
    } catch (err) {
        console.error('Error finalizar:', err);
        alert('Error al finalizar jornada');
    }
});

// ─── Historial ───────────────────────────────────────────────────────────────
async function loadHistory() {
    const { data: jornadas, error } = await sb
        .from('jornadas')
        .select('*')
        .eq('usuario_id', currentUser.id)
        .order('inicio', { ascending: false });

    if (error) {
        console.error('Error historial:', error.message);
        return;
    }

    historyList.innerHTML = '';

    jornadas.forEach(j => {
        const row = document.createElement('tr');
        const start = new Date(j.inicio);
        const end = j.fin ? new Date(j.fin) : null;

        let pauseMs = 0;
        if (j.break_inicio && j.break_fin) {
            pauseMs = new Date(j.break_fin) - new Date(j.break_inicio);
        }

        let totalStr = 'En curso...';
        if (end) {
            const durationMs = (end - start) - pauseMs;
            const h = Math.floor(durationMs / 3600000);
            const m = Math.floor((durationMs % 3600000) / 60000);
            totalStr = `${h}h ${m}m`;
        }

        const dateStr    = start.toLocaleDateString();
        const startStr   = start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const endStr     = end ? end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-';
        const breakStart = j.break_inicio ? new Date(j.break_inicio).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-';
        const breakEnd   = j.break_fin ? new Date(j.break_fin).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-';

        row.innerHTML = `
            <td>${dateStr}</td>
            <td>${startStr}</td>
            <td>${breakStart}</td>
            <td>${breakEnd}</td>
            <td>${endStr}</td>
            <td>${totalStr}</td>
        `;
        historyList.appendChild(row);
    });
}

// ─── Arrancar la aplicación ──────────────────────────────────────────────────
init();