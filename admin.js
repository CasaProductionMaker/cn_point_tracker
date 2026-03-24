import { initializeApp } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-app.js";
import { getFirestore, doc, addDoc, setDoc, updateDoc, deleteDoc, onSnapshot, collection, increment } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js";

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
const shopEditorContainer = document.querySelector("#shop_editor_container");
const leaderboardEditorContainer = document.querySelector("#leaderboards_editor_container");
const addShopItemButton = document.querySelector("#add_shop_item_button");
const addLeaderboardButton = document.querySelector("#add_leaderboard_button");

// Element tracking
let ninjaElements = {};
let shopElements = {};
let leaderboardElements = {};
let currentPopup = null;

// temp reasons to add
const pointReasons = {
    "good_behaviour": 10, 
    "completed_goal": 10, 
    "belt_up": 10, 
    "level_up": 10
};

const lang = {
    "good_behaviour": "Good Behaviour", 
    "completed_goal": "Completed Goal", 
    "belt_up": "Belt Up", 
    "level_up": "Level Up"
}

const belts = ["White", "Yellow", "Orange", "Green", "Blue", "Purple", "Brown", "Red", "Black"];

// Helper functions
function createElementHelper(elem_name, className, text) {
    let child = document.createElement(elem_name);
    child.classList.add(className);
    child.textContent = text;

    return child;
};

function createButtonHelper(first_dataset_input, second_dataset_var, second_dataset_input, text) {
    let child = document.createElement("button");
    child.dataset.id = first_dataset_input;
    child.dataset[second_dataset_var] = second_dataset_input;
    child.textContent = text;

    return child;
};

function createEmptyButtonHelper(text) {
    let child = document.createElement("button");
    child.textContent = text;

    return child;
};

function createInputHelper(type, id) {
    let child = document.createElement("input");
    child.type = type;
    child.id = id;
    child.name = id;

    return child;
};

function createLabelHelper(text, forElement) {
    let child = document.createElement("label");
    child.textContent = text;
    child.setAttribute("for", forElement);

    return child;
};

// UI Functions
function showShopPopup(type, editInfo = null, editID = null) {
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
            <button class="submit_popup_button">Add</button>
            <button class="cancel_popup_button">Cancel</button>
        `;

        currentPopup.querySelector(".submit_popup_button").addEventListener("click", async (e) => {
            await addShopItem();
        })
        currentPopup.querySelector(".cancel_popup_button").addEventListener("click", async (e) => {
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
            <button class="submit_popup_button">Apply Changes</button>
            <button class="cancel_popup_button">Cancel</button>
        `;

        currentPopup.querySelector(".submit_popup_button").addEventListener("click", async (e) => {
            await editShopItem(editID);
        })
        currentPopup.querySelector(".cancel_popup_button").addEventListener("click", async (e) => {
            removePopup();
        })

        document.body.appendChild(currentPopup);
    } else {
        console.log("Error: Invalid popup type!")
    }
}

// Show Leaderboard Adding/Editing Popups
function showLeaderboardPopup(type, editInfo = null, editID = null) {
    if (currentPopup != null) {
        console.log("Error: A popup already exists!");
        return;
    }

    if (type == "add") {
        currentPopup = document.createElement("div");
        currentPopup.id = "leaderboard_popup";
        
        currentPopup.innerHTML = `
            <h2>Add New Leaderboard:</h2>
            <div>
                <label for="leaderboard_name_input">Name: </label>
                <input type="text" name="leaderboard_name_input" id="leaderboard_name_input">
            </div>
            <button class="submit_popup_button">Add</button>
            <button class="cancel_popup_button">Cancel</button>
        `;

        currentPopup.querySelector(".submit_popup_button").addEventListener("click", async (e) => {
            // await addShopItem();
        })
        currentPopup.querySelector(".cancel_popup_button").addEventListener("click", async (e) => {
            removePopup();
        })

        document.body.appendChild(currentPopup);
    } else if (type == "edit") {
        currentPopup = document.createElement("div");
        currentPopup.id = "leaderboard_popup";
        
        currentPopup.innerHTML = `
            <h2>Edit Leaderboard:</h2>
            <div>
                <label for="leaderboard_name_input">Name: </label>
                <input type="text" name="leaderboard_name_input" id="leaderboard_name_input" value="${editInfo.name}">
            </div>
            <button class="submit_popup_button">Apply Changes</button>
            <button class="cancel_popup_button">Cancel</button>
        `;

        currentPopup.querySelector(".submit_popup_button").addEventListener("click", async (e) => {
            // await editShopItem(editID);
        })
        currentPopup.querySelector(".cancel_popup_button").addEventListener("click", async (e) => {
            removePopup();
        })

        document.body.appendChild(currentPopup);
    } else {
        console.log("Error: Invalid popup type!")
    }
}

