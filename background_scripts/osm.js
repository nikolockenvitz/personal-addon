function rewriteOsmHeader(requestDetails) {
    let rewroteHeader = false;
    const ua = "Personal-OSM-Map/1.1 (+https://nikolockenvitz.de; contact: contact+osm@nikolockenvitz.de)";
    for (const header of requestDetails.requestHeaders) {
        if (header.name.toLowerCase() === "user-agent") {
            header.value = ua;
            rewroteHeader = true;
            break;
        }
    }
    if (!rewroteHeader) {
        requestDetails.requestHeaders.push({
            name: "User-Agent",
            value: ua,
        });
    }
    return {
        ...requestDetails,
        requestHeaders: requestDetails.requestHeaders,
    };
}

async function main() {
    // remove potential previous listeners
    browser.webRequest.onBeforeSendHeaders.removeListener(rewriteOsmHeader);

    const opt_extraInfoSpec = ["blocking", "requestHeaders"];
    browser.webRequest.onBeforeSendHeaders.addListener(rewriteOsmHeader, { urls: ["https://tile.openstreetmap.org/*"] }, opt_extraInfoSpec);
}
main();
