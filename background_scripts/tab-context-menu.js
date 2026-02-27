// Get a meaningful name for a window
async function getWindowName(tabs) {
    // Look for nikolockenvitz.de/m/?m= tabs
    const messageTabs = tabs.filter(tab =>
        tab.url && tab.url.match(/^https?:\/\/nikolockenvitz\.de\/m\/\?.*m=/i)
    );

    if (messageTabs.length > 0) {
        // Use the first matching tab's title
        const messageTab = messageTabs[0];
        if (messageTab.title) {
            return messageTab.title;
        }

        // Fallback: extract m parameter from URL
        const url = new URL(messageTab.url);
        const mParam = url.searchParams.get('m');
        if (mParam) {
            return mParam.replace(/-/g, ' ');
        }
    }

    // Fallback: use first tab's title + tab count
    const tabCount = tabs.length;
    const firstTabTitle = tabs[0]?.title || 'Untitled';
    const truncatedTitle = firstTabTitle.length > 30
        ? firstTabTitle.substring(0, 30) + '...'
        : firstTabTitle;

    return `${truncatedTitle} (${tabCount} tab${tabCount !== 1 ? 's' : ''})`;
}

// Build window submenu items
async function updateWindowSubmenu(currentWindowId) {
    // Remove existing submenu items
    await browser.menus.removeAll();

    // Create parent menu with icon
    browser.menus.create({
        id: "move-tab-to-window",
        title: "Move Tab to Window",
        contexts: ["tab"],
        icons: {
            "16": "icons/personal-addon-48.png"
        }
    });

    // Get all windows and their tabs
    const windows = await browser.windows.getAll({ populate: true });

    // Create submenu items for each window
    for (const window of windows) {
        const windowName = await getWindowName(window.tabs);
        const isCurrentWindow = currentWindowId && window.id === currentWindowId;

        browser.menus.create({
            id: `move-to-window-${window.id}`,
            parentId: "move-tab-to-window",
            title: windowName,
            contexts: ["tab"],
            enabled: !isCurrentWindow
        });
    }

    await browser.menus.refresh();
}

// Handle context menu clicks
browser.menus.onClicked.addListener(async (info, tab) => {
    if (info.menuItemId.startsWith("move-to-window-")) {
        const targetWindowId = parseInt(info.menuItemId.replace("move-to-window-", ""));

        // Get all highlighted (selected) tabs in the current window
        const highlightedTabs = await browser.tabs.query({
            windowId: tab.windowId,
            highlighted: true
        });

        // Find the active tab among highlighted tabs
        const activeHighlightedTab = highlightedTabs.find(t => t.active);

        // If we're moving the active tab, activate the nikolockenvitz.de/m tab first
        if (activeHighlightedTab) {
            // Get all tabs in the source window
            const allSourceTabs = await browser.tabs.query({ windowId: tab.windowId });

            // Find the nikolockenvitz.de/m tab that's NOT being moved
            const messageTab = allSourceTabs.find(t =>
                !highlightedTabs.some(ht => ht.id === t.id) && // Not in the tabs being moved
                t.url && t.url.match(/^https?:\/\/nikolockenvitz\.de\/m\/\?.*m=/i)
            );

            // Activate the message tab before moving
            if (messageTab) {
                await browser.tabs.update(messageTab.id, { active: true });
            }
        }

        let movedActiveTab = null;

        // Move each highlighted tab to the target window
        for (const highlightedTab of highlightedTabs) {
            const movedTab = await browser.tabs.move(highlightedTab.id, {
                windowId: targetWindowId,
                index: -1 // -1 means end of the window
            });

            // Track the moved tab if it was the active one
            if (highlightedTab.active) {
                movedActiveTab = Array.isArray(movedTab) ? movedTab[0] : movedTab;
            }
        }

        // Focus the moved active tab in the new window
        if (activeHighlightedTab && movedActiveTab) {
            await browser.tabs.update(movedActiveTab.id, { active: true });
            await browser.windows.update(targetWindowId, { focused: true });
        }
    }
});

// Update submenu when windows or tabs change
browser.windows.onCreated.addListener(() => updateWindowSubmenu());
browser.windows.onRemoved.addListener(() => updateWindowSubmenu());
browser.tabs.onCreated.addListener(() => updateWindowSubmenu());
browser.tabs.onRemoved.addListener(() => updateWindowSubmenu());
browser.tabs.onUpdated.addListener((_tabId, changeInfo) => {
    // Only update if title or URL changed
    if (changeInfo.title || changeInfo.url) {
        updateWindowSubmenu();
    }
});
browser.tabs.onAttached.addListener(() => updateWindowSubmenu());
browser.tabs.onDetached.addListener(() => updateWindowSubmenu());

// Update menu when it's shown to reflect current window
browser.menus.onShown.addListener(async (info, tab) => {
    // info.viewType is "tab" when clicking on tab bar
    if (tab && tab.windowId) {
        await updateWindowSubmenu(tab.windowId);
    } else if (info.targetElementId) {
        try {
            const clickedTab = await browser.tabs.get(info.targetElementId);
            await updateWindowSubmenu(clickedTab.windowId);
        } catch (e) {
            console.error("Could not get tab for context menu:", e);
            await updateWindowSubmenu();
        }
    } else {
        await updateWindowSubmenu();
    }
});

// Initial menu setup
updateWindowSubmenu();