function showSessionPopup(ninjaID, ninjaData) {
    if (currentPopup != null) {
        console.log("Error: A popup already exists!");
        return;
    }

    currentPopup = document.createElement("div");
    currentPopup.id = "add_session_popup";

    let title = createElementHelper("h2", null, `Add Session to ${ninjaData.firstname}:`);
    currentPopup.appendChild(title);

    // Go through all the possible reasons to get points and add a checkbox to select
    Object.keys(pointReasons).forEach(key => {
        let pointReward = pointReasons[key];
        let inputHolder = document.createElement("div");

        // Create both the checkbox and label and put into div so flex doesn't change its layout
        let checkboxInput = createInputHelper("checkbox", `${key}_checkbox`);
        let labelElement = createLabelHelper(`${lang[key]} (${pointReward} points)`, `${key}_checkbox`);
        inputHolder.appendChild(checkboxInput);
        inputHolder.appendChild(labelElement);

        currentPopup.appendChild(inputHolder);
    });

    // Custom points UI
    let customInputHolder = document.createElement("div");

    let checkboxInput = createInputHelper("checkbox", "custom_points_checkbox");
    let labelElement = createLabelHelper(`Custom: `, "custom_points_checkbox");
    let custom_pts = createInputHelper("number", `custom_points_input`);
    custom_pts.setAttribute("placeholder", "Custom Amount...");
    customInputHolder.appendChild(checkboxInput);
    customInputHolder.appendChild(labelElement);
    customInputHolder.appendChild(custom_pts);

    currentPopup.appendChild(customInputHolder);

    // Bottom buttons to submit or cancel
    let submit_button = createEmptyButtonHelper("Add Session");
    currentPopup.appendChild(submit_button);

    let cancel_button = createEmptyButtonHelper("Cancel");
    currentPopup.appendChild(cancel_button);
    
    // Add event listeners
    submit_button.addEventListener("click", async (e) => {
        // Add session to ninja as subcollection
        let sessionData = {};
        let ninjaUpdates = {}; // Storing a dictionary that will only hold CHANGES for the ninja
        let pointsGotten = 0;
        Object.keys(pointReasons).forEach(key => {
            let pointReward = pointReasons[key];

            if (document.querySelector(`#${key}_checkbox`).checked) {
                pointsGotten += pointReward;
                sessionData[`${key}_points`] = pointReward;
                ninjaUpdates[`total_${key}_points`] = increment(pointReward);
            }
        });
        if (document.querySelector(`#custom_points_checkbox`).checked) {
            const inputVal = Number(document.querySelector(`#custom_points_input`).value);
            pointsGotten += inputVal;
            sessionData[`custom_points`] = inputVal;
            ninjaUpdates[`total_custom_points`] = increment(inputVal);
        }
        sessionData.total_points_gotten = pointsGotten;

        await addDoc(collection(db, "ninjas", ninjaID, "sessions"), sessionData);

        // Update the ninja's stats in their regular account for easy access

        ninjaUpdates.points = increment(pointsGotten);
        ninjaUpdates.points_in_history = increment(pointsGotten);
        
        await updateDoc(doc(db, "ninjas", ninjaID), ninjaUpdates);

        // Close popup after done
        removePopup();
    })
    cancel_button.addEventListener("click", async (e) => {
        removePopup();
    })

    document.body.appendChild(currentPopup);
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
    // Load Ninjas
    onSnapshot(collection(db, "ninjas"), (snapshot) => {
        snapshot.docChanges().forEach((ninja) => {
            const value = ninja.doc.data();

            switch (ninja.type) {
                case "added":
                    // Create DOM
                    let ninjaElement = document.createElement("div");
                    ninjaElement.classList.add("registered_ninja");

                    let name = createElementHelper("h3", "ninja_name", `${value.firstname} ${value.lastname}`);
                    ninjaElement.appendChild(name);
                    
                    let points = createElementHelper("p", "ninja_points", `Points: ${value.points}`);
                    ninjaElement.appendChild(points);

                    let uid = createElementHelper("p", "ninja_uid", `UID: ${ninja.doc.id}`);
                    ninjaElement.appendChild(uid);

                    let add_session = createEmptyButtonHelper("Add Session");
                    ninjaElement.appendChild(add_session);

                    let custom_btn_del = createEmptyButtonHelper("Remove Ninja");
                    ninjaElement.appendChild(custom_btn_del);

                    // Add event listeners
                    add_session.addEventListener("click", async (event) => {
                        showSessionPopup(ninja.doc.id, value);
                    });

                    custom_btn_del.addEventListener("click", async (event) => {
                        await deleteNinja(ninja.doc.id);
                    });

                    // Add to DOM
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

    // Load Shop Editor
    onSnapshot(collection(db, "shop"), (snapshot) => {
        snapshot.docChanges().forEach((shopItem) => {
            const value = shopItem.doc.data();

            switch (shopItem.type) {
                case "added":
                    let item = document.createElement("div");
                    item.classList.add("shop_item");

                    let name = createElementHelper("h3", "shop_item_name", `${value.name}`);
                    item.appendChild(name);
                    
                    let cost = createElementHelper("p", "shop_item_cost", `Cost: ${value.cost} points`);
                    item.appendChild(cost);

                    let description = createElementHelper("p", "shop_item_description", `Description: ${value.description}`);
                    item.appendChild(description);

                    let edit_button = createEmptyButtonHelper("Edit");
                    item.appendChild(edit_button);

                    let delete_button = createEmptyButtonHelper("Delete");
                    item.appendChild(delete_button);

                    // Add event listeners
                    edit_button.addEventListener("click", async (event) => {
                        showShopPopup("edit", value, shopItem.doc.id);
                    });

                    delete_button.addEventListener("click", async (event) => {
                        await removeShopItem(shopItem.doc.id);
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

    // Load Leaderboards
    onSnapshot(collection(db, "leaderboards"), (snapshot) => {
        snapshot.docChanges().forEach((leaderboard) => {
            const value = leaderboard.doc.data();

            switch (leaderboard.type) {
                case "added":
                    let item = document.createElement("div");
                    item.classList.add("leaderboard");

                    let name = createElementHelper("h3", "leaderboard_name", `${value.name}`);
                    item.appendChild(name);

                    let slots = createElementHelper("p", "leaderboard_slots", `Slots: ${value.slots}`);
                    item.appendChild(slots);

                    let beltFilterText = "Belts: ";
                    value.belt_filters.forEach(filter => {
                        beltFilterText += `${belts[filter]}, `;
                    });
                    beltFilterText = beltFilterText.replace(/[\s,]+$/, '');
                    let beltFilters = createElementHelper("p", "leaderboard_belt_filters", beltFilterText);
                    item.appendChild(beltFilters);

                    let reasonFilterText = "Belts: ";
                    value.reason_filters.forEach(filter => {
                        reasonFilterText += `${lang[filter]}, `;
                    });
                    reasonFilterText = reasonFilterText.replace(/[\s,]+$/, '');
                    let reasonFilters = createElementHelper("p", "leaderboard_reason_filters", reasonFilterText);
                    item.appendChild(reasonFilters);

                    // Slots Input Holder
                    // let slotsHolder = document.createElement("div");
                    // slotsHolder.appendChild(createLabelHelper("Slots: ", `leaderboard_${leaderboard.doc.id}_slot_amount`))
                    // slotsHolder.appendChild(createInputHelper("number", `leaderboard_${leaderboard.doc.id}_slot_amount`))

                    let edit_button = createEmptyButtonHelper("Edit");
                    item.appendChild(edit_button);

                    let delete_button = createEmptyButtonHelper("Delete");
                    item.appendChild(delete_button);

                    // Add event listeners
                    edit_button.addEventListener("click", async (event) => {
                        // edit popup for thingy
                    });

                    delete_button.addEventListener("click", async (event) => {
                        removeLeaderboard(leaderboard.doc.id);
                    });

                    leaderboardElements[leaderboard.doc.id] = item;
                    leaderboardEditorContainer.appendChild(item);
                    break;
                case "modified":
                    //
                    break;
                case "removed":
                    leaderboardEditorContainer.removeChild(leaderboardElements[leaderboard.doc.id]);
                    delete leaderboardElements[leaderboard.doc.id];
                    break;
            }
        });
    });

    addShopItemButton.addEventListener("click", async (event) => {
        showShopPopup("add");
    })

    addLeaderboardButton.addEventListener("click", async (event) => {
        showLeaderboardPopup("add");
    })
}

async function editPoints(ninja, amount) {
    await updateDoc(doc(db, "ninjas", ninja), {
        points: increment(amount), 
        points_in_history: increment(amount)
    });
}

async function deleteNinja(ninja) {
    await deleteDoc(doc(db, "ninjas", ninja));
}

async function removeShopItem(itemID) {
    await deleteDoc(doc(db, "shop", itemID));
}

async function removeLeaderboard(itemID) {
    await deleteDoc(doc(db, "leaderboards", itemID));
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