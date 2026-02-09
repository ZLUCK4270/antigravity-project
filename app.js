// Referencias a elementos del DOM
const authSection     = document.getElementById('auth-section');
const dashboardSection = document.getElementById('dashboard-section');
const loginForm       = document.getElementById('login-form');
const registerForm    = document.getElementById('register-form');
const btnToggleAuth   = document.getElementById('btn-toggle-auth');
const btnToggleLogin  = document.getElementById('btn-toggle-login');
const authMessage     = document.getElementById('auth-message');
const dashboardMessage = document.getElementById('dashboard-message');

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
let currentPauses    = []; // Array de pausas de la sesión actual
let timerInterval    = null;

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

    // Cargamos la jornada activa (sin fecha de fin) y sus pausas
    const { data, error } = await sb
        .from('jornadas')
        .select(`
            *,
            pausas (*)
        `)
        .eq('usuario_id', currentUser.id)
        .is('fin', null)
        .maybeSingle();

    if (error) {
        console.error('Error al cargar jornada activa:', error.message);
        return;
    }

    if (data) {
        currentSession = data;
        currentPauses = data.pausas || [];
        
        // Calcular tiempo si ya está corriendo
        if (data.estado === 'activa') {
            startTimer();
        } else {
            updateTimerDisplay(); // Mostrar tiempo congelado
        }
        updateControls();
    } else {
        currentSession = null;
        currentPauses = [];
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
        statusBadge.textContent = 'No Iniciado';
        statusBadge.style.color = 'var(--text-secondary)';
        return;
    }

    btnEnd.classList.remove('hidden');

    if (currentSession.estado === 'activa') {
        btnPause.classList.remove('hidden');
        statusBadge.textContent = 'Activo';
        statusBadge.style.color = 'var(--success)';
    } else if (currentSession.estado === 'pausada') {
        btnResume.classList.remove('hidden');
        statusBadge.textContent = 'En Break';
        statusBadge.style.color = 'var(--warning)';
    }
}

// ─── Temporizador ────────────────────────────────────────────────────────────
function startTimer() {
    stopTimer();
    timerInterval = setInterval(updateTimerDisplay, 1000);
    updateTimerDisplay();
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
    const start = new Date(currentSession.inicio);
    
    // Calcular tiempo total transcurrido desde inicio
    let totalElapsed = now - start;

    // Calcular tiempo total de pausas
    let totalPauseTime = 0;
    
    currentPauses.forEach(p => {
        const pStart = new Date(p.inicio);
        const pEnd = p.fin ? new Date(p.fin) : now; // Si no ha terminado, cuenta hasta ahora
        totalPauseTime += (pEnd - pStart);
    });

    // Si la sesión está pausada, el tiempo 'now' sigue avanzando,
    // pero ese avance se suma a 'totalPauseTime' automáticamente en la línea anterior (p.fin ? ... : now),
    // por lo que (totalElapsed - totalPauseTime) se mantiene constante.
    
    let workedMs = totalElapsed - totalPauseTime;
    if (workedMs < 0) workedMs = 0; // Seguridad

    const { h, m, s } = msToHms(workedMs);
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
        currentPauses = [];
        updateControls();
        startTimer();
    } catch (err) {
        console.error('Error iniciar jornada:', err);
        showDashboardMessage('No se pudo iniciar la jornada', 'error');
    }
});

btnPause.addEventListener('click', async () => {
    try {
        const now = new Date().toISOString();
        
        // 1. Actualizar estado de jornada
        const { error: errJornada } = await sb
            .from('jornadas')
            .update({ estado: 'pausada' })
            .eq('id', currentSession.id);
        
        if (errJornada) throw errJornada;

        // 2. Insertar nueva pausa
        const { data: pauseData, error: errPausa } = await sb
            .from('pausas')
            .insert([{
                jornada_id: currentSession.id,
                inicio: now
            }])
            .select()
            .single();

        if (errPausa) throw errPausa;

        // Actualizar estado local
        currentSession.estado = 'pausada';
        currentPauses.push(pauseData);
        
        updateControls();
        updateTimerDisplay(); // Se actualizará una última vez y quedará "congelado" visualmente
    } catch (err) {
        console.error('Error pausar:', err);
        showDashboardMessage('Error al pausar la jornada', 'error');
    }
});

