import { initializeApp } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-app.js";
import { getFirestore, doc, addDoc, setDoc, updateDoc, deleteDoc, onSnapshot, collection, increment, arrayUnion, arrayRemove, query, orderBy, getDocs, where } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js";
import { createElementHelper, createSimpleElementHelper, createEmptyButtonHelper, createInputHelper, createRadioInputHelper, createLabelHelper } from "./util.js"; 
import { lang, belts } from "./data.js";

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
const homeContainer = document.querySelector("#home_container");
const ninjaContainer = document.querySelector("#ninja_container");
const settingsContainer = document.querySelector("#settings_container");
const singleNinjaView = document.querySelector("#single_ninja_view");

const sidebarHomeButton = document.querySelector("#sidebar_home_button");
const sidebarNinjasButton = document.querySelector("#sidebar_ninjas_button");
const sidebarSettingsButton = document.querySelector("#sidebar_settings_button");
const sidebarLogoutButton = document.querySelector("#sidebar_logout_button");

const ninjaStatsButton = document.querySelector("#ninja_stats_button");
const ninjaSessionsButton = document.querySelector("#ninja_sessions_button");
const ninjaPurchasesButton = document.querySelector("#ninja_purchases_button");

// Single Ninja stuff
const singleNinjaStats = document.querySelector("#single_ninja_stats");
const singleNinjaSessions = document.querySelector("#single_ninja_sessions");
const singleNinjaPurchases = document.querySelector("#single_ninja_purchases");
const singleNinjaCustomPoints = document.querySelector("#single_ninja_custom_points");
const singleNinjaBeltSet = document.querySelector("#single_ninja_belt_set");
const singleNinjaManualLogin = document.querySelector("#single_ninja_manual_login");
const singleNinjaAddSession = document.querySelector("#single_ninja_add_session");
const removeSingleNinja = document.querySelector("#remove_single_ninja");
const ninjaSessionsContainer = document.querySelector("#ninja_sessions_container");
const ninjaPurchasesContainer = document.querySelector("#ninja_purchases_container");

// Settings stuff
const settingsShopItemsButton = document.querySelector("#settings_shop_items_button");
const settingsLeaderboardsButton = document.querySelector("#settings_leaderboards_button");
const settingsShopItems = document.querySelector("#settings_shop_items");
const settingsLeaderboards = document.querySelector("#settings_leaderboards");

// Shortcuts
const ninjasShortcut = document.querySelector("#ninjas_shortcut");
const leaderboardsShortcut = document.querySelector("#leaderboards_shortcut");
const comingSoonShortcut = document.querySelector("#coming_soon_shortcut");

// Other
const ninjaGridContainer = document.querySelector("#ninja_grid_container");
const ninjaSearchBar = document.querySelector("#ninja_search_bar");
const shopEditorContainer = document.querySelector("#shop_editor_container");
const leaderboardEditorContainer = document.querySelector("#leaderboards_editor_container");
const addShopItemButton = document.querySelector("#add_shop_item_button");
const addLeaderboardButton = document.querySelector("#add_leaderboard_button");
const dynamicNavbar = document.querySelector("#navbar_header");

// Element tracking
let ninjaElements = {};
let shopElements = {};
let leaderboardElements = {};
let currentPopup = null;
let ninjaSearchFilter = "";

// Viewing ninja
let currentlyViewingNinja = null;
let sessionUnSub = null;
let purchaseUnSub = null;

// temp reasons to add
const pointReasons = {
    "good_behaviour": 10, 
    "completed_goal": 10, 
    "belt_up": 10, 
    "level_up": 10, 
    "history": 0
};

const UIPositions = ["top_left", "bottom_left", "main", "top_right", "bottom_right"];

// Database cache
let ninjas = {};
let shop = {};
let leaderboards = {};
let takenUIPositions = [];

// Popups
function showShopPopup(type, editID = null) {
    if (currentPopup != null) {
        console.log("Error: A popup already exists!");
        return;
    }

    // Load editInfo from cache
    const editInfo = shop[editID];

    if (type == "add") {
        // Create the popup
        currentPopup = document.createElement("div");
        currentPopup.classList.add("popup_container");

        let actualPopup = document.createElement("div");
        actualPopup.id = "shop_item_popup";
        actualPopup.classList.add("popup", "small_popup");
        
        actualPopup.innerHTML = `
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
            <div class="button_bar">
                <button class="submit_popup_button">Add</button>
                <button class="cancel_popup_button">Cancel</button>
            </div>
        `;

        actualPopup.querySelector(".submit_popup_button").addEventListener("click", async (e) => {
            await addShopItem();
        })
        actualPopup.querySelector(".cancel_popup_button").addEventListener("click", async (e) => {
            removePopup();
        })

        // Add the popup to the blur container
        currentPopup.appendChild(actualPopup);

        document.body.appendChild(currentPopup);
    } else if (type == "edit") {
        // Create the popup
        currentPopup = document.createElement("div");
        currentPopup.classList.add("popup_container");

        let actualPopup = document.createElement("div");
        actualPopup.id = "custom_points_popup";
        actualPopup.classList.add("popup", "small_popup");

        actualPopup.appendChild(createSimpleElementHelper("h2", "Edit Shop Item: "));

        // shop item name input
        let name_input = document.createElement("div");
        name_input.appendChild(createLabelHelper("Name: ", `shop_item_name_input`));
        name_input.appendChild(createInputHelper("text", `shop_item_name_input`, editInfo.name));
        actualPopup.appendChild(name_input);

        // cost item name input
        let cost_input = document.createElement("div");
        cost_input.appendChild(createLabelHelper("Cost: ", `shop_item_cost_input`));
        cost_input.appendChild(createInputHelper("number", `shop_item_cost_input`, editInfo.cost));
        actualPopup.appendChild(cost_input);

        // description item name input
        let description_input = document.createElement("div");
        description_input.appendChild(createLabelHelper("Description: ", `shop_item_description_input`));
        description_input.appendChild(createInputHelper("text", `shop_item_description_input`, editInfo.description));
        actualPopup.appendChild(description_input);

        // Buttons
        let button_bar = document.createElement("div");
        button_bar.classList.add("popup_button_bar");

        let submit_button = createEmptyButtonHelper("APPLY");
        button_bar.appendChild(submit_button);

        let close_button = createEmptyButtonHelper("CANCEL");
        button_bar.appendChild(close_button);
        
        // Add event listeners
        submit_button.addEventListener("click", async (e) => {
            editShopItem(editID);
        })
        close_button.addEventListener("click", async (e) => {
            removePopup();
        })

        actualPopup.appendChild(button_bar);

        // Add the popup to the blur container
        currentPopup.appendChild(actualPopup);

        document.body.appendChild(currentPopup);
    } else {
        console.log("Error: Invalid popup type!")
    }
}

