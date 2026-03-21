import { initializeApp } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-app.js";
import { getFirestore, limit, onSnapshot, doc, getDoc, collection, orderBy, query } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyD4Ji7FYEOi0IseOh4b8FCGtj5gw1UQu34",
    authDomain: "codeninjaspointtracker.firebaseapp.com",
    projectId: "codeninjaspointtracker",
    storageBucket: "codeninjaspointtracker.firebasestorage.app",
    messagingSenderId: "147397952733",
    appId: "1:147397952733:web:1a25cd7aaf1822c1c0c734"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore();

// Page references
const leaderboardContainer = document.getElementById("leaderboard_container");

// Element tracking

function buildLeaderBoardPosition(ninjaData, place) {
    return `
        <h2>#${place}: ${ninjaData.firstname} ${ninjaData.lastname[0]}.</h2>
        <p>${ninjaData.points} points</p>
    `;
}

async function loadPage() {
    const leaderboardDoc = await getDoc(doc(db, "settings", "leaderboard"));
    const gottenLimit = leaderboardDoc.data().leaderboard_slots;
    onSnapshot(query(collection(db, "ninjas"), orderBy("points", "desc"), limit(gottenLimit)), (snapshot) => {
        leaderboardContainer.innerHTML = "";
        let place = 1;
        snapshot.forEach((doc) => {
            const ninjaData = doc.data();
            const newElement = document.createElement("div");
            newElement.classList.add("leaderboard_member");

            newElement.innerHTML = buildLeaderBoardPosition(ninjaData, place);

            leaderboardContainer.appendChild(newElement);
            place++;
        });
    });
}

// Start app
loadPage();