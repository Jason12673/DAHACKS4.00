// Global State Variables (Simulating a simple in-memory database)
let currentTab = 'skills';
let currentSkillDocId = null;
let currentDeleteAction = null; // For confirmation modal: 'skill', 'friend', 'group'

// Simulated Data Structure
let appData = {
    authUid: 'USER-12345-SKILLUP',
    userScore: 0,
    skills: {
        'skill-001': { title: 'Learn Python', desc: 'Complete Codecademy course.', stars: 4, logs: 5, totalProgress: 20 },
        'skill-002': { title: 'Financial Modeling', desc: 'Master valuation techniques in Excel.', stars: 5, logs: 2, totalProgress: 10 },
        'skill-003': { title: 'Meditation', desc: '10 mins daily via Headspace.', stars: 2, logs: 10, totalProgress: 20 },
    },
    friends: {
        'friend-a': { name: 'Alice Smith', appUid: 'FRIEND-A-789', score: 150 },
        'friend-b': { name: 'Bob Johnson', appUid: 'FRIEND-B-456', score: 300 },
        'friend-c': { name: 'Charlie Brown', appUid: 'FRIEND-C-101', score: 50 },
    },
    groups: {
        'group-x': { name: 'Book Club', memberIds: ['friend-a', 'friend-b'], creator: 'me' },
    },
    notifications: [
        { id: 1, type: 'progress', message: 'Alice Smith logged progress in Python.', timestamp: Date.now() - 3600000 },
        { id: 2, type: 'group', message: 'Bob Johnson joined the Book Club group.', timestamp: Date.now() - 7200000 },
    ],
    // Simulating a global leaderboard result
    globalLeaderboard: [
        { name: 'Global Pro 1', score: 1250, rank: 1 },
        { name: 'Global Pro 2', score: 1100, rank: 2 },
        { name: 'Global Pro 3', score: 950, rank: 3 },
    ]
};

// --- Initialisation & Core Functions ---

document.addEventListener('DOMContentLoaded', () => {
    // 1. Initial Data Load
    updateUserScore();
    document.getElementById('auth-uid').textContent = appData.authUid;
    document.getElementById('app-uid').textContent = appData.authUid;

    // 2. Initial View Render (Skills)
    switchTab(currentTab);
    
    // 3. Setup Modal Submission Handlers
    document.getElementById('add-form').addEventListener('submit', handleAddItem);
    document.getElementById('create-group-form').addEventListener('submit', handleCreateGroup);
    
    // 4. Initial Leaderboard Setup
    showLeaderboard('my-score');
    
    // 5. Update Notification Badge
    updateNotificationBadge();
});

function updateUserScore() {
    let totalScore = 0;
    for (const id in appData.skills) {
        const skill = appData.skills[id];
        // Score = SUM(Progress Logs × Difficulty Stars)
        totalScore += skill.totalProgress * skill.stars;
    }
    appData.userScore = totalScore;
    document.getElementById('user-score').textContent = `Score: ${totalScore}`;
    document.getElementById('stats-total-score').textContent = totalScore;
    document.getElementById('my-leaderboard-score').textContent = totalScore;
    document.getElementById('stats-skill-count').textContent = Object.keys(appData.skills).length;
    document.getElementById('stats-friend-count').textContent = Object.keys(appData.friends).length;
    document.getElementById('stats-group-count').textContent = Object.keys(appData.groups).length;
}

// --- Tab Switching ---

