import { initializeApp } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-app.js";
import { getFirestore, doc, setDoc, updateDoc, deleteDoc, onSnapshot, collection, increment } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js";

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
const ninjaContainer = document.querySelector("#ninja_container");
const applyLeaderboardSlots = document.querySelector("#apply_leaderboard_slots");
const leaderboardSlotsInput = document.querySelector("#leaderboard_slots_input");
const shopEditorContainer = document.querySelector("#shop_editor_container");
const addShopItemButton = document.querySelector("#add_shop_item_button");

// Element tracking
let ninjaElements = {};
let shopElements = {};
let currentPopup = null;


function showPopup(type, editInfo = null, editID = null) {
    if (currentPopup != null) {
        console.log("Error: A popup already exists!");
        return;
    }

    if (type == "add") {
        currentPopup = document.createElement("div");
        currentPopup.id = "shop_item_popup";
        
        currentPopup.innerHTML = `
            <h2>New Shop Item:</h2>
            <div>
                <label for="shop_item_name_input">Name: </label>
                <input type="text" name="shop_item_name_input" id="shop_item_name_input">
            </div>
            <div>
                <label for="shop_item_cost_input">Cost: </label>
                <input type="number" name="shop_item_cost_input" id="shop_item_cost_input">
            </div>
            <div>
                <label for="shop_item_description_input">Description: </label>
                <input type="text" name="shop_item_description_input" id="shop_item_description_input">
            </div>
            <button class="submit_shop_item_button">Add</button>
            <button class="cancel_shop_item_button">Cancel</button>
        `;

        currentPopup.querySelector(".submit_shop_item_button").addEventListener("click", async (e) => {
            await addShopItem();
        })
        currentPopup.querySelector(".cancel_shop_item_button").addEventListener("click", async (e) => {
            removePopup();
        })

        document.body.appendChild(currentPopup);
    } else if (type == "edit") {
        currentPopup = document.createElement("div");
        currentPopup.id = "shop_item_popup";
        
        currentPopup.innerHTML = `
            <h2>Edit Shop Item:</h2>
            <div>
                <label for="shop_item_name_input">Name: </label>
                <input type="text" name="shop_item_name_input" id="shop_item_name_input" value="${editInfo.name}">
            </div>
            <div>
                <label for="shop_item_cost_input">Cost: </label>
                <input type="number" name="shop_item_cost_input" id="shop_item_cost_input" value="${editInfo.cost}">
            </div>
            <div>
                <label for="shop_item_description_input">Description: </label>
                <input type="text" name="shop_item_description_input" id="shop_item_description_input" value="${editInfo.description}">
            </div>
            <button class="submit_shop_item_button">Apply Changes</button>
            <button class="cancel_shop_item_button">Cancel</button>
        `;

        currentPopup.querySelector(".submit_shop_item_button").addEventListener("click", async (e) => {
            await editShopItem(editID);
        })
        currentPopup.querySelector(".cancel_shop_item_button").addEventListener("click", async (e) => {
            removePopup();
        })

        document.body.appendChild(currentPopup);
    } else {
        console.log("Error: Invalid popup type!")
    }
}

function removePopup() {
    document.body.removeChild(currentPopup);
    currentPopup = null;
}

async function addShopItem() {
    const itemName = document.getElementById("shop_item_name_input").value;
    const itemCost = Number(document.getElementById("shop_item_cost_input").value);
    const itemDescription = document.getElementById("shop_item_description_input").value;
    let nameID = itemName.replaceAll(" ", "_").toLowerCase();

    await setDoc(doc(db, "shop", nameID), {
        name: itemName, 
        cost: itemCost, 
        description: itemDescription
    });

    removePopup();
}

async function editShopItem(shopItemID) {
    const itemName = document.getElementById("shop_item_name_input").value;
    const itemCost = Number(document.getElementById("shop_item_cost_input").value);
    const itemDescription = document.getElementById("shop_item_description_input").value;

    await updateDoc(doc(db, "shop", shopItemID), {
        name: itemName, 
        cost: itemCost, 
        description: itemDescription
    });

    removePopup();
}

