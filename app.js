// Referencias a elementos del DOM
// Última actualización: 2026-02-08
const authSection = document.getElementById('auth-section');
const dashboardSection = document.getElementById('dashboard-section');

const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const btnToggleAuth = document.getElementById('btn-toggle-auth');
const btnToggleLogin = document.getElementById('btn-toggle-login');
const authMessage = document.getElementById('auth-message');

const userDisplay = document.getElementById('user-display');
const btnLogout = document.getElementById('btn-logout');

const timerDisplay = document.getElementById('timer-display');
const statusBadge = document.getElementById('status-badge');
const btnStart = document.getElementById('btn-start');
const btnPause = document.getElementById('btn-pause');
const btnResume = document.getElementById('btn-resume');
const btnEnd = document.getElementById('btn-end');

const historyList = document.getElementById('history-list');

// Estado local
let currentUser = null;
let currentSession = null;
let timerInterval = null;

// --- Inicialización ---
async function init() {
    // Verificar sesión al cargar
    const { data: { session } } = await sb.auth.getSession();
    handleSession(session);

    // Escuchar cambios de autenticación
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

// --- UI Switching ---
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

// --- Autenticación ---
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
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    try {
        const { error } = await sb.auth.signInWithPassword({ email, password });
        if (error) throw error;
    } catch (error) {
        authMessage.textContent = `Error: ${error.message}`;
        authMessage.style.color = 'var(--danger)';
    }
});

registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-password').value;

    try {
        const { error } = await sb.auth.signUp({ email, password });
        if (error) throw error;
        authMessage.textContent = 'Registro exitoso. Inicia sesión.';
        authMessage.style.color = 'var(--success)';
        registerForm.classList.add('hidden');
        loginForm.classList.remove('hidden');
    } catch (error) {
        authMessage.textContent = `Error: ${error.message}`;
        authMessage.style.color = 'var(--danger)';
    }
});

btnLogout.addEventListener('click', async () => {
    await sb.auth.signOut();
});

// --- Lógica de Control de Tiempo ---

async function loadCurrentState() {
    // Buscar si hay una jornada activa (sin fecha de fin)
    const { data: configData, error } = await supabase
        .from('jornadas')
        .select('*')
        .eq('usuario_id', currentUser.id)
        .is('fin', null)
        .single();
    
    if (configData) {
        currentSession = configData;
        // Check si hay pausa activa
        if (currentSession.estado === 'pausada') {
             // Ya tenemos los datos en currentSession (break_inicio, break_fin)
             // No necesitamos consultar tabla pausas para el estado actual
        }
        updateControls();
        startTimer();
    } else {
        currentSession = null;
        currentBreak = null;
        updateControls();
        stopTimer();
        timerDisplay.textContent = '00:00:00';
    }
}

