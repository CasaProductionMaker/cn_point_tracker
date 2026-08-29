// Helper functions
export function createElementHelper(elem_name, className, text) {
    let child = document.createElement(elem_name);
    if (className != "") child.classList.add(className);
    child.textContent = text;

    return child;
};

export function createSimpleElementHelper(elem_name, text) {
    let child = document.createElement(elem_name);
    child.textContent = text;

    return child;
};

export function createButtonHelper(first_dataset_input, second_dataset_var, second_dataset_input, text) {
    let child = document.createElement("button");
    child.dataset.id = first_dataset_input;
    child.dataset[second_dataset_var] = second_dataset_input;
    child.textContent = text;

    return child;
};

export function createEmptyButtonHelper(text, className = null) {
    let child = document.createElement("button");
    child.textContent = text;
    if (className) child.classList.add(className);

    return child;
};

export function createInputHelper(type, id, defaultValue = "") {
    let child = document.createElement("input");
    child.type = type;
    child.id = id;
    child.name = id;
    child.value = defaultValue;

    return child;
};

export function createRadioInputHelper(name, id, checked, value) {
    let child = document.createElement("input");
    child.type = "radio";
    child.id = id;
    child.name = name;
    child.value = value;
    if (checked) child.checked = true;

    return child;
};

export function createLabelHelper(text, forElement) {
    let child = document.createElement("label");
    child.textContent = text;
    child.setAttribute("for", forElement);

    return child;
};

// NFC input to Key:
export function convertInputToKey(inputValue) {
    return inputValue.replace(/[^a-fA-F0-9]/g, "");
}

export async function compressImage(file, maxWidth, quality) {
    return new Promise((resolve) => {
        const img = new Image();
        const url = URL.createObjectURL(file);

        img.onload = () => {
            const scale = Math.min(1, maxWidth / img.width);
            const canvas = document.createElement("canvas");
            canvas.width = img.width * scale;
            canvas.height = img.height * scale;

            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

            URL.revokeObjectURL(url);
            resolve(canvas.toDataURL("image/jpeg", quality));
        };

        img.src = url;
    });
}