function switchTab(tabName) {
    currentTab = tabName;

    // 1. Update Tab Buttons (Visual)
    document.querySelectorAll('.nav-tab').forEach(btn => btn.classList.remove('active', 'text-blue-500'));
    document.getElementById(`tab-${tabName}`).classList.add('active', 'text-blue-500');

    // 2. Hide all content containers
    document.getElementById('grid-container').classList.add('hidden');
    document.getElementById('friends-list-container').classList.add('hidden');
    document.getElementById('groups-list-container').classList.add('hidden');
    document.getElementById('leaderboard-content').classList.add('hidden');
    
    // 3. Update 'Add New' button text/action (Simplified based on tab)
    const addBtn = document.getElementById('add-new-btn');
    if (tabName === 'skills') {
        document.getElementById('grid-container').classList.remove('hidden');
        renderSkills();
        addBtn.innerHTML = "<i class='bx bx-plus-circle mr-2'></i> Add New Skill";
        addBtn.onclick = () => openAddModal('skill');
    } else if (tabName === 'friends') {
        document.getElementById('friends-list-container').classList.remove('hidden');
        renderFriends();
        addBtn.innerHTML = "<i class='bx bx-user-plus mr-2'></i> Add New Friend";
        addBtn.onclick = () => openAddModal('friend');
    } else if (tabName === 'groups') {
        document.getElementById('groups-list-container').classList.remove('hidden');
        renderGroups();
        addBtn.innerHTML = "<i class='bx bx-plus-circle mr-2'></i> Add New Group";
        // The Groups tab already has a 'Create New Group' button, so we might hide the main one or make it redundant.
        addBtn.innerHTML = "<i class='bx bx-plus-circle mr-2'></i> Add New Group"; 
        addBtn.onclick = () => openPage('create-group-modal');
    } else if (tabName === 'leaderboard') {
        document.getElementById('leaderboard-content').classList.remove('hidden');
        renderLeaderboards();
        addBtn.innerHTML = "<i class='bx bx-stats mr-2'></i> View Your Stats";
        addBtn.onclick = () => openPage('stats-page');
    }
}

// --- Modal/Page Control ---

function openPage(pageId) {
    document.getElementById(pageId).classList.add('visible');
    // Hide main app content frame slightly to give focus to the modal
    document.getElementById('app').style.transform = 'scale(0.95)';
}

function closePage(pageId) {
    document.getElementById(pageId).classList.remove('visible');
    // Restore main app content frame
    document.getElementById('app').style.transform = 'scale(1)';
    // Reset specific forms/sections if needed
    if (pageId === 'add-new-modal') {
        document.getElementById('add-form-error').classList.add('hidden');
        document.getElementById('add-form').reset();
    }
}

// --- Skill Rendering ---

function renderSkills() {
    const container = document.getElementById('grid-container');
    container.innerHTML = '';
    
    for (const id in appData.skills) {
        const skill = appData.skills[id];
        const starsHtml = '★'.repeat(skill.stars);
        
        const card = document.createElement('div');
        card.className = 'card-base flex flex-col justify-between cursor-pointer';
        card.onclick = () => openSkillDetail(id);
        card.innerHTML = `
            <div>
                <div class="text-xl font-bold text-gray-800 truncate">${skill.title}</div>
                <div class="text-sm text-yellow-500 mb-2">${starsHtml}</div>
                <p class="text-gray-600 text-sm">${skill.desc}</p>
            </div>
            <div class="mt-4 flex items-center justify-between">
                <span class="text-xs text-gray-500">Logs: ${skill.logs}</span>
                <span class="text-sm font-semibold text-blue-500">Score: ${skill.totalProgress * skill.stars}</span>
            </div>
        `;
        container.appendChild(card);
    }
}

function openSkillDetail(skillId) {
    const skill = appData.skills[skillId];
    if (!skill) return;

    currentSkillDocId = skillId;
    
    document.getElementById('sd-title').textContent = skill.title;
    document.getElementById('sd-stars').innerHTML = '★'.repeat(skill.stars);
    document.getElementById('sd-desc').textContent = skill.desc;
    
    // Simulate log input and progress display
    document.getElementById('sd-progress').innerHTML = `
        <div class="bg-blue-50 p-4 rounded-lg flex justify-between items-center mb-4">
            <span class="text-lg font-bold text-blue-600">Total Score: ${skill.totalProgress * skill.stars}</span>
            <span class="text-sm text-gray-500">Total Logs: ${skill.logs}</span>
        </div>
        
        <div class="bg-white p-4 rounded-xl shadow-inner">
            <h4 class="font-bold mb-3 text-gray-800">Log Progress (Value * ${skill.stars} = Score)</h4>
            <input type="number" id="log-value" class="input-style mb-3" placeholder="Enter progress value (e.g., 1 hour)" min="1" value="1" required>
            <button class="btn-main w-full" onclick="logProgress()">Log It!</button>
        </div>
        
        <div class="text-sm text-gray-500 mt-4 text-center">
            Last logged: ${new Date().toLocaleDateString()}
        </div>
    `;

    openPage('skill-detail-page');
}

