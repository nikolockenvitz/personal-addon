const apiPath = "/api/externalId/yt/next";

function fetchJson(...args) {
    return new Promise(function (resolve) {
        execAsync(
            browser.runtime.sendMessage.bind(browser.runtime),
            {
                contentScriptQuery: "fetchJson",
                args,
            },
            (json) => {
                resolve(json);
            }
        );
    });
}

async function sendPost(json, path = "/api/song") {
    return fetchJson(`http://localhost:3000${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(json),
    });
}

async function sendDataForSongAndOpenNext(obj) {
    const data = await sendPost(obj, apiPath);
    console.log(obj, data);
    const searchString = encodeURIComponent(
        data.song.title +
            data.song.artists.reduce((artists, artist) => artists + " " + artist.name, "") +
            ' -"songId:' +
            data.song.songId +
            '"'
    );
    const url = "https://music.youtube.com/search?q=" + searchString;
    console.log(url);
    window.open(url, "_blank");
    close();
}

function getSongIdFromSearch() {
    const search = decodeURIComponent(url.search);
    if (search.match(/-"songId:\d+\"$/)) {
        const songId = search.split('-"songId:')[1].split('"')[0];
        return Number(songId);
    }
    return null;
}

async function main() {
    const songId = getSongIdFromSearch();
    if (songId === null) return;
    executeFunctionAfterPageLoaded(() => {
        const links = document.querySelectorAll("ytmusic-responsive-list-item-renderer div.title-column yt-formatted-string a");
        if (links.length === 0) {
            setTimeout(main, 500);
            return;
        }
        for (const link of links) {
            try {
                const videoId = link.href.split("&")[0].split("watch?v=")[1];
                const ytfStr = link.parentNode;
                const div = ytfStr.parentNode;
                const btn = document.createElement("button");
                btn.textContent = "Save";
                btn.onclick = () => {
                    sendDataForSongAndOpenNext({ songId, youtubeId: videoId });
                };
                div.insertBefore(btn, ytfStr);
                div.style = "justify-content: flex-start;";
                ytfStr.style = "position: relative; left: 1em;";
            } catch {}
        }
        const chips = document.getElementById("chips");
        const firstChip = chips.childNodes[0];
        const btnIgnore = document.createElement("button");
        btnIgnore.textContent = "Ignore";
        btnIgnore.onclick = () => {
            sendDataForSongAndOpenNext({ songId, youtubeId: "" });
        };
        const btnSkip = document.createElement("button");
        btnSkip.textContent = "Skip";
        btnSkip.onclick = () => {
            sendDataForSongAndOpenNext({ skip: true });
        };
        chips.insertBefore(btnIgnore, firstChip);
        chips.insertBefore(btnSkip, firstChip);
    });
}
main();