function showLeaderboardPopup(type, editID = null) {
    if (currentPopup != null) {
        console.log("Error: A popup already exists!");
        return;
    }

    // Load editInfo from cache
    const editInfo = leaderboards[editID];

    if (type == "add") {
        // Create the popup
        currentPopup = document.createElement("div");
        currentPopup.classList.add("popup_container");

        let actualPopup = document.createElement("div");
        actualPopup.id = "leaderboard_popup";
        actualPopup.classList.add("popup");
        
        actualPopup.appendChild(createSimpleElementHelper("h2", "Add New Leaderboard: "));

        // Name input
        let name_input_holder = document.createElement("div");
        name_input_holder.appendChild(createLabelHelper("Name: ", `leaderboard_popup_name_input`));
        name_input_holder.appendChild(createInputHelper("text", `leaderboard_popup_name_input`));
        actualPopup.appendChild(name_input_holder);
        
        // Slots Input Holder
        let slots_input_holder = document.createElement("div");
        slots_input_holder.appendChild(createLabelHelper("Slots: ", `leaderboard_popup_slots_input`));
        slots_input_holder.appendChild(createInputHelper("number", `leaderboard_popup_slots_input`));
        actualPopup.appendChild(slots_input_holder);

        // Belt filters editor
        actualPopup.appendChild(createSimpleElementHelper("h3", "Belt Filters: "));
        let belt_filters_holder = document.createElement("div");
        belt_filters_holder.classList.add("long_tile_list");
        belts.forEach(belt => {
            let belt_input_holder = document.createElement("div");
            belt_input_holder.appendChild(createInputHelper("checkbox", `leaderboard_popup_${belt}_belt_input`));
            belt_input_holder.appendChild(createLabelHelper(belt, `leaderboard_popup_${belt}_belt_input`));
            belt_filters_holder.appendChild(belt_input_holder);
        });
        actualPopup.appendChild(belt_filters_holder);
        
        // Reason filters editor
        actualPopup.appendChild(createSimpleElementHelper("h3", "Reason Filter: "));
        let reason_filters_holder = document.createElement("div");
        reason_filters_holder.classList.add("long_tile_list");
        Object.keys(pointReasons).forEach(reason => {
            let reason_input_holder = document.createElement("div");
            let radioInput = createRadioInputHelper("leaderboard_popup_reason_filter_input", `leaderboard_popup_${reason}_reason_filter_input`, reason == "history", reason);
            reason_input_holder.appendChild(radioInput);
            reason_input_holder.appendChild(createLabelHelper(lang[reason], `leaderboard_popup_${reason}_reason_filter_input`));
            reason_filters_holder.appendChild(reason_input_holder);
        });
        actualPopup.appendChild(reason_filters_holder);

        // Select UI position
        actualPopup.appendChild(createSimpleElementHelper("h3", "UI Position: "));
        let ui_position_holder = document.createElement("div");
        ui_position_holder.classList.add("long_tile_list");
        let onTaken = false;
        UIPositions.forEach(place => {
            let place_input_holder = document.createElement("div");
            let radioInput = createRadioInputHelper("leaderboard_popup_place_input", `leaderboard_popup_${place}_place_input`, !takenUIPositions.includes(place) && !onTaken, place);
            if (takenUIPositions.includes(place)) {
                radioInput.disabled = true;
            } else {
                onTaken = true;
            }
            place_input_holder.appendChild(radioInput);
            place_input_holder.appendChild(createLabelHelper(lang[place], `leaderboard_popup_${place}_place_input`));
            ui_position_holder.appendChild(place_input_holder);
        });
        actualPopup.appendChild(ui_position_holder);

        // Buttons
        let button_bar = document.createElement("div");
        button_bar.classList.add("popup_button_bar");
        
        let submit_button = createEmptyButtonHelper("Add");
        button_bar.appendChild(submit_button);
        let cancel_popup_button = createEmptyButtonHelper("Cancel");
        button_bar.appendChild(cancel_popup_button);

        submit_button.addEventListener("click", async (e) => {
            await addLeaderboard();
        })
        cancel_popup_button.addEventListener("click", async (e) => {
            removePopup();
        })

        actualPopup.appendChild(button_bar);

        // Add the popup to the blur container
        currentPopup.appendChild(actualPopup);

        document.body.appendChild(currentPopup);
    } else if (type == "edit") {
        // Create the popup
        currentPopup = document.createElement("div");
        currentPopup.classList.add("popup_container");

        let actualPopup = document.createElement("div");
        actualPopup.id = "leaderboard_popup";
        actualPopup.classList.add("popup");
        
        actualPopup.appendChild(createSimpleElementHelper("h2", "Edit Leaderboard: "));

        // Name input
        let name_input_holder = document.createElement("div");
        name_input_holder.appendChild(createLabelHelper("Name: ", `leaderboard_popup_name_input`));
        name_input_holder.appendChild(createInputHelper("text", `leaderboard_popup_name_input`, editInfo.name));
        actualPopup.appendChild(name_input_holder);
        
        // Slots Input Holder
        let slots_input_holder = document.createElement("div");
        slots_input_holder.appendChild(createLabelHelper("Slots: ", `leaderboard_popup_slots_input`));
        slots_input_holder.appendChild(createInputHelper("number", `leaderboard_popup_slots_input`, editInfo.slots));
        actualPopup.appendChild(slots_input_holder);

        // Belt filters editor
        actualPopup.appendChild(createSimpleElementHelper("h3", "Belt Filters: "));
        let belt_filters_holder = document.createElement("div");
        belt_filters_holder.classList.add("long_tile_list");
        belts.forEach(belt => {
            let belt_input_holder = document.createElement("div");
            let box = createInputHelper("checkbox", `leaderboard_popup_${belt}_belt_input`);
            box.checked = editInfo.belt_filters.includes(belts.indexOf(belt));
            belt_input_holder.appendChild(box);
            belt_input_holder.appendChild(createLabelHelper(belt, `leaderboard_popup_${belt}_belt_input`));
            belt_filters_holder.appendChild(belt_input_holder);
        });
        actualPopup.appendChild(belt_filters_holder);
        
        // Reason filters editor
        actualPopup.appendChild(createSimpleElementHelper("h3", "Reason Filter: "));
        let reason_filters_holder = document.createElement("div");
        reason_filters_holder.classList.add("long_tile_list");
        Object.keys(pointReasons).forEach(reason => {
            let reason_input_holder = document.createElement("div");
            let radioInput = createRadioInputHelper("leaderboard_popup_reason_filter_input", `leaderboard_popup_${reason}_reason_filter_input`, editInfo.reason_filter == reason, reason);
            reason_input_holder.appendChild(radioInput);
            reason_input_holder.appendChild(createLabelHelper(lang[reason], `leaderboard_popup_${reason}_reason_filter_input`));
            reason_filters_holder.appendChild(reason_input_holder);
        });
        actualPopup.appendChild(reason_filters_holder);

        // Select UI position
        actualPopup.appendChild(createSimpleElementHelper("h3", "UI Position: "));
        let ui_position_holder = document.createElement("div");
        ui_position_holder.classList.add("long_tile_list");
        UIPositions.forEach(place => {
            let place_input_holder = document.createElement("div");
            let radioInput = createRadioInputHelper("leaderboard_popup_place_input", `leaderboard_popup_${place}_place_input`, place == editInfo.ui_position, place);
            if (takenUIPositions.includes(place) && place != editInfo.ui_position) {
                radioInput.disabled = true;
            }
            place_input_holder.appendChild(radioInput);
            place_input_holder.appendChild(createLabelHelper(lang[place], `leaderboard_popup_${place}_place_input`));
            ui_position_holder.appendChild(place_input_holder);
        });
        actualPopup.appendChild(ui_position_holder);

        // Buttons
        let button_bar = document.createElement("div");
        button_bar.classList.add("popup_button_bar");

        let submit_button = createEmptyButtonHelper("Apply Changes");
        button_bar.appendChild(submit_button);
        let cancel_popup_button = createEmptyButtonHelper("Cancel");
        button_bar.appendChild(cancel_popup_button);

        submit_button.addEventListener("click", async (e) => {
            await editLeaderboard(editID, editInfo.ui_position);
        })
        cancel_popup_button.addEventListener("click", async (e) => {
            removePopup();
        })

        actualPopup.appendChild(button_bar);

        // Add the popup to the blur container
        currentPopup.appendChild(actualPopup);

        document.body.appendChild(currentPopup);
    } else {
        console.log("Error: Invalid popup type!");
    }
}