function logProgress() {
    const logValueInput = document.getElementById('log-value');
    const value = parseInt(logValueInput.value);
    
    if (value > 0 && currentSkillDocId) {
        const skill = appData.skills[currentSkillDocId];
        skill.logs += 1;
        skill.totalProgress += value;
        
        // Update data and refresh UI
        updateUserScore();
        openSkillDetail(currentSkillDocId); // Re-render the detail page
        renderSkills(); // Re-render the main skills list
        
        logValueInput.value = '1'; // Reset input
        alert(`Logged ${value} progress for ${skill.title}! Score increased by ${value * skill.stars}.`);
    } else {
        alert('Please enter a positive progress value.');
    }
}

// --- Friend Rendering ---

function renderFriends() {
    const container = document.getElementById('friends-list');
    const indexHeader = document.getElementById('alphabet-index-header');
    container.innerHTML = '';
    indexHeader.innerHTML = '';
    
    const friendArray = Object.values(appData.friends).sort((a, b) => a.name.localeCompare(b.name));
    if (friendArray.length === 0) {
        container.innerHTML = '<p class="text-center text-gray-500 p-4">You have no friends yet. Use the button below to add one!</p>';
        return;
    }

    let currentInitial = '';
    const initials = [];

    friendArray.forEach(friend => {
        const initial = friend.name[0].toUpperCase();
        if (initial !== currentInitial) {
            currentInitial = initial;
            initials.push(initial);
            
            // Add Alphabet Header
            const header = document.createElement('div');
            header.id = `friend-initial-${initial}`;
            header.className = 'font-bold text-lg text-blue-500 sticky top-16 bg-f4f7f9 z-10 pt-4 pb-2';
            header.textContent = initial;
            container.appendChild(header);
        }
        
        // Add Friend Card
        const card = document.createElement('div');
        card.className = 'card-base flex justify-between items-center';
        card.innerHTML = `
            <div class="flex items-center">
                <div class="user-avatar-top mr-3 bg-gray-500"><i class='bx bxs-user'></i></div>
                <div>
                    <div class="font-semibold text-lg">${friend.name}</div>
                    <div class="text-xs text-gray-500 font-mono">${friend.appUid}</div>
                </div>
            </div>
            <div class="text-right">
                <div class="text-xl font-bold text-green-500">${friend.score}</div>
                <div class="text-xs text-gray-400">Score</div>
            </div>
        `;
        container.appendChild(card);
    });

    // Render A-Z Index Header
    initials.forEach(initial => {
        const link = document.createElement('a');
        link.href = `#friend-initial-${initial}`;
        link.className = 'p-1 text-sm font-bold text-gray-600 hover:text-blue-500 transition-colors duration-200';
        link.textContent = initial;
        indexHeader.appendChild(link);
    });
}

// --- Group Rendering ---

function renderGroups() {
    const container = document.getElementById('groups-list');
    container.innerHTML = '';

    const groupArray = Object.values(appData.groups);
    if (groupArray.length === 0) {
        container.innerHTML = '<p class="text-center text-gray-500 p-4">You are not in any groups yet.</p>';
        return;
    }

    groupArray.forEach(group => {
        const memberCount = group.memberIds.length;
        
        const card = document.createElement('div');
        card.className = 'card-base flex justify-between items-center';
        card.onclick = () => openChatModal(group.name); // Re-use chat modal for groups
        card.innerHTML = `
            <div class="flex items-center">
                <div class="user-avatar-top mr-3 bg-indigo-500"><i class='bx bxs-group'></i></div>
                <div>
                    <div class="font-semibold text-lg">${group.name}</div>
                    <div class="text-sm text-gray-500">Members: ${memberCount + 1} (including you)</div>
                </div>
            </div>
            <div class="text-blue-500">
                <i class='bx bx-message-square-dots text-2xl'></i>
            </div>
        `;
        container.appendChild(card);
    });
}

// --- Add New Item (Skill/Friend) ---

function openAddModal(type) {
    const modalTitle = document.getElementById('add-modal-title');
    const skillFields = document.getElementById('skill-fields');

    if (type === 'skill') {
        modalTitle.textContent = 'Add New Skill';
        skillFields.classList.remove('hidden');
        document.getElementById('item-title').placeholder = 'e.g., Learn Python';
        document.getElementById('item-desc').placeholder = 'Describe the goal...';
    } else if (type === 'friend') {
        modalTitle.textContent = 'Add New Friend (by ID)';
        skillFields.classList.add('hidden');
        document.getElementById('item-title').placeholder = 'Friend\'s Name (Optional)';
        document.getElementById('item-desc').placeholder = 'Friend\'s App ID (required for real connection)';
    }

    openPage('add-new-modal');
}

