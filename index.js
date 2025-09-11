const {
    executeSlashCommandsWithOptions,
} = SillyTavern.getContext();

import { extension_settings } from '../../../extensions.js';

const extensionName = "swipes-list";
const extensionFolderPath = `scripts/extensions/third-party/${extensionName}`;
const extensionSettings = extension_settings[extensionName];
const defaultSettings = {};

async function populateSwipeDropdown() {
    try {
        const countResult = await executeSlashCommandsWithOptions('/swipes-count');
        const swipesCount = countResult.pipe;
        
        if (isNaN(swipesCount)) {
            console.error('Failed to get valid swipes count');
            return;
        }

        $('#swipes-list-select').empty();

        $('#swipes-list-select').append($('<option>', {
            value: -1,
            text: 'Select a swipe...'
        }));
        
        // Fetch each swipe and add to dropdown
        for (let i = 0; i < swipesCount; i++) {
            const swipeResult = await executeSlashCommandsWithOptions(`/swipes-get ${i}`);
            const swipeText = swipeResult.pipe || swipeResult;
            
            // Get a suitable title from the swipe text
            let title = createSwipeTitle(swipeText);
            
            $('#swipes-list-select').append($('<option>', {
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
    const selectedIndex = $('#swipes-list-select').val();
    if (selectedIndex >= 0) {
        executeSlashCommandsWithOptions(`/swipes-go ${selectedIndex}`);
    }
}

function hide(){
    var box = document.querySelector("#swipes-list-toggle");
    if (box.style.animationName == "hide") { box.style.animationName = "show"; box.classList.remove("show"); }
    else { box.style.animationName = "hide"; box.classList.add("show"); }
}

jQuery(async () => {
    try {
        const htmlTemplate = await $.get(`${extensionFolderPath}/index.html`);
        $("body").append(htmlTemplate);

        $('#swipes-list-select').on('change', handleSwipeSelection);
        $('#swipes-list-refresh').on('click', populateSwipeDropdown);
        $('#swipes-list-hide').on('click', hide);

    } catch (error) {
        console.error('Error initializing Swipe List extension:', error);
    }
});