function showSessionPopup(ninjaID) {
    if (currentPopup != null) {
        console.log("Error: A popup already exists!");
        return;
    }

    // Load data from cache
    const ninjaData = ninjas[ninjaID];

    // Create the popup
    currentPopup = document.createElement("div");
    currentPopup.classList.add("popup_container");

    let actualPopup = document.createElement("div");
    actualPopup.id = "add_session_popup";
    actualPopup.classList.add("popup");

    let title = createElementHelper("h2", null, `Add Session to ${ninjaData.firstname}:`);
    actualPopup.appendChild(title);

    // Go through all the possible reasons to get points and add a checkbox to select
    Object.keys(pointReasons).forEach(key => {
        let pointReward = pointReasons[key];

        if (pointReward <= 0) return;

        let inputHolder = document.createElement("div");

        // Create both the checkbox and label and put into div so flex doesn't change its layout
        let checkboxInput = createInputHelper("checkbox", `${key}_checkbox`);
        let labelElement = createLabelHelper(`${lang[key]} (${pointReward} points)`, `${key}_checkbox`);
        inputHolder.appendChild(checkboxInput);
        inputHolder.appendChild(labelElement);

        actualPopup.appendChild(inputHolder);
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

    actualPopup.appendChild(customInputHolder);

    // Buttons
    let button_bar = document.createElement("div");
    button_bar.classList.add("popup_button_bar");

    let submit_button = createEmptyButtonHelper("Add Session");
    button_bar.appendChild(submit_button);

    let cancel_button = createEmptyButtonHelper("Cancel");
    button_bar.appendChild(cancel_button);
    
    // Add event listeners
    submit_button.addEventListener("click", async (e) => {
        // Add session to ninja as subcollection
        let sessionData = {
            date_added: Date.now()
        };
        let ninjaUpdates = {}; // Storing a dictionary that will only hold CHANGES for the ninja
        let pointsGotten = 0;
        Object.keys(pointReasons).forEach(async key => {
            let pointReward = pointReasons[key];

            if (pointReward <= 0) return;

            if (document.querySelector(`#${key}_checkbox`).checked) {
                pointsGotten += pointReward;
                sessionData[`${key}_points`] = pointReward;
                ninjaUpdates[`total_${key}_points`] = increment(pointReward);

                // Add info to leaderboard_entries
                await setDoc(doc(db, "leaderboard_entries", `${ninjaID}_${key}`), {
                    ninja_id: ninjaID, 
                    reason: key, 
                    points: increment(pointReward), 
                    ninja_belt_level: ninjaData.belt
                }, { merge: true })
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

        // Add info to leaderboard_entries
        await setDoc(doc(db, "leaderboard_entries", `${ninjaID}_history`), {
            ninja_id: ninjaID, 
            reason: "history", 
            points: increment(pointsGotten), 
            ninja_belt_level: ninjaData.belt
        }, { merge: true })

        // Close popup after done
        removePopup();
    })
    cancel_button.addEventListener("click", async (e) => {
        removePopup();
    })

    actualPopup.appendChild(button_bar);

    // Add the popup to the blur container
    currentPopup.appendChild(actualPopup);

    document.body.appendChild(currentPopup);
}

function showConfirmPopup(callback, titleText, button1 = "Delete", button2 = "Cancel") {
    if (currentPopup != null) {
        console.log("Error: A popup already exists!");
        return;
    }

    // Create the popup
    currentPopup = document.createElement("div");
    currentPopup.classList.add("popup_container");

    let actualPopup = document.createElement("div");
    actualPopup.id = "confirm_delete_popup";
    actualPopup.classList.add("popup", "small_popup");

    let title = createElementHelper("h2", null, titleText);
    actualPopup.appendChild(title);

    let info = createElementHelper("p", null, "This action is irriversible.");
    actualPopup.appendChild(info);

    // Buttons
    let button_bar = document.createElement("div");
    button_bar.classList.add("popup_button_bar");

    let submit_button = createEmptyButtonHelper(button1, "danger_button");
    button_bar.appendChild(submit_button);

    let cancel_button = createEmptyButtonHelper(button2);
    button_bar.appendChild(cancel_button);

    // Event listeners
    submit_button.addEventListener("click", async (e) => {
        await callback();
        removePopup();
    })

    cancel_button.addEventListener("click", async (e) => {
        removePopup();
    })

    actualPopup.appendChild(button_bar);

    // Add the popup to the blur container
    currentPopup.appendChild(actualPopup);

    document.body.appendChild(currentPopup);
}

function showAddCustomPointsPopup(ninjaID) {
    if (currentPopup != null) {
        console.log("Error: A popup already exists!");
        return;
    }

    // Load data from cache
    const ninjaData = ninjas[ninjaID];

    // Create the popup
    currentPopup = document.createElement("div");
    currentPopup.classList.add("popup_container");

    let actualPopup = document.createElement("div");
    actualPopup.id = "custom_points_popup";
    actualPopup.classList.add("popup", "small_popup");

    actualPopup.appendChild(createSimpleElementHelper("h2", "Add Custom Points to a Ninja: "));

    // Amount input
    let amount_input = document.createElement("div");
    amount_input.appendChild(createLabelHelper("Amount: ", `custom_points_popup_amount_input`));
    amount_input.appendChild(createInputHelper("number", `custom_points_popup_amount_input`));
    actualPopup.appendChild(amount_input);

    // Buttons
    let button_bar = document.createElement("div");
    button_bar.classList.add("popup_button_bar");

    let submit_button = createEmptyButtonHelper("Apply Points");
    button_bar.appendChild(submit_button);

    let close_button = createEmptyButtonHelper("Close");
    button_bar.appendChild(close_button);
    
    // Add event listeners
    submit_button.addEventListener("click", async (e) => {
        applyCustomPoints(ninjaID);
    })
    close_button.addEventListener("click", async (e) => {
        removePopup();
    })

    actualPopup.appendChild(button_bar);

    // Add the popup to the blur container
    currentPopup.appendChild(actualPopup);

    document.body.appendChild(currentPopup);
}

function showEditBeltLevelPopup(ninjaID) {
    if (currentPopup != null) {
        console.log("Error: A popup already exists!");
        return;
    }

    // Load data from cache
    const ninjaData = ninjas[ninjaID];

    // Create the popup
    currentPopup = document.createElement("div");
    currentPopup.classList.add("popup_container");

    let actualPopup = document.createElement("div");
    actualPopup.id = "custom_points_popup";
    actualPopup.classList.add("popup", "small_popup");

    actualPopup.appendChild(createSimpleElementHelper("h2", `Update ${ninjaData.firstname}'s Belt Level: `));

    // Belt input
    let beltHolder = document.createElement("div");
    let label = createLabelHelper("Belt Level: ", "belts");
    let dropdown = document.createElement("select");
    dropdown.setAttribute("name", "belts");
    dropdown.id = "belts";
    belts.forEach(belt => {
        let option = document.createElement("option");
        option.setAttribute("value", belt);
        option.textContent = belt;
        dropdown.appendChild(option);
    });
    dropdown.value = belts[ninjaData.belt];
    beltHolder.appendChild(label);
    beltHolder.appendChild(dropdown);
    actualPopup.appendChild(beltHolder);

    // Buttons
    let button_bar = document.createElement("div");
    button_bar.classList.add("popup_button_bar");

    let submit_button = createEmptyButtonHelper("Apply");
    button_bar.appendChild(submit_button);

    let close_button = createEmptyButtonHelper("Close");
    button_bar.appendChild(close_button);
    
    // Add event listeners
    submit_button.addEventListener("click", async (e) => {
        applyBeltLevel(ninjaID);
    })
    close_button.addEventListener("click", async (e) => {
        removePopup();
    })

    actualPopup.appendChild(button_bar);

    // Add the popup to the blur container
    currentPopup.appendChild(actualPopup);

    document.body.appendChild(currentPopup);
}

function removePopup() {
    document.body.removeChild(currentPopup);
    currentPopup = null;
}

// Functions to add stuff based on UI input
async function addShopItem() {
    const itemName = document.querySelector("#shop_item_name_input").value;
    const itemCost = Number(document.querySelector("#shop_item_cost_input").value);
    const itemDescription = document.querySelector("#shop_item_description_input").value;
    let nameID = itemName.replaceAll(" ", "_").toLowerCase();

    await setDoc(doc(db, "shop", nameID), {
        name: itemName, 
        cost: itemCost, 
        description: itemDescription
    });

    removePopup();
}

async function addLeaderboard() {
    const leaderboardName = document.querySelector("#leaderboard_popup_name_input").value;
    const leaderboardSlots = Number(document.querySelector("#leaderboard_popup_slots_input").value);
    const UIPosition = document.querySelector("input[name='leaderboard_popup_place_input']:checked").value;
    const reasonFilter = document.querySelector("input[name='leaderboard_popup_reason_filter_input']:checked").value;

    let beltFilters = [];

    // Belt filters editor
    belts.forEach(belt => {
        if (document.querySelector(`#leaderboard_popup_${belt}_belt_input`).checked) {
            beltFilters.push(belts.indexOf(belt));
        }
    });

    await addDoc(collection(db, "leaderboards"), {
        name: leaderboardName, 
        slots: leaderboardSlots, 
        belt_filters: beltFilters, 
        reason_filter: reasonFilter, 
        ui_position: UIPosition
    });

    await updateDoc(doc(db, "settings", "leaderboard"), {
        taken_ui_positions: arrayUnion(UIPosition)
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

async function editLeaderboard(leaderboardID, previousUIPosition) {
    const leaderboardName = document.querySelector("#leaderboard_popup_name_input").value;
    const leaderboardSlots = Number(document.querySelector("#leaderboard_popup_slots_input").value);
    const UIPosition = document.querySelector("input[name='leaderboard_popup_place_input']:checked").value;
    const reasonFilter = document.querySelector("input[name='leaderboard_popup_reason_filter_input']:checked").value;

    let beltFilters = [];

    // Belt filters editor
    belts.forEach(belt => {
        if (document.querySelector(`#leaderboard_popup_${belt}_belt_input`).checked) {
            beltFilters.push(belts.indexOf(belt));
        }
    });

    await updateDoc(doc(db, "leaderboards", leaderboardID), {
        name: leaderboardName, 
        slots: leaderboardSlots, 
        belt_filters: beltFilters, 
        reason_filter: reasonFilter, 
        ui_position: UIPosition
    });

    if (UIPosition != previousUIPosition) {
        await updateDoc(doc(db, "settings", "leaderboard"), {
            taken_ui_positions: arrayRemove(previousUIPosition)
        });

        await updateDoc(doc(db, "settings", "leaderboard"), {
            taken_ui_positions: arrayUnion(UIPosition)
        });
    }

    removePopup();
}

async function applyCustomPoints(ninjaID) {
    const amount = Number(document.querySelector("#custom_points_popup_amount_input").value);
    await editPoints(ninjaID, amount);
    removePopup();
}

async function applyBeltLevel(ninjaID) {
    const belt = belts.indexOf(document.querySelector("#belts").value);
    await updateDoc(doc(db, "ninjas", ninjaID), {
        belt: belt
    });
    // Find all my leaderboard entries to update them
    const myEntries = await getDocs(query(collection(db, "leaderboard_entries"), where("ninja_id", "==", ninjaID)));
    myEntries.forEach(async (document) => {
        // replace the belt level
        await updateDoc(doc(db, "leaderboard_entries", document.id), {
            ninja_belt_level: belt
        })
    })

    removePopup();
}

// View functions
function removeActiveView() {
    document.querySelector(".active_view").classList.remove("active_view");
}

function showNinjaView(ninjaID) {
    currentlyViewingNinja = ninjaID;
    updateNinjaView(ninjaID);

    removeActiveView();
    singleNinjaView.classList.add("active_view");
}

function updateNinjaView(ninjaID) {
    // Setup ALL the ninjas's stuff
    const ninjaData = ninjas[ninjaID];

    // Stats:
    singleNinjaStats.querySelector(".ninja_title").textContent = `${ninjaData.firstname} ${ninjaData.lastname}'s Stats`;
    singleNinjaStats.querySelector(".ninja_belt").textContent = `${belts[ninjaData.belt]} Belt`;
    singleNinjaStats.querySelector(".ninja_points").textContent = `Current Points: ${ninjaData.points}`;
    singleNinjaStats.querySelector(".ninja_uid").textContent = `UID: ${ninjaID}`;
    singleNinjaStats.querySelector(".ninja_nfc_id").textContent = `NFC ID: ${ninjaData.nfc_id}`;
    singleNinjaStats.querySelector(".ninja_history_points").textContent = `Points in History: ${ninjaData.points_in_history}`;

    // Sessions:
    singleNinjaSessions.querySelector(".ninja_title").textContent = `${ninjaData.firstname} ${ninjaData.lastname}'s Sessions`;

    // Subscribe to update the sessions:
    if (sessionUnSub) {
        sessionUnSub();
    }

    sessionUnSub = onSnapshot(query(collection(db, "ninjas", ninjaID, "sessions"), orderBy("date_added", "desc")), (snapshot) => {
        ninjaSessionsContainer.innerHTML = "";
        snapshot.forEach((session) => {
            const value = session.data();

            // Create DOM
            let sessionElement = document.createElement("div");
            sessionElement.classList.add("ninja_session");

            // Title
            const time = new Date(value.date_added);
            let title = createSimpleElementHelper("h3", time.toLocaleDateString());
            sessionElement.appendChild(title);
            
            let points = createSimpleElementHelper("p", `Total Points: ${value.total_points_gotten}`);
            sessionElement.appendChild(points);

            Object.keys(pointReasons).forEach(reason => {
                const pointsForReason = value[`${reason}_points`];
                if (pointsForReason) {
                    let pointReason = createSimpleElementHelper("p", `${lang[reason]} Points: ${pointsForReason}`);
                    sessionElement.appendChild(pointReason);
                }
            });

            // Buttons
            let button_bar = document.createElement("div");
            button_bar.classList.add("popup_button_bar");

            let delete_button = createEmptyButtonHelper("DELETE SESSION", "danger_button");
            button_bar.appendChild(delete_button);
            
            // Add event listeners
            delete_button.addEventListener("click", async (e) => {
                showConfirmPopup(async () => await removeSession(ninjaID, session.id), "Are you sure you want to delete this session?")
            })

            sessionElement.appendChild(button_bar);

            // Add to DOM
            ninjaSessionsContainer.appendChild(sessionElement);
        });
    });

    // Purchases:
    singleNinjaPurchases.querySelector(".ninja_title").textContent = `${ninjaData.firstname} ${ninjaData.lastname}'s Purchases`;

    // Unsubscribe if we are already listening:
    if (purchaseUnSub) {
        purchaseUnSub();
    }

    purchaseUnSub = onSnapshot(query(collection(db, "ninjas", ninjaID, "purchases"), orderBy("fulfilled", "asc")), (snapshot) => {
        ninjaPurchasesContainer.innerHTML = "";
        snapshot.forEach((purchase) => {
            const value = purchase.data();

            // Create DOM
            let purchaseElement = document.createElement("div");
            purchaseElement.classList.add("ninja_purchase");

            // Title
            const time = new Date(value.date);
            let title = createSimpleElementHelper("h3", `Purchase on ${time.toLocaleDateString()}`);
            purchaseElement.appendChild(title);
            
            let item = createSimpleElementHelper("p", `Item Bought: ${shop[value.item].name}`);
            purchaseElement.appendChild(item);
            
            let cost = createSimpleElementHelper("p", `Amount Payed: ${value.amount_payed}`);
            purchaseElement.appendChild(cost);
            
            let resolved = createSimpleElementHelper("p", `${value.fulfilled ? "Fulfilled" : "Not Fulfilled"}`);
            resolved.classList.add(value.fulfilled ? "resolved_purchase" : "unresolved_purchase");
            purchaseElement.appendChild(resolved);

            // Buttons
            if (!value.fulfilled) {
                let button_bar = document.createElement("div");
                button_bar.classList.add("button_bar");

                let delete_button = createEmptyButtonHelper("Fulfilled?", "danger_button");
                button_bar.appendChild(delete_button);
                
                // Add event listeners
                delete_button.addEventListener("click", async (e) => {
                    showConfirmPopup(async () => await fulfillPurchase(ninjaID, purchase.id), "Are you sure this purchase has been fulfilled?", "Confirm")
                })

                purchaseElement.appendChild(button_bar);
            }

            // Add to DOM
            ninjaPurchasesContainer.appendChild(purchaseElement);
        });
    });
}

// On page load
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

                    let belt = createElementHelper("p", "ninja_belt", `${belts[value.belt]} Belt`);
                    ninjaElement.appendChild(belt);

                    let view_ninja = createEmptyButtonHelper("More Info");
                    ninjaElement.appendChild(view_ninja);

                    // Add event listeners
                    view_ninja.addEventListener("click", (event) => {
                        showNinjaView(ninja.doc.id);
                        document.querySelector(".active_ninja_tab").classList.remove("active_ninja_tab");
                        singleNinjaStats.classList.add("active_ninja_tab");
                        updateDynamicNavbar(`Ninjas > ${value.firstname} ${value.lastname} > Stats`);
                    });

                    // Save value for editing purposes
                    ninjas[ninja.doc.id] = value;

                    // Add to DOM
                    ninjaElements[ninja.doc.id] = ninjaElement;
                    ninjaGridContainer.appendChild(ninjaElement);
                    break;
                case "modified":
                    ninjaElements[ninja.doc.id].querySelector(".ninja_name").textContent = `${value.firstname} ${value.lastname}`;
                    ninjaElements[ninja.doc.id].querySelector(".ninja_points").textContent = `Points: ${value.points}`;
                    ninjaElements[ninja.doc.id].querySelector(".ninja_belt").textContent = `${belts[value.belt]} Belt`;

                    // Update value for editing purposes
                    ninjas[ninja.doc.id] = value;

                    // Update Ninja View
                    if (ninja.doc.id == currentlyViewingNinja) {
                        updateNinjaView(ninja.doc.id);
                    }

                    break;
                case "removed":
                    ninjaGridContainer.removeChild(ninjaElements[ninja.doc.id]);
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

                    // Buttons
                    let button_bar = document.createElement("div");
                    button_bar.classList.add("button_bar");

                    let edit_button = createEmptyButtonHelper("Edit");
                    button_bar.appendChild(edit_button);

                    let delete_button = createEmptyButtonHelper("Delete", "danger_button");
                    button_bar.appendChild(delete_button);

                    // Event listeners
                    edit_button.addEventListener("click", async (event) => {
                        showShopPopup("edit", shopItem.doc.id);
                    });

                    delete_button.addEventListener("click", async (event) => {
                        showConfirmPopup(async () => await removeShopItem(shopItem.doc.id), "Are you sure you want to delete this shop item?");
                    });

                    item.appendChild(button_bar);

                    // Save value for editing purposes
                    shop[shopItem.doc.id] = value;

                    shopElements[shopItem.doc.id] = item;
                    shopEditorContainer.appendChild(item);
                    break;
                case "modified":
                    shopElements[shopItem.doc.id].querySelector(".shop_item_name").textContent = `${value.name}`;
                    shopElements[shopItem.doc.id].querySelector(".shop_item_cost").textContent = `Cost: ${value.cost} points`;
                    shopElements[shopItem.doc.id].querySelector(".shop_item_description").textContent = `Description: ${value.description}`;

                    // Update value for editing purposes
                    shop[shopItem.doc.id] = value;

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

                    let reasonFilters = createElementHelper("p", "leaderboard_reason_filters", `Reason Filter: ${lang[value.reason_filter]} points`);
                    item.appendChild(reasonFilters);

                    let UIPlace = createElementHelper("p", "leaderboard_ui_place", "UI position: " + lang[value.ui_position]);
                    item.appendChild(UIPlace);

                    // Buttons
                    let button_bar = document.createElement("div");
                    button_bar.classList.add("button_bar");

                    let edit_button = createEmptyButtonHelper("Edit");
                    button_bar.appendChild(edit_button);

                    let delete_button = createEmptyButtonHelper("Delete", "danger_button");
                    button_bar.appendChild(delete_button);

                    // Add event listeners
                    edit_button.addEventListener("click", async (event) => {
                        showLeaderboardPopup("edit", leaderboard.doc.id);
                    });

                    delete_button.addEventListener("click", async (event) => {
                        showConfirmPopup(async () => removeLeaderboard(leaderboard.doc.id), "Are you sure you want to delete this leaderboard?");
                    });

                    item.appendChild(button_bar);

                    // Save value for editing purposes
                    leaderboards[leaderboard.doc.id] = value;

                    leaderboardElements[leaderboard.doc.id] = item;
                    leaderboardEditorContainer.appendChild(item);
                    break;
                case "modified":
                    leaderboardElements[leaderboard.doc.id].querySelector(".leaderboard_name").textContent = `${value.name}`;
                    leaderboardElements[leaderboard.doc.id].querySelector(".leaderboard_slots").textContent = `Slots: ${value.slots}`;

                    let updatedBeltFilterText = "Belts: ";
                    value.belt_filters.forEach(filter => {
                        updatedBeltFilterText += `${belts[filter]}, `;
                    });
                    updatedBeltFilterText = updatedBeltFilterText.replace(/[\s,]+$/, '');
                    leaderboardElements[leaderboard.doc.id].querySelector(".leaderboard_belt_filters").textContent = updatedBeltFilterText;

                    leaderboardElements[leaderboard.doc.id].querySelector(".leaderboard_reason_filters").textContent = `Reason Filter: ${lang[value.reason_filter]} points`;

                    leaderboardElements[leaderboard.doc.id].querySelector(".leaderboard_ui_place").textContent = "UI position: " + lang[value.ui_position];

                    // Update value for editing purposes
                    leaderboards[leaderboard.doc.id] = value;

                    break;
                case "removed":
                    leaderboardEditorContainer.removeChild(leaderboardElements[leaderboard.doc.id]);
                    delete leaderboardElements[leaderboard.doc.id];
                    break;
            }
        });
    });

    // Update the taken UI slots for leaderboards
    onSnapshot(doc(db, "settings", "leaderboard"), (snapshot) => {
        takenUIPositions = snapshot.data().taken_ui_positions;
    });

    addShopItemButton.addEventListener("click", async (event) => {
        showShopPopup("add");
    })

    addLeaderboardButton.addEventListener("click", async (event) => {
        showLeaderboardPopup("add");
    })

    // Sidebar buttons
    sidebarHomeButton.addEventListener("click", (event) => {
        removeActiveView();
        homeContainer.classList.add("active_view");
        updateDynamicNavbar("Home");
    })
    sidebarNinjasButton.addEventListener("click", (event) => {
        removeActiveView();
        ninjaContainer.classList.add("active_view");
        updateDynamicNavbar("Ninjas");
    })
    sidebarSettingsButton.addEventListener("click", (event) => {
        removeActiveView();
        settingsContainer.classList.add("active_view");
        document.querySelector(".active_settings_tab").classList.remove("active_settings_tab");
        settingsShopItems.classList.add("active_settings_tab");
        updateDynamicNavbar("Settings > Shop Items");
    })
    sidebarLogoutButton.addEventListener("click", (event) => {
        window.location.href = "/";
    })

    // Ninja view buttons
    ninjaStatsButton.addEventListener("click", (event) => {
        document.querySelector(".active_ninja_tab").classList.remove("active_ninja_tab");
        singleNinjaStats.classList.add("active_ninja_tab");
        updateDynamicNavbar(`Ninjas > ${ninjas[currentlyViewingNinja].firstname} ${ninjas[currentlyViewingNinja].lastname} > Stats`);
    })
    ninjaSessionsButton.addEventListener("click", (event) => {
        document.querySelector(".active_ninja_tab").classList.remove("active_ninja_tab");
        singleNinjaSessions.classList.add("active_ninja_tab");
        updateDynamicNavbar(`Ninjas > ${ninjas[currentlyViewingNinja].firstname} ${ninjas[currentlyViewingNinja].lastname} > Sessions`);
    })
    ninjaPurchasesButton.addEventListener("click", (event) => {
        document.querySelector(".active_ninja_tab").classList.remove("active_ninja_tab");
        singleNinjaPurchases.classList.add("active_ninja_tab");
        updateDynamicNavbar(`Ninjas > ${ninjas[currentlyViewingNinja].firstname} ${ninjas[currentlyViewingNinja].lastname} > Purchases`);
    })

    singleNinjaCustomPoints.addEventListener("click", (event) => {
        showAddCustomPointsPopup(currentlyViewingNinja);
    })
    singleNinjaBeltSet.addEventListener("click", (event) => {
        showEditBeltLevelPopup(currentlyViewingNinja);
    });
    singleNinjaManualLogin.addEventListener("click", (event) => {
        // Set the login credentials to the ninja's credentials and open the dashboard app
        localStorage.setItem("currentUser", ninjas[currentlyViewingNinja].nfc_id);
        window.location.href = "dashboard.html";
    })
    removeSingleNinja.addEventListener("click", (event) => {
        showConfirmPopup(async () => await deleteNinja(currentlyViewingNinja), "Are you sure you want to delete this Ninja?");
    })
    singleNinjaAddSession.addEventListener("click", (event) => {
        showSessionPopup(currentlyViewingNinja);
    })

    ninjaSearchBar.addEventListener("input", (event) => {
        ninjaSearchFilter = event.target.value.toLowerCase();

        Object.keys(ninjas).forEach((ninjaKey) => {
            const ninjaData = ninjas[ninjaKey];
            const ninjaElement = ninjaElements[ninjaKey];
            
            let isShown = false;
            if (ninjaData.firstname.toLowerCase().includes(ninjaSearchFilter)) {
                isShown = true;
            }

            ninjaElement.style.display = isShown ? "block" : "none";
        });
    });

    // Settings listeners
    settingsShopItemsButton.addEventListener("click", (event) => {
        document.querySelector(".active_settings_tab").classList.remove("active_settings_tab");
        settingsShopItems.classList.add("active_settings_tab");
        updateDynamicNavbar("Settings > Shop Items");
    });
    settingsLeaderboardsButton.addEventListener("click", (event) => {
        document.querySelector(".active_settings_tab").classList.remove("active_settings_tab");
        settingsLeaderboards.classList.add("active_settings_tab");
        updateDynamicNavbar("Settings > Leaderboards");
    });

    // Shortcuts listeners
    ninjasShortcut.addEventListener("click", (event) => {
        removeActiveView();
        ninjaContainer.classList.add("active_view");
        updateDynamicNavbar("Ninjas");
    })
    leaderboardsShortcut.addEventListener("click", (event) => {
        window.location.href = "/Leaderboard/"
    })
}

// Database functions
async function editPoints(ninja, amount) {
    await updateDoc(doc(db, "ninjas", ninja), {
        points: increment(amount), 
        total_history_points: increment(amount)
    });
}

async function deleteNinja(ninja) {
    await deleteDoc(doc(db, "ninjas", ninja));
}

async function removeShopItem(itemID) {
    await deleteDoc(doc(db, "shop", itemID));
}

async function removeSession(ninjaID, sessionID) {
    await deleteDoc(doc(db, "ninjas", ninjaID, "sessions", sessionID));
}

async function fulfillPurchase(ninjaID, purchaseID) {
    await updateDoc(doc(db, "ninjas", ninjaID, "purchases", purchaseID), {
        fulfilled: true
    });
}

async function removeLeaderboard(itemID) {
    await updateDoc(doc(db, "settings", "leaderboard"), {
        taken_ui_positions: arrayRemove(leaderboards[itemID].ui_position)
    });

    await deleteDoc(doc(db, "leaderboards", itemID));
}

// Other functions
function updateDynamicNavbar(path) {
    dynamicNavbar.textContent = path;
}

// Start app
loadPage();