btnResume.addEventListener('click', async () => {
    try {
        const now = new Date().toISOString();

        // 1. Actualizar estado de jornada
        const { error: errJornada } = await sb
            .from('jornadas')
            .update({ estado: 'activa' })
            .eq('id', currentSession.id);

        if (errJornada) throw errJornada;

        // 2. Encontrar la pausa abierta y cerrarla
        // Buscamos en local la pausa que no tiene 'fin'
        const openPauseIndex = currentPauses.findIndex(p => !p.fin);
        
        if (openPauseIndex !== -1) {
            const pauseId = currentPauses[openPauseIndex].id;
            const { data: updatedPause, error: errPausa } = await sb
                .from('pausas')
                .update({ fin: now })
                .eq('id', pauseId)
                .select()
                .single();

            if (errPausa) throw errPausa;
            
            // Actualizar array local
            currentPauses[openPauseIndex] = updatedPause;
        }

        currentSession.estado = 'activa';
        updateControls();
        startTimer();
    } catch (err) {
        console.error('Error reanudar:', err);
        showDashboardMessage('Error al reanudar la jornada', 'error');
    }
});

btnEnd.addEventListener('click', async () => {
    try {
        const now = new Date().toISOString();

        // Verificar si hay pausa abierta al cerrar
        if (currentSession.estado === 'pausada') {
            const openPause = currentPauses.find(p => !p.fin);
            if (openPause) {
                await sb.from('pausas').update({ fin: now }).eq('id', openPause.id);
            }
        }

        const { error } = await sb
            .from('jornadas')
            .update({
                fin: now,
                estado: 'completada'
            })
            .eq('id', currentSession.id);

        if (error) throw error;

        currentSession = null;
        currentPauses = [];
        stopTimer();
        timerDisplay.textContent = '00:00:00';
        updateControls();
        loadHistory();
    } catch (err) {
        console.error('Error finalizar:', err);
        showDashboardMessage('Error al finalizar jornada', 'error');
    }
});

// ─── UI Helpers ──────────────────────────────────────────────────────────────
function showDashboardMessage(msg, type = 'info') {
    dashboardMessage.textContent = msg;
    dashboardMessage.style.color = type === 'error' ? 'var(--danger)' : 'var(--success)';
    
    // Auto-ocultar después de 3 segundos
    setTimeout(() => {
        dashboardMessage.textContent = '';
    }, 3000);
}

// ─── Historial ───────────────────────────────────────────────────────────────
async function loadHistory() {
    // Traemos jornadas con sus pausas
    const { data: jornadas, error } = await sb
        .from('jornadas')
        .select(`*, pausas (*)`)
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

        // Calcular total pausas
        let totalPauseMs = 0;
        if (j.pausas && j.pausas.length > 0) {
            j.pausas.forEach(p => {
                const pStart = new Date(p.inicio);
                const pEnd = p.fin ? new Date(p.fin) : (end || new Date()); 
                totalPauseMs += (pEnd - pStart);
            });
        }

        let totalStr = 'En curso...';
        if (end) {
            let durationMs = (end - start) - totalPauseMs;
            if(durationMs < 0) durationMs = 0;
            
            const h = Math.floor(durationMs / 3600000);
            const m = Math.floor((durationMs % 3600000) / 60000);
            totalStr = `${h}h ${m}m`;
        }

        // Formato fechas
        const dateStr    = start.toLocaleDateString();
        const startStr   = start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const endStr     = end ? end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-';
        
        // Mostrar resumen de pausas
        // Si hay muchas pausas, mostramos la cantidad o el total
        const breaksInfo = j.pausas && j.pausas.length > 0 
            ? `${j.pausas.length} pausa(s)` 
            : 'Ninguna';

        // Reemplazamos las columnas de break_inicio/fin (que eran fijas) por info más general
        // Ojo: index.html tiene headers fijos. Deberíamos adaptar la tabla o llenar con datos representativos.
        // Para no romper el HTML, pondré la primera pausa en las columnas viejas o guiones.
        
        let firstBreakStart = '-';
        let firstBreakEnd = '-';
        
        if (j.pausas && j.pausas.length > 0) {
            firstBreakStart = new Date(j.pausas[0].inicio).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            firstBreakEnd = j.pausas[0].fin 
                ? new Date(j.pausas[0].fin).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : '...';
            
            if (j.pausas.length > 1) {
                firstBreakEnd += ` (+${j.pausas.length - 1})`;
            }
        }

        row.innerHTML = `
            <td>${dateStr}</td>
            <td>${startStr}</td>
            <td>${firstBreakStart}</td>
            <td>${firstBreakEnd}</td>
            <td>${endStr}</td>
            <td>${totalStr}</td>
        `;
        historyList.appendChild(row);
    });
}

// ─── Arrancar la aplicación ──────────────────────────────────────────────────
init();