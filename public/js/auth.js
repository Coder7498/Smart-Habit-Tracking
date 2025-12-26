const API_URL = 'http://localhost:5000/api/auth';

// Register User
async function registerUser(name, email, password) {
    try {
        const res = await fetch(`${API_URL}/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, email, password })
        });

        const data = await res.json();
        if (res.ok) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            return { success: true };
        } else {
            return { success: false, msg: data.msg };
        }
    } catch (err) {
        console.error(err);
        return { success: false, msg: 'Server connection failed. Please try again later.' };
    }
}

// Login User
async function loginUser(email, password) {
    try {
        const res = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await res.json();
        if (res.ok) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            return { success: true };
        } else {
            return { success: false, msg: data.msg };
        }
    } catch (err) {
        console.error(err);
        return { success: false, msg: 'Server connection failed. Please try again later.' };
    }
}

// Logout
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'index.html';
}

// Check Auth
function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'index.html';
    }
}
