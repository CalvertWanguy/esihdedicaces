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

let currentUser = null;

document.addEventListener('DOMContentLoaded', () => {
    const messageEl = document.getElementById('message');
    const nameEl = document.getElementById('name');
    const shareBtn = document.getElementById('shareBtn');
    const successMsg = document.getElementById('successMsg');

    // ÉTAPE 1 : Surveillance de l'état d'authentification
    onAuthStateChanged(auth, (user) => {
        currentUser = user;
        // On s'assure que le bouton affiche toujours le bon texte au chargement
        if (!shareBtn.disabled) {
            shareBtn.textContent = 'Partager';
        }
    });

    // ÉTAPE 2 : Logique d'envoi vers Firebase
    const sendToFirebase = async (user, text) => {
        await push(ref(db, 'messages'), {  
            text: text,
            name: nameEl.value.trim() || 'Anonyme',
            timestamp: Date.now(),
            realName: user.displayName || 'Utilisateur Google',
            realEmail: user.email
        });

        // Feedback visuel
        successMsg.style.display = 'block';
        messageEl.value = '';
        nameEl.value = '';
        
        // Cache le message de succès après 5 secondes
        setTimeout(() => { 
            successMsg.style.display = 'none'; 
        }, 5000);
    };

    // ÉTAPE 3 : Gestionnaire de clic principal
    shareBtn.addEventListener('click', async () => {
        const text = messageEl.value.trim();
        
        if (!text) {
            messageEl.focus();
            return;
        }

        // Verrouillage du bouton (État de chargement)
        shareBtn.disabled = true;
        shareBtn.textContent = 'Envoi sécurisé...';

        try {
            if (currentUser) {
                // Déjà connecté -> Envoi direct
                await sendToFirebase(currentUser, text);
            } else {
                // Non connecté -> Login Popup puis envoi
                const result = await signInWithPopup(auth, provider);
                await sendToFirebase(result.user, text);
            }
        } catch (error) {
            console.error("Erreur d'authentification ou d'envoi :", error);
            // On ne réinitialise le bouton ici que si l'erreur n'est pas une annulation de popup
            if (error.code !== 'auth/popup-closed-by-user') {
                alert("Une erreur technique est survenue. Veuillez réessayer.");
            }
        } finally {
            // RÉINITIALISATION SYSTÉMATIQUE
            // Qu'il y ait réussite ou erreur, on redonne la main à l'utilisateur
            shareBtn.disabled = false;
            shareBtn.textContent = 'Partager'; 
        }
    });
});