import { initializeApp } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-app.js";
import { getFirestore, doc, getDocs, addDoc, updateDoc, onSnapshot, collection, query, where, increment } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js";
import { createSimpleElementHelper, createEmptyButtonHelper, createInputHelper, createLabelHelper, convertInputToKey } from "./util.js";

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
const ninjaNameDisplay = document.getElementById("ninja_name_display");
const ninjaPointsDisplay = document.getElementById("ninja_points_display");
const shopContainer = document.getElementById("shop");
const welcomeText = document.getElementById("welcome_text");

const ADMIN_PW = "admin6699" //TODO:Will be moved to an env file later?

// Login info
let uid = localStorage.getItem("currentUser");
let userKey = null;
console.log("UID: " + uid);
let myProfile = {};

// Element tracking
let currentPopup = null;
let inputIntervalFunction;

async function loadShop() {
    const gottenShop = await getDocs(collection(db, "shop"));
    gottenShop.forEach((doc) => {
        const shopItem = doc.data();
        let item = document.createElement("div");
        item.classList.add("shop_option", "layer_3");

        item.innerHTML = `
            <h3>${shopItem.name} (${shopItem.cost} points)</h3>
            <p>${shopItem.description}</p>
            <button class="purchase_button">PURCHASE</button>
        `;

        item.querySelector(".purchase_button").addEventListener("click", (event) => {
            // buy item
            if (myProfile.points >= shopItem.cost) {
                showPurchasePopup("admin_part", {...shopItem, id: doc.id});
            } else {
                showWarningPopup("You do not have enough money to make this purchase!");
            }
        })

        shopContainer.appendChild(item);
    });
}

// Popup functionality
function showRegisterPopup() {
    if (currentPopup != null) {
        console.log("Error: A popup already exists!");
        return;
    }

    // Create the popup
    currentPopup = document.createElement("div");
    currentPopup.classList.add("popup_container");

    let actualPopup = document.createElement("div");
    actualPopup.id = "register_popup";
    actualPopup.classList.add("popup");

    actualPopup.appendChild(createSimpleElementHelper("h2", "First time? Register here: "));

    // First Name input
    let first_name_input_holder = document.createElement("div");
    first_name_input_holder.appendChild(createLabelHelper("First Name: ", `fname`));
    first_name_input_holder.appendChild(createInputHelper("text", `fname`));
    actualPopup.appendChild(first_name_input_holder);

    // Last Name input
    let last_name_input_holder = document.createElement("div");
    last_name_input_holder.appendChild(createLabelHelper("Last Name: ", `lname`));
    last_name_input_holder.appendChild(createInputHelper("text", `lname`));
    actualPopup.appendChild(last_name_input_holder);

    // Belt input
    let belt_input_holder = document.createElement("div");
    belt_input_holder.appendChild(createLabelHelper("Belt ID: ", `belt`));
    belt_input_holder.appendChild(createInputHelper("text", `belt`));
    actualPopup.appendChild(belt_input_holder);

    let submit_button = createEmptyButtonHelper("Register!");
    actualPopup.appendChild(submit_button);

    submit_button.addEventListener("click", (event) => {
        registerNinja();
    })

    // Add the popup to the blur container
    currentPopup.appendChild(actualPopup);

    document.body.appendChild(currentPopup);
}

