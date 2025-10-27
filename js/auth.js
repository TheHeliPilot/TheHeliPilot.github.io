// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAUSXCg5ThLLgN7hz1H2mkwjbdF6cxVyfM",
    authDomain: "schizotests.firebaseapp.com",
    projectId: "schizotests",
    storageBucket: "schizotests.firebasestorage.app",
    messagingSenderId: "844598966241",
    appId: "1:844598966241:web:0d078e2436d7497946c4a0",
    measurementId: "G-405JTHVHYX"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

// Auth event listeners
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const registerBtn = document.getElementById('registerBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const passkeyLoginBtn = document.getElementById('passkeyLoginBtn');

    // Login form handler
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('emailInput').value;
        const password = document.getElementById('passwordInput').value;

        try {
            await auth.signInWithEmailAndPassword(email, password);
            // Clear form
            loginForm.reset();
        } catch (error) {
            alert('Login failed: ' + error.message);
        }
    });

    // Register button handler
    registerBtn.addEventListener('click', async () => {
        const email = document.getElementById('emailInput').value;
        const password = document.getElementById('passwordInput').value;

        if (!email || !password) {
            alert('Please enter email and password');
            return;
        }

        try {
            await auth.createUserWithEmailAndPassword(email, password);
            // Clear form
            loginForm.reset();
        } catch (error) {
            alert('Registration failed: ' + error.message);
        }
    });

    // Logout button handler
    logoutBtn.addEventListener('click', () => {
        auth.signOut();
    });

    // Passkey login handler
    passkeyLoginBtn.addEventListener('click', () => {
        alert('Passkey login will be available in a future update');
    });
});

// Make auth available globally
window.auth = auth;
