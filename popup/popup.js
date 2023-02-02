const inputIds = [];
const buttonInputIds = ["tabs-copy-urls", "open-urls-clipboard", "test-get-permissions", "test-grant-optional-permissions"];
const configInputIds = [];

let options = {};
let config = {};

window.onload = async function () {
    //[options, config] = await Promise.all([loadFromStorage("options"), loadFromStorage("config")]);

    for (const inputId of inputIds) {
        toggleInputOnSectionTextClick(inputId); // sectionText includes also the input itself
    }
    for (const inputId of buttonInputIds) {
        addOnClickListenerForButton(inputId);
    }
    initInputs();
    initModals();
    for (const configInputId of configInputIds) {
        initConfigInput(configInputId);
    }

    addEventListenersToClosePopupOnLinkClicks();
};

async function onChangeInput(inputId) {
    options[inputId] = document.getElementById(inputId).checked;
    updateDependingInputs(inputId);
    await saveOptionsToStorage();
    runMainFunctionOfContentAndBackgroundScripts();
}

function runMainFunctionOfContentAndBackgroundScripts() {
    execAsync(browser.tabs.query, { currentWindow: true, active: true }, (tabs) => {
        for (const tab of tabs) {
            // connect will trigger main function of content scripts
            browser.tabs.connect(tab.id).disconnect();
        }
    });
    execAsync(browser.runtime.getBackgroundPage, undefined, (backgroundWindow) => {
        backgroundWindow.main();
    });
}

function toggleInputOnSectionTextClick(inputId) {
    const inputEl = document.getElementById(inputId);
    const sectionText = getSectionTextParent(inputEl);
    if (sectionText) {
        sectionText.addEventListener("click", function (event) {
            if (!inputEl.disabled) {
                inputEl.checked = !inputEl.checked;
                if (!event.target.classList.contains("slider")) {
                    /* click on slider creates two onclick events, so we
                     * can ignore the click on the slider and just use the
                     * click on the input
                     */
                    onChangeInput(inputId);
                }
            }
        });
    }
}

function updateDependingInputs(inputId) {
    /* some inputs depend on others
     * -> disable them if the input they depend on is unchecked
     * -> enable them if the input they depend on is checked
     *
     * the attribute 'data-depending-inputs' contains the ids
     * of all depending inputs (separated with a space)
     */
    const input = document.getElementById(inputId);
    if (input.hasAttribute("data-depending-inputs")) {
        for (const depId of input.getAttribute("data-depending-inputs").split(" ")) {
            const dependingInput = document.getElementById(depId);
            const sectionText = getSectionTextParent(dependingInput);
            if (input.checked) {
                dependingInput.disabled = false;
                if (sectionText) {
                    sectionText.classList.remove("disabled");
                }
            } else {
                dependingInput.disabled = true;
                if (sectionText) {
                    sectionText.classList.add("disabled");
                }
            }
        }
    }
}

function getSectionTextParent(element) {
    while (element) {
        if (element.classList.contains("section-text")) {
            return element;
        }
        element = element.parentElement;
    }
    return null;
}

function addOnClickListenerForButton(buttonInputId) {
    const button = document.getElementById(buttonInputId);
    button.addEventListener("mousedown", function (event) {
        if (event.buttons === 1) {
            button.classList.add("button-active");
        }
    });
    button.addEventListener("click", function () {
        button.classList.remove("button-active");

        if (buttonInputId === "tabs-copy-urls") {
            copyTabUrls();
        } else if (buttonInputId === "open-urls-clipboard") {
            openURLsFromClipboard();
        } else if (buttonInputId === "test-get-permissions") {
            console.log("button pressed :D");
            execAsync(browser.permissions.getAll, [], (r) => {
                console.log("get all", r);
            });
        } else if (buttonInputId === "test-grant-optional-permissions") {
            execAsync(browser.permissions.request, { origins: ["https://nikolockenvitz.de/*", "https://github.com/*"] }, (r) => {
                console.log("requested,", r);
                // register content scripts
            });
            return;
        }

        // send message (buttonInputId) to content script(s)
        execAsync(browser.tabs.query, { currentWindow: true, active: true }, (tabs) => {
            for (const tab of tabs) {
                browser.tabs.sendMessage(tab.id, { message: buttonInputId });
            }
        });
    });
}

function saveOptionsToStorage() {
    return; // saveToStorage("options", options);
}

function saveConfigToStorage() {
    return; // saveToStorage("config", config);
}

function initInputs() {
    for (const inputId of inputIds) {
        document.getElementById(inputId).checked = !options || options[inputId] !== false;
        updateDependingInputs(inputId);
    }
}

function initModals() {
    const configurationModal = document.getElementById("modal-configuration");
    document.getElementById("btn-show-configuration").addEventListener("click", function () {
        configurationModal.style.display = "block";
    });
    document.getElementById("btn-hide-configuration").addEventListener("click", function () {
        configurationModal.classList.add("hide");
        setTimeout(function () {
            configurationModal.style.display = "none";
            configurationModal.classList.remove("hide");
        }, 400); // needs to be equal to what is specified in css animation
    });
}

function initConfigInput(inputId) {
    const el = document.getElementById(inputId);
    el.value = config[inputId] || "";
    el.addEventListener("change", async function () {
        // change will only fire after input loses focus (-> not on every keystroke)
        config[inputId] = el.value;
        await saveConfigToStorage();
        runMainFunctionOfContentAndBackgroundScripts();
    });
}

function addEventListenersToClosePopupOnLinkClicks() {
    let links = document.getElementsByClassName("external-link");
    for (const el of links) {
        el.addEventListener("click", function () {
            execAsync(browser.tabs.create, { url: el.title }, () => {
                window.close();
            });
        });
    }
}

function copyTabUrls() {
    let urls = "";
    execAsync(browser.tabs.query, { currentWindow: true }, (tabs) => {
        const numberOfHighlightedTabs = tabs.reduce((sum, tab) => sum + (tab.highlighted ? 1 : 0), 0);
        const copyOnlyUrlOfHighlightedTabs = numberOfHighlightedTabs > 1;
        for (const tab of tabs) {
            if (tab.highlighted || !copyOnlyUrlOfHighlightedTabs) {
                urls += `${tab.url}\n`;
            }
        }
        navigator.clipboard.writeText(urls);
    });
}

async function openURLsFromClipboard() {
    const clipText = await navigator.clipboard.readText();
    const urls = clipText.split("\n");
    for (const url of urls) {
        if (url) {
            execAsync(browser.tabs.create, { url }, () => {});
        }
    }
    window.close();
}
