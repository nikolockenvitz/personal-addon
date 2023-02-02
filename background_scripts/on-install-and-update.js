function handleInstalled(details) {
    if (details.reason === "install") {
        browser.tabs.create({
            url: "/pages/installed.html",
        });
    } else if (details.reason === "update") {
        browser.tabs.create({
            url: "/pages/updated.html",
        });
    }
}

browser.runtime.onInstalled.addListener(handleInstalled);
