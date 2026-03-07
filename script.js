import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js';
import { getDatabase, ref, push } from 'https://www.gstatic.com/firebasejs/10.13.1/firebase-database.js';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js';

const firebaseConfig = {
    apiKey: "AIzaSyAJbmjvW5cHR_lMu4RKHPnl9IRYKI3oPtI",
    authDomain: "dedicaces-anonymes-esih.firebaseapp.com",
    projectId: "dedicaces-anonymes-esih",
    storageBucket: "dedicaces-anonymes-esih.firebasestorage.app",
    messagingSenderId: "715611579183",
    appId: "1:715611579183:web:126cc0b8d50f95dbe0b7da",
    measurementId: "G-5Z0H4K9PR1"
};

// Initialisation
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// Configuration optionnelle pour forcer la sélection de compte
provider.setCustomParameters({ prompt: 'select_account' });

let currentUser = null;

document.addEventListener('DOMContentLoaded', () => {
    const messageEl = document.getElementById('message');
    const nameEl = document.getElementById('name');
    const shareBtn = document.getElementById('shareBtn');
    const successMsg = document.getElementById('successMsg');

    // ÉTAPE 1 : Surveillance de l'état d'authentification
    onAuthStateChanged(auth, (user) => {
        currentUser = user;
        if (shareBtn) {
            shareBtn.disabled = false;
            shareBtn.textContent = 'Partager';
        }
    });

    // ÉTAPE 2 : Logique d'envoi vers Firebase
    const sendToFirebase = async (user, text) => {
        try {
            await push(ref(db, 'messages'), {  
                text: text,
                name: nameEl.value.trim() || 'Anonyme',
                timestamp: Date.now(),
                realName: user.displayName || 'Utilisateur Google',
                realEmail: user.email
            });

            // Feedback visuel
            if (successMsg) {
                successMsg.style.display = 'block';
                setTimeout(() => { 
                    successMsg.style.display = 'none'; 
                }, 5000);
            }
            
            messageEl.value = '';
            nameEl.value = '';
        } catch (error) {
            console.error("Erreur d'écriture dans la base :", error);
            throw error; // Renvoyé vers le bloc catch du bouton
        }
    };

    // ÉTAPE 3 : Gestionnaire de clic principal
    shareBtn.addEventListener('click', async () => {
        const text = messageEl.value.trim();
        
        if (!text) {
            messageEl.focus();
            return;
        }

        shareBtn.disabled = true;
        shareBtn.textContent = 'Envoi sécurisé...';

        try {
            if (currentUser) {
                await sendToFirebase(currentUser, text);
            } else {
                // Tentative de connexion via Popup
                const result = await signInWithPopup(auth, provider);
                await sendToFirebase(result.user, text);
            }
        } catch (error) {
            console.error("Détails de l'erreur :", error.code, error.message);
            
            if (error.code === 'auth/unauthorized-domain') {
                alert("Erreur : Ce domaine (Vercel) n'est pas autorisé dans la console Firebase.");
            } else if (error.code === 'auth/popup-closed-by-user') {
                console.log("Connexion annulée par l'utilisateur.");
            } else {
                alert("Une erreur technique est survenue. Vérifie ta console (F12) pour plus de détails.");
            }
        } finally {
            shareBtn.disabled = false;
            shareBtn.textContent = 'Partager'; 
        }
    });
});