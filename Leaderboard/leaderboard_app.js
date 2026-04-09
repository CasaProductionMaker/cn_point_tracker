import { initializeApp } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-app.js";
import { getFirestore, limit, onSnapshot, doc, getDoc, collection, where, query, orderBy } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js";
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

async function loadPage() {
    onSnapshot(collection(db, "leaderboards"), (snapshot) => {
        snapshot.docChanges().forEach(changedLeaderboard => {
            const value = changedLeaderboard.doc.data();

            switch (changedLeaderboard.type) {
                case "added":
                    if (value.belt_filters.length > 0) {
                        subscribeFunctions[changedLeaderboard.doc.id] = onSnapshot(query(collection(db, "leaderboard_entries"), where("reason", "==", value.reason_filter), where("ninja_belt_level", "in", value.belt_filters), orderBy("points", "desc"), limit(value.slots)), (snapshot) => {
                            const leaderboardContainer = document.querySelector(`#${value.ui_position}_leaderboard_container`);
                            
                            // Reset Leaderboard
                            leaderboardContainer.innerHTML = `<h2>${value.name}</h2>`;
                            let place = 1;
                            snapshot.forEach(async (ninja) => {
                                const docData = ninja.data();

                                // Get user profile
                                const ninjaProfile = await getDoc(doc(db, "ninjas", docData.ninja_id));

                                // Create element
                                const newElement = document.createElement("div");
                                newElement.classList.add("leaderboard_member");

                                newElement.innerHTML = `
                                    <h3>#${place}: ${ninjaProfile.data().firstname} ${ninjaProfile.data().lastname}</h3>
                                    <div class="leaderboard_member_flex">
                                        <p>${docData.points} ${lang[value.reason_filter]} Points</p>
                                        <p class="belt_color_${ninjaProfile.data().belt} belt_color">${belts[ninjaProfile.data().belt]} Belt</p>
                                    </div>
                                `;

                                leaderboardContainer.appendChild(newElement);
                                place++;
                            });
                        });
                    }

                    break;
                case "modified":
                    if (subscribeFunctions[changedLeaderboard.doc.id] != null) {
                        subscribeFunctions[changedLeaderboard.doc.id]();
                        delete subscribeFunctions[changedLeaderboard.doc.id];
                    }

                    if (value.belt_filters.length > 0) {
                        subscribeFunctions[changedLeaderboard.doc.id] = onSnapshot(query(collection(db, "leaderboard_entries"), where("reason", "==", value.reason_filter), where("ninja_belt_level", "in", value.belt_filters), orderBy("points", "desc"), limit(value.slots)), (snapshot) => {
                            const leaderboardContainer = document.querySelector(`#${value.ui_position}_leaderboard_container`);
                            
                            // Reset Leaderboard
                            leaderboardContainer.innerHTML = `<h2>${value.name}</h2>`;
                            let place = 1;
                            snapshot.forEach(async (ninja) => {
                                const docData = ninja.data();

                                // Get user profile
                                const ninjaProfile = await getDoc(doc(db, "ninjas", docData.ninja_id));

                                // Create element
                                const newElement = document.createElement("div");
                                newElement.classList.add("leaderboard_member");

                                newElement.innerHTML = `
                                    <h3>#${place}: ${ninjaProfile.data().firstname} ${ninjaProfile.data().lastname}</h3>
                                    <p>${docData.points} ${lang[value.reason_filter]} Points</p>
                                `;

                                leaderboardContainer.appendChild(newElement);
                                place++;
                            });
                        });
                    }

                    break;
                case "removed":
                    if (subscribeFunctions[changedLeaderboard.doc.id] != null) {
                        subscribeFunctions[changedLeaderboard.doc.id]();
                        delete subscribeFunctions[changedLeaderboard.doc.id];
                    }

                    const leaderboardContainer = document.querySelector(`#${value.ui_position}_leaderboard_container`);
                    leaderboardContainer.innerHTML = ``;
                    break;
            }
        });
    });
}

// Start app
loadPage();