function handleAddItem(event) {
    event.preventDefault();
    const title = document.getElementById('item-title').value.trim();
    const desc = document.getElementById('item-desc').value.trim();
    const errorMsg = document.getElementById('add-form-error');

    errorMsg.classList.add('hidden');

    if (currentTab === 'skills') {
        const stars = parseInt(document.getElementById('item-stars').value);
        if (!title || stars < 1 || stars > 5) {
            errorMsg.textContent = 'Please enter a title and a difficulty (1-5).';
            errorMsg.classList.remove('hidden');
            return;
        }
        
        const newId = `skill-${Date.now()}`;
        appData.skills[newId] = { title, desc, stars, logs: 0, totalProgress: 0 };
        updateUserScore();
        renderSkills();
        alert(`Skill "${title}" added successfully!`);

    } else if (currentTab === 'friends') {
        // For simplicity, we use the description field for a mock App ID/UID
        const friendId = desc; 
        if (!friendId) {
            errorMsg.textContent = 'Please enter the friend\'s unique App ID in the Description field.';
            errorMsg.classList.remove('hidden');
            return;
        }

        const newId = `friend-${Date.now()}`;
        const name = title || 'New Friend';
        appData.friends[newId] = { name: name, appUid: friendId, score: Math.floor(Math.random() * 500) };
        renderFriends();
        alert(`Friend "${name}" added successfully!`);
    }

    closePage('add-new-modal');
}

// --- Group Creation ---

function renderFriendCheckboxes() {
    const list = document.getElementById('friend-checkbox-list');
    list.innerHTML = '';
    
    const friendArray = Object.entries(appData.friends);

    if (friendArray.length === 0) {
        list.innerHTML = '<p class="text-sm text-gray-500">No friends added. Add friends in the \'Friends\' tab first.</p>';
        return;
    }

    friendArray.forEach(([id, friend]) => {
        const checkboxDiv = document.createElement('div');
        checkboxDiv.className = 'flex items-center';
        checkboxDiv.innerHTML = `
            <input type="checkbox" id="friend-cb-${id}" name="friend-cb" value="${id}" class="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500">
            <label for="friend-cb-${id}" class="ml-2 text-sm text-gray-700">${friend.name}</label>
        `;
        list.appendChild(checkboxDiv);
    });
}

function handleCreateGroup(event) {
    event.preventDefault();
    const groupName = document.getElementById('group-name').value.trim();
    const checkboxes = document.querySelectorAll('#friend-checkbox-list input[name="friend-cb"]:checked');
    const memberIds = Array.from(checkboxes).map(cb => cb.value);
    const errorMsg = document.getElementById('group-form-error');

    errorMsg.classList.add('hidden');
    
    if (!groupName) {
        errorMsg.textContent = 'Please enter a group name.';
        errorMsg.classList.remove('hidden');
        return;
    }

    if (memberIds.length === 0) {
        // We allow groups of just the creator for simplicity
        if (!confirm('You are creating a group with no other members. Continue?')) {
            return;
        }
    }

    const newId = `group-${Date.now()}`;
    appData.groups[newId] = { name: groupName, memberIds: memberIds, creator: appData.authUid };
    renderGroups();
    alert(`Group "${groupName}" created successfully!`);
    closePage('create-group-modal');
}

// --- Leaderboard ---

function showLeaderboard(view) {
    // 1. Update Tabs
    document.querySelectorAll('.lb-tab-btn').forEach(btn => {
        btn.classList.remove('active', 'border-blue-500');
        if (btn.dataset.view === view) {
            btn.classList.add('active', 'border-blue-500');
        }
    });

    // 2. Hide/Show Views
    document.querySelectorAll('.lb-view').forEach(v => v.classList.add('hidden'));
    document.getElementById(`lb-${view}`).classList.remove('hidden');
}

