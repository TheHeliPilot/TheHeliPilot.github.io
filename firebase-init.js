import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import { getDatabase } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js';
import { getAnalytics } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-analytics.js';

const firebaseConfig = {
    apiKey: "AIzaSyAUSXCg5ThLLgN7hz1H2mkwjbdF6cxVyfM",
    authDomain: "schizotests.firebaseapp.com",
    databaseURL: "https://schizotests-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "schizotests",
    storageBucket: "schizotests.firebasestorage.app",
    messagingSenderId: "844598966241",
    appId: "1:844598966241:web:0d078e2436d7497946c4a0",
    measurementId: "G-405JTHVHYX"
};

const app = initializeApp(firebaseConfig);
window.auth = getAuth(app);
window.db = getDatabase(app);
window.analytics = getAnalytics(app);
