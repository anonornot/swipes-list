const {
    executeSlashCommandsWithOptions,
    saveSettingsDebounced,
} = SillyTavern.getContext();

const COOLDOWN_MS = 2000;
let lastPopulateTime = 0;

import { extension_settings } from '../../../extensions.js';
import { settings } from './settings.js';

const extensionName = "swipes-list";
const extensionFolderPath = `scripts/extensions/third-party/${extensionName}`;

async function populateSwipeDropdown(target) {
    const select = $(target);
    const now = Date.now();
    if (now - lastPopulateTime < COOLDOWN_MS) {
        console.log('Cooldown active, skipping populateSwipeDropdown');
        return;
    }
    lastPopulateTime = now;

    const mes = select.closest('.mes');
    if (!mes.length) {
        console.error('Could not find parent .mes for swipe dropdown');
        return;
    }
    const mesid = mes.attr('mesid');
    if (!mesid) {
        console.error('Could not retrieve mesid from parent .mes');
        return;
    }

    try {
        const countResult = await executeSlashCommandsWithOptions(`/swipes-count message=${mesid}`);
        const swipesCount = countResult.pipe;
        
        if (isNaN(swipesCount)) {
            console.error('Failed to get valid swipes count');
            return;
        }

        select.empty();

        select.append($('<option>', {
            value: -1,
            text: 'Select a swipe...'
        }));

        for (let i = 0; i < swipesCount; i++) {
            const swipeResult = await executeSlashCommandsWithOptions(`/swipes-get message=${mesid} ${i}`);
            const swipeText = swipeResult.pipe || swipeResult;

            let title = createSwipeTitle(swipeText);
            
            select.append($('<option>', {
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

function handleSwipeSelection(target) {
    const select = $(target);
    const selectedIndex = select.val();
    if (selectedIndex >= 0) {
        const mes = select.closest('.mes');
        if (!mes.length) {
            console.error('Could not find parent .mes for swipe selection');
            return;
        }
        const mesid = mes.attr('mesid');
        if (!mesid) {
            console.error('Could not retrieve mesid from parent .mes');
            return;
        }
        executeSlashCommandsWithOptions(`/swipes-go message=${mesid} ${selectedIndex}`);
    }
}

function toggleSwipes(checked, className) {
    const root = document.documentElement;
    root.style.setProperty(`--swipe-show-${className}`, checked ? 'flex' : 'none');
    root.style.setProperty(`--swipe-pad-${className}`, checked ? '35px' : '5px');
}

jQuery(async () => {
    try {
        const index = await $.get(`${extensionFolderPath}/index.html`);
        $(".swipeRightBlock").append(index);

        const swipeSettings = await $.get(`${extensionFolderPath}/swipeSettings.html`);
        $('[name="themeToggles"]').prepend(swipeSettings);

        $(document.body).on('change', '#swipes-list-select', function(e) { handleSwipeSelection(e.currentTarget); });
        $(document.body).on('click', '#swipes-list-select', function(e) { populateSwipeDropdown(e.currentTarget); });

        $(document.body).on('change', '#checkbox-firstmes', function() { toggleSwipes(this.checked, 'first'); settings.showFirst = this.checked; saveSettingsDebounced(); });
        $(document.body).on('change', '#checkbox-lastmes', function() { toggleSwipes(this.checked, 'last'); settings.showLast = this.checked; saveSettingsDebounced(); });
        $(document.body).on('change', '#checkbox-everymes', function() { toggleSwipes(this.checked, 'every'); settings.showEvery = this.checked; saveSettingsDebounced(); });

        toggleSwipes(settings.showFirst, 'first');
        document.getElementById('checkbox-firstmes').checked = settings.showFirst;

        toggleSwipes(settings.showLast, 'last');
        document.getElementById('checkbox-lastmes').checked = settings.showLast;

        toggleSwipes(settings.showEvery, 'every');
        document.getElementById('checkbox-everymes').checked = settings.showEvery;


    } catch (error) {
        console.error('Error initializing Swipe List extension:', error);
    }
});