function showPurchasePopup(purchasePopupState, shopItem) {
    if (currentPopup != null) {
        console.log("Error: A popup already exists!");
        return;
    }

    // Create the popup
    currentPopup = document.createElement("div");
    currentPopup.classList.add("popup_container");

    let actualPopup = document.createElement("div");
    actualPopup.id = "popup_container";
    actualPopup.classList.add("popup", "small_popup");

    if (purchasePopupState == "admin_part") {
        actualPopup.appendChild(createSimpleElementHelper("h2", "Buy shop item: "));

        // First Name input
        let admin_password = document.createElement("div");
        admin_password.appendChild(createLabelHelper("Admin password: ", `admin_password`));
        admin_password.appendChild(createInputHelper("password", `admin_password`));
        actualPopup.appendChild(admin_password);

        // Buttons
        let button_bar = document.createElement("div");
        button_bar.classList.add("popup_button_bar");

        let next_button = createEmptyButtonHelper("NEXT");
        button_bar.appendChild(next_button);

        let cancel_button = createEmptyButtonHelper("CANCEL");
        button_bar.appendChild(cancel_button);

        next_button.addEventListener("click", (event) => {
            // TODO :D
            if (document.querySelector("#admin_password").value == ADMIN_PW) {
                removePopup();
                showPurchasePopup("purchase_part", shopItem);
            } else {
                removePopup();
                showWarningPopup("Incorrect Password!");
            }
        })

        cancel_button.addEventListener("click", (event) => {
            removePopup();
        })

        actualPopup.appendChild(button_bar);
    } else if (purchasePopupState == "purchase_part") {
        actualPopup.appendChild(createSimpleElementHelper("h2", "Tap your belt wristband to confirm the purchase!"));

        // NFC invisible input
        let tap_band_input = document.createElement("div");
        const tap_band_input_field = createInputHelper("text", `tap_band_input`);
        tap_band_input.appendChild(tap_band_input_field);
        actualPopup.appendChild(tap_band_input);

        // Set to constantly track
        inputIntervalFunction = setInterval(() => {
            tap_band_input_field.focus();
        }, 500);
        
        tap_band_input_field.addEventListener("keydown", async (e) => {
            if (e.key != "Enter") {
                return;
            }

            if (convertInputToKey(e.target.value) == myProfile.nfc_id) {
                // Done typing and got the right one
                clearInterval(inputIntervalFunction);
                removePopup();
                await purchaseItem(shopItem);
                showWarningPopup("Purchase Succesful!");
            } else {
                clearInterval(inputIntervalFunction);
                removePopup();
                showWarningPopup("Incorrect Wristband!");
            }
        })

        // Buttons
        let button_bar = document.createElement("div");
        button_bar.classList.add("popup_button_bar");

        let cancel_button = createEmptyButtonHelper("CANCEL");
        button_bar.appendChild(cancel_button);

        cancel_button.addEventListener("click", (event) => {
            clearInterval(inputIntervalFunction);
            removePopup();
        })

        actualPopup.appendChild(button_bar);
    }

    // Add the popup to the blur container
    currentPopup.appendChild(actualPopup);

    document.body.appendChild(currentPopup);
}

function showBeltTransferPopup(purchasePopupState) {
    if (currentPopup != null) {
        console.log("Error: A popup already exists!");
        return;
    }

    // Create the popup
    currentPopup = document.createElement("div");
    currentPopup.classList.add("popup_container");

    let actualPopup = document.createElement("div");
    actualPopup.id = "popup_container";
    actualPopup.classList.add("popup", "small_popup");

    if (purchasePopupState == "admin_part") {
        actualPopup.appendChild(createSimpleElementHelper("h2", "Transfer to a new belt: "));

        // admin password input
        let admin_password = document.createElement("div");
        admin_password.appendChild(createLabelHelper("Admin password: ", `admin_password`));
        admin_password.appendChild(createInputHelper("password", `admin_password`));
        actualPopup.appendChild(admin_password);

        // Buttons
        let button_bar = document.createElement("div");
        button_bar.classList.add("popup_button_bar");

        let next_button = createEmptyButtonHelper("NEXT");
        button_bar.appendChild(next_button);

        let cancel_button = createEmptyButtonHelper("CANCEL");
        button_bar.appendChild(cancel_button);

        next_button.addEventListener("click", (event) => {
            // TODO :D
            if (document.querySelector("#admin_password").value == ADMIN_PW) {
                removePopup();
                showBeltTransferPopup("scan_part");
            } else {
                removePopup();
                showWarningPopup("Incorrect Password!");
            }
        })

        cancel_button.addEventListener("click", (event) => {
            removePopup();
        })

        actualPopup.appendChild(button_bar);
    } else if (purchasePopupState == "scan_part") {
        actualPopup.appendChild(createSimpleElementHelper("h2", "Tap your new wristband to transfer your data to the new belt."));

        // NFC invisible input
        let tap_band_input = document.createElement("div");
        const tap_band_input_field = createInputHelper("text", `tap_band_input`);
        tap_band_input.appendChild(tap_band_input_field);
        actualPopup.appendChild(tap_band_input);

        // Set to constantly track
        inputIntervalFunction = setInterval(() => {
            tap_band_input_field.focus();
        }, 500);
        
        tap_band_input_field.addEventListener("keydown", async (e) => {
            if (e.key != "Enter") {
                return;
            }

            // Done typing
            clearInterval(inputIntervalFunction);

            // Replace nfc_id
            await updateDoc(doc(db, "ninjas", userKey), {
                nfc_id: convertInputToKey(e.target.value)
            });

            // Cleanup
            removePopup();
            showRedirectPopup("Belt Transferred! You will now have to log in again.", "index.html");
        })

        // Buttons
        let button_bar = document.createElement("div");
        button_bar.classList.add("popup_button_bar");

        let cancel_button = createEmptyButtonHelper("CANCEL");
        button_bar.appendChild(cancel_button);

        cancel_button.addEventListener("click", (event) => {
            clearInterval(inputIntervalFunction);
            removePopup();
        })

        actualPopup.appendChild(button_bar);
    }

    // Add the popup to the blur container
    currentPopup.appendChild(actualPopup);

    document.body.appendChild(currentPopup);
}