async function loadPage() {
    onSnapshot(collection(db, "ninjas"), (snapshot) => {
        snapshot.docChanges().forEach((ninja) => {
            const value = ninja.doc.data();

            switch (ninja.type) {
                case "added":
                    let ninjaElement = document.createElement("div");
                    ninjaElement.classList.add("registered_ninja");

                    ninjaElement.innerHTML = `
                        <h3 class="ninja_name">${value.firstname} ${value.lastname}</h3>
                        <p class="ninja_points">Points: ${value.points}</p>
                        <p class="ninja_uid">UID: ${ninja.doc.id}</p>

                        <button data-id="${ninja.doc.id}" data-amount="10">Advanced Level</button>
                        <button data-id="${ninja.doc.id}" data-amount="100">Belt Up</button>

                        <input type="number" placeholder="Custom..." class="custom_points">
                        <button data-id="${ninja.doc.id}" data-custom="true">Apply Custom</button>
                        
                        <button data-id="${ninja.doc.id}" data-delete="true">Remove Ninja</button>
                    `;

                    ninjaElement.addEventListener("click", async (event) => {
                        const buttonElement = event.target;

                        if (buttonElement.tagName !== "BUTTON") return;

                        const ninjaID = buttonElement.dataset.id;

                        if (buttonElement.dataset.amount) {
                            const amount = Number(buttonElement.dataset.amount);
                            await editPoints(ninjaID, amount);
                        }

                        if (buttonElement.dataset.custom) {
                            const input = ninjaElement.querySelector(".custom_points");
                            const amount = Number(input.value);

                            await editPoints(ninjaID, amount);
                            input.value = "";
                        }

                        if (buttonElement.dataset.delete) {
                            await deleteNinja(ninjaID);
                        }
                    });

                    ninjaElements[ninja.doc.id] = ninjaElement;
                    ninjaContainer.appendChild(ninjaElement);
                    break;
                case "modified":
                    ninjaElements[ninja.doc.id].querySelector(".ninja_name").textContent = `${value.firstname} ${value.lastname}`;
                    ninjaElements[ninja.doc.id].querySelector(".ninja_points").textContent = `Points: ${value.points}`;
                    ninjaElements[ninja.doc.id].querySelector(".ninja_uid").textContent = `UID: ${ninja.doc.id}`;
                    break;
                case "removed":
                    ninjaContainer.removeChild(ninjaElements[ninja.doc.id]);
                    delete ninjaElements[ninja.doc.id];
                    break;
            }
        });
    });

    onSnapshot(collection(db, "shop"), (snapshot) => {
        snapshot.docChanges().forEach((shopItem) => {
            const value = shopItem.doc.data();

            switch (shopItem.type) {
                case "added":
                    let item = document.createElement("div");
                    item.classList.add("shop_item");

                    item.innerHTML = `
                        <h3 class="shop_item_name">${value.name}</h3>
                        <p class="shop_item_cost">Cost: ${value.cost} points</p>
                        <p class="shop_item_description">Description: ${value.description}</p>
                        <button data-id="${shopItem.doc.id}" data-edit="true">Edit</button>
                        <button data-id="${shopItem.doc.id}" data-delete="true">Delete</button>
                    `;

                    item.addEventListener("click", async (event) => {
                        const buttonElement = event.target;

                        if (buttonElement.tagName !== "BUTTON") return;

                        const itemID = buttonElement.dataset.id;

                        if (buttonElement.dataset.edit) {
                            showPopup("edit", value, shopItem.doc.id);
                        }

                        if (buttonElement.dataset.delete) {
                            await removeShopItem(itemID);
                        }
                    });

                    shopElements[shopItem.doc.id] = item;
                    shopEditorContainer.appendChild(item);
                    break;
                case "modified":
                    shopElements[shopItem.doc.id].querySelector(".shop_item_name").textContent = `${value.name}`;
                    shopElements[shopItem.doc.id].querySelector(".shop_item_cost").textContent = `Cost: ${value.cost} points`;
                    shopElements[shopItem.doc.id].querySelector(".shop_item_description").textContent = `Description: ${value.description}`;
                    break;
                case "removed":
                    shopEditorContainer.removeChild(shopElements[shopItem.doc.id]);
                    delete shopElements[shopItem.doc.id];
                    break;
            }
        });
    });

    addShopItemButton.addEventListener("click", async (event) => {
        showPopup("add");
    })

    applyLeaderboardSlots.addEventListener("click", async (event) => {
        let slots = Number(leaderboardSlotsInput.value);
        if (slots <= 0) { return; }
        await updateDoc(doc(db, "settings", "leaderboard"), {
            leaderboard_slots: slots
        })
        
        leaderboardSlotsInput.value = "";
    })
}

async function editPoints(ninja, amount) {
    await updateDoc(doc(db, "ninjas", ninja), {
        points: increment(amount)
    });
}

async function deleteNinja(ninja) {
    await deleteDoc(doc(db, "ninjas", ninja));
}

async function removeShopItem(itemID) {
    await deleteDoc(doc(db, "shop", itemID));
}

// Start app
loadPage();

/*
Admin panel needs to:
- See all registered members
- add points to members

POINT GUIDE (ROUGH DRAFT)
Level up: 10 points
Belt up: 100 points
*/