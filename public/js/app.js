const HABITS_API_URL = 'http://localhost:5000/api/habits';

document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    const user = JSON.parse(localStorage.getItem('user'));
    document.getElementById('welcomeMsg').textContent = `Welcome, ${user.name}!`;

    fetchHabits();

    // Initialize Add Habit Modal logic
    document.getElementById('saveHabitBtn').addEventListener('click', createHabit);
});

// Fetch and Render Habits
async function fetchHabits() {
    const token = localStorage.getItem('token');
    try {
        const res = await fetch(HABITS_API_URL, {
            headers: { 'x-auth-token': token }
        });
        const habits = await res.json();
        renderHabits(habits);
    } catch (err) {
        console.error('Error fetching habits:', err);
        const container = document.getElementById('habitsContainer');
        if (container) {
            container.innerHTML = '<p class="text-danger text-center">Failed to load habits. Is the server running?</p>';
        }
    }
}

// Render Habits List
function renderHabits(habits) {
    const container = document.getElementById('habitsContainer');
    container.innerHTML = '';

    habits.forEach(habit => {
        const card = document.createElement('div');
        card.className = 'col-md-4 mb-4';

        // Calculate Streak logic could go here or be fetched from backend. 
        // For simple UI, we assume we fetch logs separately or calculate basic info.
        // For MVP, simple display.

        card.innerHTML = `
            <div class="card habit-card h-100 border-0 shadow-sm">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start mb-3">
                        <h5 class="card-title text-primary fw-bold text-truncate">${habit.title}</h5>
                        <button class="btn btn-sm btn-outline-danger border-0" onclick="deleteHabit('${habit._id}')">&times;</button>
                    </div>
                    <div class="d-flex justify-content-between align-items-center mb-2">
                         <p class="text-muted small mb-0"><i class="bi bi-calendar-event"></i> ${habit.frequency}</p>
                         <span class="badge bg-warning text-dark border" title="Current Streak"><i class="bi bi-fire"></i> ${habit.streak || 0}</span>
                    </div>
                    <p class="text-muted small mb-2">Target: ${habit.targetDays} days</p>
                    
                    <div class="d-flex justify-content-between align-items-center mt-4">
                        <div class="d-flex flex-column">
                             <span class="text-secondary small">Status</span>
                             <span id="status-${habit._id}" class="badge bg-light text-dark border">Pending</span>
                        </div>
                        <button id="btn-${habit._id}" class="check-btn" onclick="toggleComplete('${habit._id}')">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" class="bi bi-check" viewBox="0 0 16 16">
                                <path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.267.267 0 0 1 .02-.022z"/>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        `;
        container.appendChild(card);

        // Check today's status to update UI initially
        checkTodayStatus(habit._id);
    });
}

// Create Habit
async function createHabit(e) {
    if (e) e.preventDefault();

    const title = document.getElementById('habitTitle').value;
    const frequency = document.getElementById('habitFrequency').value;
    const targetDays = document.getElementById('habitTarget').value;
    const token = localStorage.getItem('token');

    if (!title) return alert('Title is required');

    try {
        const res = await fetch(HABITS_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-auth-token': token
            },
            body: JSON.stringify({ title, frequency, targetDays })
        });

        if (res.ok) {
            // 1. Refresh Habits List Immediately
            await fetchHabits();

            // 2. Clear form
            document.getElementById('habitTitle').value = '';
            document.getElementById('habitTarget').value = '21'; // Reset to default

            // 3. Close modal safely
            const modalEl = document.getElementById('addHabitModal');
            if (typeof bootstrap !== 'undefined') {
                const modal = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
                modal.hide();
            } else {
                console.warn('Bootstrap is not loaded, cannot close modal automatically.');
                alert('Habit added, but could not close window automatically.');
            }
        } else {
            const errorData = await res.json();
            alert(errorData.msg || 'Error creating habit');
        }
    } catch (err) {
        console.error(err);
        alert('Failed to connect to the server. Please check if the backend is running.');
    }
}

// Delete Habit
async function deleteHabit(id) {
    if (!confirm('Are you sure you want to delete this habit?')) return;

    const token = localStorage.getItem('token');
    try {
        const res = await fetch(`${HABITS_API_URL}/${id}`, {
            method: 'DELETE',
            headers: { 'x-auth-token': token }
        });

        if (res.ok) {
            fetchHabits();
        } else {
            alert('Failed to delete habit. Server returned error.');
        }
    } catch (err) {
        console.error(err);
        alert('Error: Could not delete habit. Check connectivity.');
    }
}

// Toggle Complete
async function toggleComplete(id) {
    const token = localStorage.getItem('token');
    try {
        const res = await fetch(`${HABITS_API_URL}/${id}/complete`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-auth-token': token
            }
        });

        const data = await res.json();

        // Update UI based on response (completed: T/F)
        updateCardStatus(id, data.completed);

        // Refresh Chart
        if (window.updateChart) window.updateChart();

    } catch (err) { console.error(err); }
}

// Check Today's Status (Helper to init UI)
async function checkTodayStatus(id) {
    const token = localStorage.getItem('token');
    // We can use the logs endpoint.
    // Optimization: The 'active' status could be sent with the habit list, but for now we fetch logs.
    // Or we rely on user interaction.
    // Let's check logs for today.
    try {
        const res = await fetch(`${HABITS_API_URL}/${id}/logs`, {
            headers: { 'x-auth-token': token }
        });
        const logs = await res.json();

        // Check if there is a log for today (local date string)
        const today = new Date().setHours(0, 0, 0, 0);
        const todayLog = logs.find(l => new Date(l.date).setHours(0, 0, 0, 0) === today);

        if (todayLog && todayLog.completed) {
            updateCardStatus(id, true);
        }
    } catch (err) { console.error(err); }
}

function updateCardStatus(id, isCompleted) {
    const btn = document.getElementById(`btn-${id}`);
    const statusBadget = document.getElementById(`status-${id}`);

    if (isCompleted) {
        btn.classList.add('completed');
        statusBadget.className = 'badge bg-success';
        statusBadget.textContent = 'Completed';
    } else {
        btn.classList.remove('completed');
        statusBadget.className = 'badge bg-light text-dark border';
        statusBadget.textContent = 'Pending';
    }
}
