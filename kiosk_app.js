import { initializeApp } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-app.js";
import { getFirestore, getDocs, collection, query, where } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js";
import { convertInputToKey } from "./util.js";

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
const db = getFirestore(app);

const nfcInput = document.querySelector("#nfc_input");

nfcInput.value = "";
setInterval(() => {nfcInput.focus()}, 500)


// Page references
const ninjaNameDisplay = document.getElementById("name_text");
const ninjaPointsDisplay = document.getElementById("points_text");

nfcInput.addEventListener("keydown", async (e) => {
	if (e.key == "Enter") {
		const ninja = await getDocs(query(collection(db, "ninjas"), where("nfc_id", "==", convertInputToKey(e.target.value))));
		if (ninja.empty) {
			ninjaNameDisplay.text = "N/A";
			ninjaPointsDisplay.text = "N/A";
		} else {
			const ninjaInfo = ninja.docs[0].data();
			ninjaNameDisplay.innerText = "Name: " + ninjaInfo.firstname;
			ninjaPointsDisplay.innerText = "Points: " + ninjaInfo.points;
		}
		nfcInput.value = "";
	}
})