function renderLeaderboards() {
    // Note: My Score view is updated by updateUserScore()
    
    // Friends Leaderboard
    const friendsLbList = document.getElementById('friends-leaderboard-list');
    friendsLbList.innerHTML = '';
    const friendsArray = Object.values(appData.friends).sort((a, b) => b.score - a.score);

    if (friendsArray.length === 0) {
        document.getElementById('no-friends-for-lb').classList.remove('hidden');
    } else {
        document.getElementById('no-friends-for-lb').classList.add('hidden');
        friendsArray.forEach((friend, index) => {
            const rank = index + 1;
            const rankClass = rank <= 3 ? `rank-${rank}` : '';
            friendsLbList.innerHTML += `
                <div class="card-base leaderboard-item-card flex justify-between items-center ${rankClass}">
                    <div class="flex items-center">
                        <span class="text-xl font-bold mr-4 text-gray-700 w-6 text-center">${rank}</span>
                        <div class="user-avatar-top mr-3 bg-gray-500 text-sm"><i class='bx bxs-user'></i></div>
                        <div class="font-semibold">${friend.name}</div>
                    </div>
                    <div class="text-xl font-bold text-green-600">${friend.score}</div>
                </div>
            `;
        });
    }

    // Global Leaderboard
    const globalLbList = document.getElementById('global-leaderboard-list');
    globalLbList.innerHTML = '';
    
    // Self-Inject into Global List (as rank 4 for example)
    const globalListWithMe = [...appData.globalLeaderboard, { name: 'You (Me)', score: appData.userScore, rank: 4 }];
    globalListWithMe.sort((a, b) => b.score - a.score);

    globalListWithMe.forEach((user, index) => {
        const rank = index + 1;
        const rankClass = rank <= 3 ? `rank-${rank}` : (user.name.includes('You') ? 'border-blue-500' : '');
        const scoreColor = user.name.includes('You') ? 'text-blue-600' : 'text-purple-600';

        globalLbList.innerHTML += `
            <div class="card-base leaderboard-item-card flex justify-between items-center ${rankClass}">
                <div class="flex items-center">
                    <span class="text-xl font-bold mr-4 text-gray-700 w-6 text-center">${rank}</span>
                    <div class="user-avatar-top mr-3 ${user.name.includes('You') ? 'bg-blue-500' : 'bg-purple-500'} text-sm"><i class='bx bxs-user'></i></div>
                    <div class="font-semibold">${user.name}</div>
                </div>
                <div class="text-xl font-bold ${scoreColor}">${user.score}</div>
            </div>
        `;
    });
    
    document.getElementById('loading-global-lb').classList.add('hidden');
}


// --- Search Functionality ---

function handleSearch() {
    const query = document.getElementById('search-input').value.toLowerCase();
    
    // Only search in the current active tab's context
    if (currentTab === 'skills') {
        const skillCards = document.querySelectorAll('#grid-container > div');
        let found = false;
        skillCards.forEach(card => {
            const title = card.querySelector('.font-bold').textContent.toLowerCase();
            const desc = card.querySelector('p').textContent.toLowerCase();
            if (title.includes(query) || desc.includes(query)) {
                card.classList.remove('hidden');
                found = true;
            } else {
                card.classList.add('hidden');
            }
        });
        if (query === '' || found) {
            document.getElementById('no-result').classList.add('hidden');
        } else {
            document.getElementById('no-result').classList.remove('hidden');
        }
        
    } else if (currentTab === 'friends') {
        // A real search here would involve complex filtering and re-rendering,
        // but for a simple fix, we'll just alert that search is primarily for skills.
        if (query.length > 0) {
            alert('Search functionality is fully implemented only for the Skills tab in this demo. Friend search would require dynamic re-rendering.');
        }
    }
}


// --- Chat Functions ---

function openChatModal(chatTarget) {
    const chatTitle = document.getElementById('chat-title');
    const container = document.getElementById('chat-messages-container');
    container.innerHTML = '';
    
    if (chatTarget === 'community') {
        chatTitle.textContent = 'Global Community Chat';
        // Simulate community messages
        container.innerHTML += createChatMessage('System', 'Welcome to the global chat! Keep the discussion focused on skill tracking.', true);
    } else {
        chatTitle.textContent = `${chatTarget} Group Chat`;
        // Simulate group messages
        container.innerHTML += createChatMessage('System', `You are now in the ${chatTarget} chat.`, true);
    }
    
    // Simulate other messages
    container.innerHTML += createChatMessage('Friend-A', 'Just logged 3 hours of Python practice!', false);
    container.innerHTML += createChatMessage('Me', 'Great job! I need to log my financial modeling progress.', true);

    openPage('group-chat-modal');
    // Scroll to bottom
    container.scrollTop = container.scrollHeight;
    
    // Clear badge on opening community chat
    if (chatTarget === 'community') {
        document.getElementById('chat-notification-badge').classList.add('hidden');
    }
}

