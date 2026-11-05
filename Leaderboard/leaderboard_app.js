import { initializeApp } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-app.js";
import { getFirestore, limit, onSnapshot, doc, getDoc, getDocs, collection, where, query, orderBy } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js";
import { lang, belts } from "../data.js";

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

let subscribeFunctions = {};
let leaderboardScroller = {};

function autoScrollLoop(containerID) {
    if (!leaderboardScroller[containerID]) {
        leaderboardScroller[containerID] = {speed: 1, direction: 1, paused: false}
    }

    if (!leaderboardScroller[containerID].paused) {
        const container = document.querySelector(containerID);
        container.scrollTop += leaderboardScroller[containerID].speed * leaderboardScroller[containerID].direction;

        const isAtBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - 1;
        const isAtTop = container.scrollTop <= 0;

        if (isAtBottom && leaderboardScroller[containerID].direction === 1) {
            setTimeout(() => leaderboardScroller[containerID].direction = -2, 2000); 
        } else if (isAtTop && leaderboardScroller[containerID].direction === -2) {
            setTimeout(() => leaderboardScroller[containerID].direction = 1, 2000); 
        }
    }

    requestAnimationFrame(() => autoScrollLoop(containerID));
}

async function loadPage() {
    const leaderboards = await getDocs(collection(db, "leaderboards"));
    leaderboards.forEach(leaderboard => {
        const data = leaderboard.data();
        const leaderboardContainer = document.querySelector(`#${data.ui_position}_leaderboard_container`);
        leaderboardContainer.addEventListener("mouseover", () => leaderboardScroller[`#${data.ui_position}_leaderboard_container`].paused = true);
        leaderboardContainer.addEventListener("mouseout", () => leaderboardScroller[`#${data.ui_position}_leaderboard_container`].paused = false);
        autoScrollLoop(`#${data.ui_position}_leaderboard_container`);

        onSnapshot(query(collection(db, "ninjas"), where("belt", "in", data.belt_filters), orderBy("points", "desc"), limit(data.slots)), (snapshot) => {
        
            // Reset Leaderboard
            leaderboardContainer.innerHTML = `<h2>${data.name}</h2>`;
            let place = 1;
            snapshot.forEach(async (ninja) => {
                // Get user profile
                const ninjaProfile = ninja.data();

                // Create element
                const newElement = document.createElement("div");
                newElement.classList.add("leaderboard_member");

                newElement.innerHTML = `
                    <h3>#${place}: ${ninjaProfile.firstname} ${ninjaProfile.lastname}</h3>
                    <div class="leaderboard_member_flex">
                        <p>${ninjaProfile.points} Points</p>
                        <p class="belt_color_${ninjaProfile.belt} belt_color">${belts[ninjaProfile.belt]} Belt</p>
                    </div>
                `;

                leaderboardContainer.appendChild(newElement);
                place++;
            });
        })

    })
}

// Start app
loadPage();

