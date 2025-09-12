const {
    executeSlashCommandsWithOptions,
} = SillyTavern.getContext();

const COOLDOWN_MS = 2000; // 2 seconds; adjust as needed
let lastPopulateTime = 0; // Tracks the last successful execution time

import { extension_settings } from '../../../extensions.js';

const extensionName = "swipes-list";
const extensionFolderPath = `scripts/extensions/third-party/${extensionName}`;
const extensionSettings = extension_settings[extensionName];
const defaultSettings = {};

async function populateSwipeDropdown() {
    const now = Date.now();
    if (now - lastPopulateTime < COOLDOWN_MS) {
        console.log('Cooldown active, skipping populateSwipeDropdown');
        return;
    }
    lastPopulateTime = now; // Update timestamp only if we proceed

    try {
        const countResult = await executeSlashCommandsWithOptions('/swipes-count');
        const swipesCount = countResult.pipe;
        
        if (isNaN(swipesCount)) {
            console.error('Failed to get valid swipes count');
            return;
        }

        $('.last_mes #swipes-list-select').empty();

        $('.last_mes #swipes-list-select').append($('<option>', {
            value: -1,
            text: 'Select a swipe...'
        }));
        
        // Fetch each swipe and add to dropdown
        for (let i = 0; i < swipesCount; i++) {
            const swipeResult = await executeSlashCommandsWithOptions(`/swipes-get ${i}`);
            const swipeText = swipeResult.pipe || swipeResult;
            
            // Get a suitable title from the swipe text
            let title = createSwipeTitle(swipeText);
            
            $('.last_mes #swipes-list-select').append($('<option>', {
                value: i,
                text: `${i+1}: ${title}`
            }));
        }
    } catch (error) {
        console.error('Error populating swipe dropdown:', error);
    }
}

function createSwipeTitle(text) {
    if (!text) return "Empty swipe";
    
    const sentenceMatch = text.match(/^[^.!?]*[.!?]/);
    if (sentenceMatch && sentenceMatch[0].length <= 60) {
        return sentenceMatch[0].trim();
    }
    const maxLength = 50;
    if (text.length <= maxLength) return text;
    let truncated = text.substring(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');
    if (lastSpace > maxLength * 0.7) {
        truncated = truncated.substring(0, lastSpace);
    }
    
    return truncated.trim() + '...';
}

function handleSwipeSelection() {
    const selectedIndex = $('.last_mes #swipes-list-select').val();
    if (selectedIndex >= 0) {
        executeSlashCommandsWithOptions(`/swipes-go ${selectedIndex}`);
    }
}

jQuery(async () => {
    try {
        const htmlTemplate = await $.get(`${extensionFolderPath}/index.html`);
        $(".swipeRightBlock").append(htmlTemplate);

        $(document.body).on('change', '#swipes-list-select', handleSwipeSelection);
        $(document.body).on('click', '#swipes-list-select', populateSwipeDropdown);

    } catch (error) {
        console.error('Error initializing Swipe List extension:', error);
    }
});