function createChatMessage(sender, message, isMe) {
    const alignment = isMe ? 'justify-end' : 'justify-start';
    const bubbleColor = isMe ? 'bg-blue-500 text-white' : 'bg-white text-gray-800 border';
    const senderText = isMe ? 'You' : sender;
    
    return `
        <div class="flex ${alignment}">
            <div class="max-w-xs md:max-w-md">
                <div class="text-xs text-gray-500 mb-1 ${isMe ? 'text-right' : 'text-left'}">${senderText}</div>
                <div class="p-3 rounded-xl ${bubbleColor} shadow">
                    ${message}
                </div>
            </div>
        </div>
    `;
}

function sendMessage() {
    const input = document.getElementById('chat-input');
    const message = input.value.trim();
    if (message === '') return;
    
    const container = document.getElementById('chat-messages-container');
    container.innerHTML += createChatMessage('Me', message, true);
    
    input.value = '';
    container.scrollTop = container.scrollHeight;
}

function checkChatEnter(event) {
    if (event.key === 'Enter') {
        sendMessage();
    }
}

// --- Notification Functions ---

function updateNotificationBadge() {
    const unreadCount = appData.notifications.length; // Assuming all are 'new' for simplicity
    const badge = document.getElementById('bell-notification-badge');
    
    if (unreadCount > 0) {
        badge.textContent = unreadCount;
        badge.classList.remove('hidden');
    } else {
        badge.classList.add('hidden');
    }
}

function openNotificationModal() {
    const list = document.getElementById('notification-list');
    list.innerHTML = '';
    
    if (appData.notifications.length === 0) {
        document.getElementById('no-notifications').classList.remove('hidden');
    } else {
        document.getElementById('no-notifications').classList.add('hidden');
        appData.notifications.forEach(notif => {
            const time = new Date(notif.timestamp).toLocaleTimeString();
            list.innerHTML += `
                <div class="bg-white p-4 rounded-xl shadow border-l-4 border-blue-400 flex justify-between items-center">
                    <p class="text-gray-700">${notif.message}</p>
                    <span class="text-xs text-gray-400 ml-3 flex-shrink-0">${time}</span>
                </div>
            `;
        });
    }

    openPage('notification-modal');
}

function clearNotifications() {
    // Clear data and refresh UI
    appData.notifications = [];
    updateNotificationBadge();
    openNotificationModal(); // Re-render the empty list
}

// --- Deletion Confirmation ---

function showConfirmationModal(docId, title, actionType = 'skill') {
    currentSkillDocId = docId; // Generic ID holder
    currentDeleteAction = actionType;
    
    document.getElementById('confirm-title').textContent = `Confirm Deletion`;
    document.getElementById('confirm-message').textContent = `Are you sure you want to permanently delete "${title}"? This cannot be undone.`;
    
    const confirmBtn = document.getElementById('confirm-action-btn');
    confirmBtn.onclick = executeDeletion;
    
    openPage('confirmation-modal');
}

function executeDeletion() {
    closePage('confirmation-modal');
    
    if (currentDeleteAction === 'skill' && currentSkillDocId) {
        const deletedTitle = appData.skills[currentSkillDocId].title;
        delete appData.skills[currentSkillDocId];
        updateUserScore();
        renderSkills();
        closePage('skill-detail-page');
        alert(`Skill "${deletedTitle}" deleted.`);
    } 
    // Add logic for friends/groups if needed
}

// Ensure friend checkboxes are rendered when the group modal is opened
document.getElementById('create-group-modal').addEventListener('click', (e) => {
    // Check if the modal itself is clicked (to avoid running on inner elements)
    if (e.target.id === 'create-group-modal' || e.target.querySelector('.back-circle') || e.target.id === 'tab-groups') {
        renderFriendCheckboxes();
    }
});