function showWarningPopup(warningText) {
    if (currentPopup != null) {
        console.log("Error: A popup already exists!");
        return;
    }

    // Create the popup
    currentPopup = document.createElement("div");
    currentPopup.classList.add("popup_container");

    let actualPopup = document.createElement("div");
    actualPopup.id = "popup_container";
    actualPopup.classList.add("popup", "small_popup");

    actualPopup.appendChild(createSimpleElementHelper("h2", warningText));

    let button_bar = document.createElement("div");
    button_bar.classList.add("popup_button_bar");
    let cancel_button = createEmptyButtonHelper("OK");
    button_bar.appendChild(cancel_button);

    cancel_button.addEventListener("click", (event) => {
        removePopup();
    })

    actualPopup.appendChild(button_bar);

    // Add the popup to the blur container
    currentPopup.appendChild(actualPopup);

    document.body.appendChild(currentPopup);
}

function showRedirectPopup(text, link) {
    if (currentPopup != null) {
        console.log("Error: A popup already exists!");
        return;
    }

    // Create the popup
    currentPopup = document.createElement("div");
    currentPopup.classList.add("popup_container");

    let actualPopup = document.createElement("div");
    actualPopup.id = "popup_container";
    actualPopup.classList.add("popup", "small_popup");

    actualPopup.appendChild(createSimpleElementHelper("h2", text));

    let button_bar = document.createElement("div");
    button_bar.classList.add("popup_button_bar");
    let cancel_button = createEmptyButtonHelper("OK");
    button_bar.appendChild(cancel_button);

    cancel_button.addEventListener("click", (event) => {
        window.location.href = link;
    })

    actualPopup.appendChild(button_bar);

    // Add the popup to the blur container
    currentPopup.appendChild(actualPopup);

    document.body.appendChild(currentPopup);
}

function removePopup() {
    currentPopup.remove();
    currentPopup = null;
}


async function loadPage() {
    loadShop();
    onSnapshot(doc(db, "ninjas", userKey), (snapshot) => {
        if (snapshot.exists) {
            const data = snapshot.data();
            myProfile = data;
            ninjaNameDisplay.textContent = `Name: ${data.firstname} ${data.lastname[0]}.`;
            welcomeText.textContent = `Welcome, ${data.firstname}!`;
            ninjaPointsDisplay.textContent = `Points: ${data.points}`;
        } else {
            console.log("Ninja not registered!");
        }
    });

    document.querySelector("#transfer_belt_button").addEventListener("click", event => {
        showBeltTransferPopup("admin_part");
    })
}


async function editPoints(amount) {
    await updateDoc(doc(db, "ninjas", userKey), {
        points: myProfile.points + amount
    });
}

async function purchaseItem(shopItem) {
    await editPoints(-shopItem.cost);

    // Add to ninja's purchase log
    await addDoc(collection(db, "ninjas", userKey, "purchases"), {
        date: Date.now(), 
        item: shopItem.id, 
        fulfilled: false
    });
}

async function registerNinja() {
    const fname = document.querySelector("#fname").value;
    const lname = document.querySelector("#lname").value;
    const belt = Number(document.querySelector("#belt").value);
    const docRef = await addDoc(collection(db, "ninjas"), {
        firstname: fname,
        lastname: lname, 
        points: 0, 
        belt: belt, 
        nfc_id: uid, 
        points_in_history: 0
    });
    userKey = docRef.id;

    removePopup();
    loadPage();
}

// Start app
const snapshot = await getDocs(query(collection(db, "ninjas"), where("nfc_id", "==", uid)));
if (snapshot.empty) {
    showRegisterPopup();
} else {
    console.log(snapshot)
    userKey = snapshot.docs[0].id;
    loadPage();
}