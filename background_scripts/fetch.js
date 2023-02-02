browser.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.contentScriptQuery === "fetchJson") {
        return fetchJson(...request.args);
    }
});

function fetchJson(...args) {
    return new Promise(async function (resolve) {
        try {
            const json = await (await fetch(...args)).json();
            return resolve(json);
        } catch (error) {
            console.error(error);
            resolve({});
        }
    });
}
