const {
    executeSlashCommandsWithOptions,
} = SillyTavern.getContext();

import { extension_settings } from '../../../extensions.js';

const extensionName = "greeting-list";
const extensionFolderPath = `scripts/extensions/third-party/${extensionName}`;
const extensionSettings = extension_settings[extensionName];
const defaultSettings = {};

async function populateGreetingsDropdown() {
    try {
        const countResult = await executeSlashCommandsWithOptions('/swipes-count');
        const swipesCount = countResult.pipe;
        
        if (isNaN(swipesCount)) {
            console.error('Failed to get valid swipes count');
            return;
        }

        $('#greeting-list-select').empty();

        $('#greeting-list-select').append($('<option>', {
            value: -1,
            text: 'Select a greeting...'
        }));
        
        // Fetch each greeting and add to dropdown
        for (let i = 0; i < swipesCount; i++) {
            const greetingResult = await executeSlashCommandsWithOptions(`/swipes-get ${i}`);
            const greetingText = greetingResult.pipe || greetingResult;
            
            // Get a suitable title from the greeting text
            let title = createGreetingTitle(greetingText);
            
            $('#greeting-list-select').append($('<option>', {
                value: i,
                text: `${i+1}: ${title}`
            }));
        }
    } catch (error) {
        console.error('Error populating greetings dropdown:', error);
    }
}

function createGreetingTitle(text) {
    if (!text) return "Empty greeting";
    
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

function handleGreetingSelection() {
    const selectedIndex = $('#greeting-list-select').val();
    if (selectedIndex >= 0) {
        executeSlashCommandsWithOptions(`/swipes-go ${selectedIndex}`);
    }
}

function hide(){
    var box = document.querySelector("#greeting-list-toggle");
    if (box.style.animationName == "hide") { box.style.animationName = "show"; box.classList.remove("show"); }
    else { box.style.animationName = "hide"; box.classList.add("show"); }
}

jQuery(async () => {
    try {
        const htmlTemplate = await $.get(`${extensionFolderPath}/index.html`);
        $("body").append(htmlTemplate);

        $('#greeting-list-select').on('change', handleGreetingSelection);
        $('#greeting-list-refresh').on('click', populateGreetingsDropdown);
        $('#greeting-list-hide').on('click', hide);

    } catch (error) {
        console.error('Error initializing Greeting List extension:', error);
    }
});

