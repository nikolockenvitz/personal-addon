function handleInstalled(details) {
    console.log("handling install event", details);
    console.log("current version", browser.runtime.getManifest().version);
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
