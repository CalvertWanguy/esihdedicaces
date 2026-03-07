import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js';
import { getDatabase, ref, push } from 'https://www.gstatic.com/firebasejs/10.13.1/firebase-database.js';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js';

// Ta configuration Firebase (Vérifiée)
const firebaseConfig = {
    apiKey: "AIzaSyAJbmjvW5cHR_lMu4RKHPnl9IRYKI3oPtI",
    authDomain: "dedicaces-anonymes-esih.firebaseapp.com",
    projectId: "dedicaces-anonymes-esih",
    storageBucket: "dedicaces-anonymes-esih.firebasestorage.app",
    messagingSenderId: "715611579183",
    appId: "1:715611579183:web:126cc0b8d50f95dbe0b7da",
    measurementId: "G-5Z0H4K9PR1"
};

// Initialisation des services
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// Force la sélection du compte Google pour éviter les erreurs de session
provider.setCustomParameters({ prompt: 'select_account' });

let currentUser = null;

document.addEventListener('DOMContentLoaded', () => {
    // Sélection des éléments HTML (IDs basés sur ton code HTML fourni)
    const messageEl = document.getElementById('message');
    const nameEl = document.getElementById('name');
    const shareBtn = document.getElementById('shareBtn');
    const loader = document.getElementById('loader'); // Le cercle de chargement
    const btnText = document.getElementById('btnText'); // Le texte du bouton
    const successMsg = document.getElementById('successMsg');

    // ÉTAPE 1 : Surveiller l'état de connexion de l'étudiant
    onAuthStateChanged(auth, (user) => {
        currentUser = user;
    });

    // ÉTAPE 2 : Fonction d'envoi vers la Realtime Database
    const sendToFirebase = async (user, text) => {
        try {
            await push(ref(db, 'messages'), {  
                text: text,
                name: nameEl.value.trim() || 'Anonyme', // Pseudo choisi par l'étudiant
                timestamp: Date.now(),
                realName: user.displayName || 'Étudiant ESIH', // Nom réel (caché en public)
                realEmail: user.email // Email réel (caché en public)
            });

            // Affichage du message de succès
            if (successMsg) {
                successMsg.style.display = 'block';
                setTimeout(() => { 
                    successMsg.style.display = 'none'; 
                }, 5000);
            }
            
            // Réinitialisation des champs
            messageEl.value = '';
            nameEl.value = '';

        } catch (error) {
            console.error("Erreur d'écriture Firebase :", error);
            throw error; 
        }
    };

    // ÉTAPE 3 : Gestion du clic sur le bouton "Partager"
    shareBtn.addEventListener('click', async () => {
        const text = messageEl.value.trim();
        
        if (!text) {
            messageEl.focus();
            return;
        }

        // --- ÉTAT DE CHARGEMENT ---
        shareBtn.disabled = true;
        if (loader) loader.style.display = 'inline-block';
        if (btnText) btnText.textContent = 'Envoi sécurisé...';

        try {
            let user = currentUser;

            // Si l'utilisateur n'est pas connecté, on ouvre la popup Google
            if (!user) {
                const result = await signInWithPopup(auth, provider);
                user = result.user;
            }

            // Envoi effectif des données
            await sendToFirebase(user, text);

        } catch (error) {
            console.error("Détails de l'erreur :", error.code, error.message);
            
            if (error.code === 'auth/unauthorized-domain') {
                alert("Erreur : Le domaine Vercel n'est pas autorisé dans Firebase.");
            } else if (error.code === 'auth/popup-closed-by-user') {
                console.log("Connexion annulée par l'étudiant.");
            } else {
                alert("Une erreur est survenue lors de l'envoi. Vérifiez votre connexion.");
            }
        } finally {
            // --- RÉINITIALISATION DU BOUTON ---
            shareBtn.disabled = false;
            if (loader) loader.style.display = 'none';
            if (btnText) btnText.textContent = 'Partager'; 
        }
    });
});