function updateControls() {
    // Reset buttons
    btnStart.classList.add('hidden');
    btnPause.classList.add('hidden');
    btnResume.classList.add('hidden');
    btnEnd.classList.add('hidden');

    if (!currentSession) {
        btnStart.classList.remove('hidden');
        statusBadge.textContent = 'Inactivo';
        statusBadge.style.color = 'var(--text-secondary)';
    } else {
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
}

// --- Timer ---
function startTimer() {
    if (timerInterval) clearInterval(timerInterval);
    
    timerInterval = setInterval(() => {
        if (!currentSession) return;
        
        let now = new Date();
        let startTime = new Date(currentSession.inicio);
        let diff = now - startTime;

        // Si está pausado, no sumamos tiempo PERO para MVP simple mostramos tiempo corrido o estático
        // Mejora: Calcular tiempo real descontando pausas anteriores.
        // Para este MVP simple: Mostraremos tiempo transcurrido desde inicio vs ahora.
        // Si está en pausa, podríamos detener el contador visual.
        
        if (currentSession.estado === 'pausada' && currentBreak) {
            // Mostrar tiempo hasta el inicio de la pausa
            // diff = new Date(currentBreak.inicio) - startTime; 
            // Esto es complejo si hay múltiples pausas. 
            // Simplemente mostraremos "Pausado" en el timer o el tiempo detenido al momento de pausar.
        }

        const hours = Math.floor(diff / 3600000);
        const minutes = Math.floor((diff % 3600000) / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);

        timerDisplay.textContent = 
            `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    }, 1000);
}

function stopTimer() {
    if (timerInterval) clearInterval(timerInterval);
}

function pad(num) {
    return num.toString().padStart(2, '0');
}

// --- Actions ---

btnStart.addEventListener('click', async () => {
    try {
        const { data, error } = await supabase
            .from('jornadas')
            .insert([{ usuario_id: currentUser.id }])
            .select()
            .single();

        if (error) throw error;
        currentSession = data;
        updateControls();
        startTimer();
    } catch (e) {
        console.error(e);
        alert('Error al iniciar jornada');
    }
});

btnPause.addEventListener('click', async () => {
    try {
        // 1. Actualizar estado jornada
        await supabase
            .from('jornadas')
            .update({ 
                estado: 'pausada',
                break_inicio: new Date().toISOString()
            })
            .eq('id', currentSession.id)
            .select() // Importante para devolver el objeto actualizado
            .single();
        
        if (error) throw error;
        
        currentSession = data; // Actualizamos la sesión local con los nuevos datos
        updateControls();
    } catch (e) {
        console.error(e);
        alert('Error al pausar');
    }
});

btnResume.addEventListener('click', async () => {
    try {
        // Actualizar estado jornada y fin de break
        const { data, error } = await supabase
            .from('jornadas')
            .update({ 
                estado: 'activa',
                break_fin: new Date().toISOString()
            })
            .eq('id', currentSession.id)
            .select()
            .single();
        
        if (error) throw error;

        currentSession = data;
        updateControls();
    } catch (e) {
        console.error(e);
        alert('Error al reanudar');
    }
});

btnEnd.addEventListener('click', async () => {
    try {
        // Si estaba pausado, cerrar la pausa primero (si no se cerró antes)
         if (currentSession.estado === 'pausada' && !currentSession.break_fin) {
             await supabase
            .from('jornadas')
            .update({ break_fin: new Date().toISOString() })
            .eq('id', currentSession.id);
        }

        // Finalizar jornada
        const { error } = await supabase
            .from('jornadas')
            .update({ 
                fin: new Date().toISOString(),
                estado: 'completada'
            })
            .eq('id', currentSession.id);

        if (error) throw error;
        
        currentSession = null;
        currentBreak = null;
        updateControls();
        stopTimer();
        timerDisplay.textContent = '00:00:00';
        loadHistory(); // Recargar tabla
    } catch (e) {
        console.error(e);
        alert('Error al finalizar');
    }
});


// --- Historial ---
async function loadHistory() {
    const { data: jornadas, error } = await supabase
        .from('jornadas')
        .select('*') // Ya trae break_inicio y break_fin
        .eq('usuario_id', currentUser.id)
        .order('inicio', { ascending: false });

    if (error) {
        console.error(error);
        return;
    }

    historyList.innerHTML = '';

    jornadas.forEach(j => {
        const row = document.createElement('tr');
        
        const start = new Date(j.inicio);
        const end = j.fin ? new Date(j.fin) : null;
        
        // Calcular duración pausa (si hubo)
        let pauseDuration = 0;
        if (j.break_inicio && j.break_fin) {
             pauseDuration = new Date(j.break_fin) - new Date(j.break_inicio);
        } else if (j.break_inicio && !j.break_fin) {
             // Pausa en curso (opcional: calcular hasta ahora)
             // Por simplicidad, 0 hasta que termine
        }

        // Calcular total trabajado
        let totalStr = 'En curso...';
        if (end) {
            const durationMs = (end - start) - pauseDuration;
            const h = Math.floor(durationMs / 3600000);
            const m = Math.floor((durationMs % 3600000) / 60000);
            totalStr = `${h}h ${m}m`;
        }

        // Formato fechas
        const dateStr = start.toLocaleDateString();
        const startStr = start.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        const endStr = end ? end.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '-';
        
        const breakStartStr = j.break_inicio ? new Date(j.break_inicio).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '-';
        const breakEndStr = j.break_fin ? new Date(j.break_fin).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '-';

        row.innerHTML = `
            <td>${dateStr}</td>
            <td>${startStr}</td>
            <td>${breakStartStr}</td>
            <td>${breakEndStr}</td>
            <td>${endStr}</td>
            <td>${totalStr}</td>
        `;
        historyList.appendChild(row);
    });
}

// Iniciar aplicación
init();
