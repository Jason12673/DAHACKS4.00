
        import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
        import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
        // 导入新的 Firestore 查询函数：getDoc, query, orderBy, limit, where
        import { getFirestore, doc, setDoc, addDoc, onSnapshot, collection, query, updateDoc, deleteDoc, getDocs, getDoc, orderBy, limit, where } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
        import { setLogLevel } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

        // --- Gemini API Constants ---
        const API_KEY = ""; // Canvas will automatically provide the key at runtime
        const BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models/";
        const MODEL_NAME = "gemini-2.5-flash-preview-09-2025";
        const AI_SENDER_ID = 'AI_BOT'; // Unique ID for AI responses
        const LOGS_PER_STAR_MILESTONE = 10; // New constant for clear goal setting

        // Global Firebase Variables (Provided by Canvas Environment)
        const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
        const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
        const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

        // Firebase Service Instances
        let app, db, auth;
        let userId = null;
        let isAuthReady = false;
        
        // Local Data Stores
        let skillsData = [];
        let peopleData = [];
        let groupsData = []; 
        let chatMessages = []; 
        let totalScore = 0;
        let currentTab = 'skills';
        let currentSkillDocId = null; 
        let currentChatMode = 'community'; 
        let currentGroupId = null; 
        let unseenNotifications = []; // NEW: Local store for system notifications
        
        let unsubscribeCurrentChat = null; 
        let unsubscribeCommunityChat = null; 
        
        const FULL_ALPHABET = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i)).concat(['#']);


        // --- Utility Functions ---

        /**
         * Retries a promise function with exponential backoff.
         * @param {Function} fn The function to execute.
         * @param {number} maxRetries Maximum number of retries.
         * @param {number} delay Initial delay in ms.
         * @returns {Promise<any>}
         */
        async function retryWithBackoff(fn, maxRetries = 3, delay = 1000) {
            for (let i = 0; i < maxRetries; i++) {
                try {
                    return await fn();
                } catch (error) {
                    if (i === maxRetries - 1) throw error;
                    await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
                }
            }
        }


        // --- Gemini AI Interaction ---

        /**
         * Calls the Gemini API to generate a response and saves it to Firestore.
         * @param {string} userPrompt The user's message text.
         */
        async function generateAIResponse(userPrompt) {
            const apiUrl = `${BASE_URL}${MODEL_NAME}:generateContent?key=${API_KEY}`;
            
            const systemPrompt = "You are a friendly assistant for skill learning and personal growth. You MUST respond to user's queries in English. Keep your responses short, natural, and encouraging, like a real friend or coach.";

            const payload = {
                contents: [{ parts: [{ text: userPrompt }] }],
                systemInstruction: { parts: [{ text: systemPrompt }] },
                tools: [{ "google_search": {} }],
            };

            try {
                await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));
                
                const response = await retryWithBackoff(async () => {
                    const res = await fetch(apiUrl, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });
                    if (!res.ok) throw new Error(`API response error: ${res.statusText}`);
                    return res;
                });

                const result = await response.json();
                const aiText = result.candidates?.[0]?.content?.parts?.[0]?.text || "Sorry, I can't answer that right now.";
                
                const communityChatPath = getPublicCollectionPath('chat_messages');
                if (communityChatPath) {
                     const aiMessage = {
                        senderId: AI_SENDER_ID,
                        senderShortId: 'AI Assistant',
                        message: aiText,
                        timestamp: new Date().toISOString(),
                        status: 'delivered', 
                    };
                    await addDoc(collection(db, communityChatPath), aiMessage);
                }

            } catch (e) {
                console.error("Error generating AI response:", e);
            }
        }

        // --- Firebase Initialization and Authentication ---

        function initFirebase() {
            // setLogLevel('Debug'); // Uncomment for debugging
            try {
                app = initializeApp(firebaseConfig);
                auth = getAuth(app);
                db = getFirestore(app);

                onAuthStateChanged(auth, async (user) => {
                    if (user) {
                        userId = user.uid;
                        isAuthReady = true;
                        console.log("Firebase Auth Success. User ID:", userId);
                        document.getElementById('uid-display').innerText = `User ID: ${userId.substring(0, 8)}...`;
                        document.getElementById('app-uid').innerText = appId;
                        document.getElementById('auth-uid').innerText = userId;
                        
                        await checkAndCreateDefaults();
                        setupFirestoreListeners();
                        switchTab('skills');
                    } else {
                        if (initialAuthToken) {
                            await signInWithCustomToken(auth, initialAuthToken);
                        } else {
                            await signInAnonymously(auth);
                        }
                    }
                });
            } catch (error) {
                console.error("Firebase initialization failed:", error);
                document.getElementById('uid-display').innerText = `Error: ${error.message}`;
            }
        }

        // --- Firestore Path Helpers ---
        function getUserCollectionPath(collectionName) {
            if (!userId) return null;
            return `artifacts/${appId}/users/${userId}/${collectionName}`;
        }
        
        function getPublicCollectionPath(collectionName) {
            return `artifacts/${appId}/public/data/${collectionName}`;
        }
        
        function getChatCollectionPath(mode, groupId) {
            if (!isAuthReady || !userId) return null;

            if (mode === 'community') {
                return getPublicCollectionPath('chat_messages');
            } else if (mode === 'group' && groupId) {
                return `${getUserCollectionPath('private_groups')}/${groupId}/messages`;
            }
            return null;
        }
        
        /**
         * Updates the user's total score in the public collection.
         * This score is used for global and friend leaderboards.
         * @param {number} score The calculated total score.
         */
        async function updatePublicScore(score) {
            if (!isAuthReady || !userId) return;
            const path = getPublicCollectionPath('user_scores');
            if (!path) return;

            const userRef = doc(db, path, userId);
            const userShortId = userId.substring(0, 8); 

            const scoreData = {
                userId: userId,
                userShortId: userShortId,
                totalScore: score,
                lastUpdated: new Date().toISOString(),
                // Name is kept simple/anonymous using userShortId
            };

            try {
                await setDoc(userRef, scoreData, { merge: true });
                console.log(`Public score updated to ${score.toFixed(0)}.`);
            } catch (e) {
                console.error("Error updating public score: ", e);
            }
        }


        /**
         * Checks if a skill has crossed a milestone (multiple of 10 logs)
         * and returns a notification object if it has.
         */
        function checkForMilestone(skill) {
            const currentProgress = skill.progress || 0;
            const lastMilestone = skill.lastMilestone || 0;
            
            // Calculate the current completed milestone level (e.g., 23 logs -> 20)
            const currentLevel = Math.floor(currentProgress / LOGS_PER_STAR_MILESTONE) * LOGS_PER_STAR_MILESTONE;
            const lastLevel = Math.floor(lastMilestone / LOGS_PER_STAR_MILESTONE) * LOGS_PER_STAR_MILESTONE;
            
            if (currentLevel > lastLevel && currentLevel > 0) {
                const notification = {
                    id: crypto.randomUUID(),
                    message: `Congratulations! You hit a ${currentLevel}-log milestone for "${skill.title}"! Keep up the great work!`,
                    type: 'skill_milestone',
                    timestamp: new Date().toISOString(),
                    skillId: skill.id,
                };
                
                // Return notification and the new milestone value
                return { notification, newMilestone: currentLevel };
            }
            return null;
        }

        function setupFirestoreListeners() {
            if (!isAuthReady || !userId) return;

            // 1. Skills Listener (Private)
            onSnapshot(collection(db, getUserCollectionPath('skills')), async (snapshot) => {
                skillsData = [];
                let score = 0;
                let updates = []; // Array to hold Firestore update promises
                
                snapshot.forEach(doc => {
                    const data = doc.data();
                    data.id = doc.id; 
                    skillsData.push(data);
                    score += (data.progress || 0) * (data.stars || 1); 
                    
                    // Check for milestones and create/update notifications
                    const milestoneResult = checkForMilestone(data);
                    if (milestoneResult) {
                        unseenNotifications.push(milestoneResult.notification);
                        // Prepare update to save new milestone level to Firestore
                        const skillRef = doc(db, getUserCollectionPath('skills'), doc.id);
                        updates.push(updateDoc(skillRef, { lastMilestone: milestoneResult.newMilestone }));
                    }
                });
                
                // Execute all Firestore updates concurrently
                if (updates.length > 0) {
                    await Promise.all(updates).catch(e => console.error("Error updating skill milestones:", e));
                }
                
                totalScore = score;
                
                // --- NEW: Update public score after calculation ---
                await updatePublicScore(totalScore);

                updateUI();
            }, (error) => {
                console.error("Error reading skills:", error);
            });

            // 2. People Listener (Friends - Private)
            onSnapshot(collection(db, getUserCollectionPath('people')), (snapshot) => {
                peopleData = [];
                snapshot.forEach(doc => {
                    const data = doc.data();
                    data.id = doc.id; 
                    peopleData.push(data);
                });
                updateUI();
                populateGroupFriendList(); 
            }, (error) => {
                console.error("Error reading people:", error);
            });
            
            // 3. Groups Listener (Private)
            onSnapshot(collection(db, getUserCollectionPath('private_groups')), (snapshot) => {
                groupsData = [];
                snapshot.forEach(doc => {
                    const data = doc.data();
                    data.id = doc.id; 
                    groupsData.push(data);
                });
                updateUI();
            }, (error) => {
                console.error("Error reading groups:", error);
            });
            
            // 4. Community Chat Listener (Always active for badge tracking)
            const communityPath = getPublicCollectionPath('chat_messages');
            if (communityPath) {
                 unsubscribeCommunityChat = onSnapshot(collection(db, communityPath), (snapshot) => {
                    let newMessages = [];
                    snapshot.forEach(doc => {
                        const data = doc.data();
                        data.id = doc.id;
                        newMessages.push({ ...data, docId: doc.id });
                    });
                    newMessages.sort((a, b) => (a.timestamp > b.timestamp) ? 1 : -1);
                    
                    chatMessages = newMessages;

                    // If currently viewing the community chat, render
                    if (currentChatMode === 'community' && document.getElementById('group-chat-modal').classList.contains('open')) {
                         renderChatMessages();
                    } 
                    updateNotificationBadge();
                 }, (error) => {
                    console.error("Error reading community chat:", error);
                 });
            }
        }
        
        /**
         * Sets up the listener for the currently selected chat (community or group).
         */
        function setupChatListener(mode, groupId) {
            // Unsubscribe from previous group chat listener
            if (unsubscribeCurrentChat) {
                unsubscribeCurrentChat();
                unsubscribeCurrentChat = null;
            }
            
            currentChatMode = mode;
            currentGroupId = groupId;
            const chatPath = getChatCollectionPath(mode, groupId);
            
            if (!chatPath) {
                chatMessages = [];
                renderChatMessages();
                return;
            }

            // Community chat data is handled by the permanent unsubscribeCommunityChat listener
            if (mode === 'community') {
                updateMessageStatusesToRead(); 
                return; 
            }

            // Set up listener for private groups
            if (mode === 'group') {
                unsubscribeCurrentChat = onSnapshot(collection(db, chatPath), (snapshot) => {
                    chatMessages = [];
                    snapshot.forEach(doc => {
                        const data = doc.data();
                        data.id = doc.id;
                        chatMessages.push({ ...data, docId: doc.id });
                    });
                    chatMessages.sort((a, b) => (a.timestamp > b.timestamp) ? 1 : -1);
                    renderChatMessages();
                }, (error) => {
                    console.error(`Error reading group chat messages:`, error);
                });
            }
        }
        
        /**
         * Updates the status of all currently 'delivered' messages in the community chat to 'read'.
         */
        async function updateMessageStatusesToRead() {
            if (!isAuthReady || !userId) return;
            
            const chatPath = getPublicCollectionPath('chat_messages');
            if (!chatPath) return;

            const updates = [];

            // Find messages sent by others that are currently 'delivered'
            chatMessages.forEach(msg => {
                // Only mark as read if it's NOT the current user AND it's a message from a real person (not AI)
                if (msg.senderId !== userId && msg.status === 'delivered' && msg.senderId !== AI_SENDER_ID) {
                    const messageRef = doc(db, chatPath, msg.docId);
                    updates.push(updateDoc(messageRef, { status: 'read' }));
                }
            });
            
            if (updates.length > 0) {
                try {
                    await Promise.all(updates);
                    // Force the badge update immediately after marking messages as read
                    // The onSnapshot listener will eventually fire, but this is quicker.
                    document.getElementById('chat-notification-badge').classList.add('hidden');
                    console.log(`Updated ${updates.length} messages to 'read' status.`);
                } catch (e) {
                    console.error("Error updating message statuses:", e);
                }
            }
        }

        // --- CRUD Operations ---
        
        /**
         * Checks if collections are empty and creates defaults if necessary.
         */
        async function checkAndCreateDefaults() {
            if (!isAuthReady || !userId) return;

            // 1. Check Skills
            const skillsPath = getUserCollectionPath('skills');
            const skillsSnapshot = await getDocs(collection(db, skillsPath));
            if (skillsSnapshot.empty) {
                await createDefaultSkills();
            }
            
            // 2. Check People (Friends)
            const peoplePath = getUserCollectionPath('people');
            const peopleSnapshot = await getDocs(collection(db, peoplePath));
            if (peopleSnapshot.empty) {
                await createDefaultPeople();
            }
        }

        // Function to create default skills on first run
        async function createDefaultSkills() {
            if (!isAuthReady || !userId) return;
            const path = getUserCollectionPath('skills');
            if (!path) return;

            const defaultSkills = [
                {
                    title: "Learn Python",
                    desc: "Mastering the basics of data structures and algorithms.",
                    stars: 4,
                    type: 'skill',
                    createdAt: new Date().toISOString(),
                    progress: 5,
                    lastMilestone: 0, // NEW field
                },
                {
                    title: "Meditation Practice",
                    desc: "Daily 15-minute mindfulness sessions.",
                    stars: 2,
                    type: 'skill',
                    createdAt: new Date().toISOString(),
                    progress: 18,
                    lastMilestone: 10, // NEW field
                },
                {
                    title: "Public Speaking",
                    desc: "Practicing extemporaneous speeches.",
                    stars: 3,
                    type: 'skill',
                    createdAt: new Date().toISOString(),
                    progress: 2,
                    lastMilestone: 0, // NEW field
                }
            ];

            try {
                for (const skill of defaultSkills) {
                    await addDoc(collection(db, path), skill);
                }
                console.log("Default skills added.");
            } catch (e) {
                console.error("Error adding default skills: ", e);
            }
        }
        
        async function createDefaultPeople() {
            if (!isAuthReady || !userId) return;
            const path = getUserCollectionPath('people');
            if (!path) return;

            const defaultPeople = [
                {
                    title: "AI Assistant",
                    desc: "Your personal skill coach and motivator.",
                    subtitle: "An expert in personal development and learning.",
                    type: 'person',
                    createdAt: new Date().toISOString(),
                    id: AI_SENDER_ID, 
                },
                {
                    title: "Alice Johnson",
                    desc: "Data Science Study Buddy",
                    subtitle: "Focusing on Python and ML.",
                    type: 'person',
                    createdAt: new Date().toISOString(),
                    id: crypto.randomUUID(), 
                },
                {
                    title: "Bob Smith",
                    desc: "Meditation Group Leader",
                    subtitle: "Runs weekly mindfulness sessions.",
                    type: 'person',
                    createdAt: new Date().toISOString(),
                    id: crypto.randomUUID(), 
                },
            ];

            try {
                for (const person of defaultPeople) {
                    if (person.id === AI_SENDER_ID) {
                        await setDoc(doc(db, path, person.id), person);
                    } else {
                         await addDoc(collection(db, path), person);
                    }
                }
                console.log("Default AI Assistant friend and sample friends added.");
            } catch (e) {
                console.error("Error adding default people: ", e);
            }
        }


        async function saveItem(type, title, desc, stars) {
            const path = getUserCollectionPath(type === 'skill' ? 'skills' : 'people');
            if (!path) return;

            const newItem = {
                title: title,
                desc: desc,
                stars: type === 'skill' ? parseFloat(stars) : null,
                subtitle: type === 'person' ? desc : null,
                type: type,
                createdAt: new Date().toISOString(),
                progress: 0, 
                lastMilestone: type === 'skill' ? 0 : undefined, // Initialize new skill milestone
                id: type === 'person' ? crypto.randomUUID() : undefined,
            };

            try {
                if (type === 'person' && peopleData.some(p => p.title.toLowerCase() === title.toLowerCase())) {
                    throw new Error("Friend with this name already exists.");
                }

                await addDoc(collection(db, path), newItem);
                console.log(`New ${type} added successfully.`);
                closePage('add-new-modal');
            } catch (e) {
                console.error("Error adding document: ", e);
                document.getElementById('add-form-error').innerText = e.message || "Error saving data.";
                document.getElementById('add-form-error').classList.remove('hidden');
            }
        }
        
        async function createNewGroup(e) {
            e.preventDefault();
            if (!isAuthReady || !userId) return;

            const groupName = document.getElementById('group-name').value.trim();
            const checkboxes = document.querySelectorAll('#friend-checkbox-list input[type="checkbox"]:checked');
            
            let selectedMemberUids = Array.from(checkboxes).map(cb => cb.value);
            selectedMemberUids.push(userId); 
            selectedMemberUids = selectedMemberUids.filter(uid => uid !== AI_SENDER_ID);


            if (groupName.length < 3 || selectedMemberUids.length < 2) {
                document.getElementById('group-form-error').innerText = "Group name must be at least 3 chars and include at least one friend.";
                document.getElementById('group-form-error').classList.remove('hidden');
                return;
            }
            
            const memberNames = selectedMemberUids.map(uid => 
                uid === userId 
                    ? 'You' 
                    : (peopleData.find(p => p.id === uid)?.title || `Friend (${uid.substring(0, 8)}...)`)
            );


            const newGroup = {
                name: groupName,
                memberUids: selectedMemberUids, 
                createdAt: new Date().toISOString(),
                creatorId: userId,
                memberNames: memberNames,
            };

            try {
                await addDoc(collection(db, getUserCollectionPath('private_groups')), newGroup);
                console.log("New group created successfully.");
                document.getElementById('group-form-error').classList.add('hidden');
                closePage('create-group-modal');
                switchTab('groups');
            } catch (e) {
                console.error("Error creating group: ", e);
                document.getElementById('group-form-error').innerText = "Error creating group. Try again.";
                document.getElementById('group-form-error').classList.remove('hidden');
            }
        }

        async function logSkillProgress() {
            if (!currentSkillDocId || !userId) return;
            const skill = skillsData.find(s => s.id === currentSkillDocId);
            if (!skill) return;

            const newProgress = (skill.progress || 0) + 1;
            const skillRef = doc(db, getUserCollectionPath('skills'), currentSkillDocId);

            try {
                await updateDoc(skillRef, {
                    progress: newProgress
                });
                console.log(`Progress logged for ${skill.title}. New progress: ${newProgress}`);
                openSkillDetail(skill.id); 
            } catch (e) {
                console.error("Error updating progress: ", e);
            }
        }

        async function deleteSkill() {
            if (!currentSkillDocId || !userId) return;
            const skillRef = doc(db, getUserCollectionPath('skills'), currentSkillDocId);

            try {
                await deleteDoc(skillRef);
                console.log("Skill deleted successfully.");
                closePage('skill-detail-page');
            } catch (e) {
                console.error("Error deleting document: ", e);
            }
        }
        
        async function sendMessage() {
            if (!isAuthReady || !userId) return;
            const chatInput = document.getElementById('chat-input');
            const messageText = chatInput.value.trim();

            if (messageText === "") return;

            const chatPath = getChatCollectionPath(currentChatMode, currentGroupId);
            if (!chatPath) {
                console.error("Cannot send message: Chat path not defined.");
                return;
            }

            const userShortId = userId.substring(0, 8); 
            
            const newMessage = {
                senderId: userId,
                senderShortId: userShortId,
                message: messageText,
                timestamp: new Date().toISOString(), 
                status: 'delivered', 
            };

            try {
                await addDoc(collection(db, chatPath), newMessage);
                chatInput.value = ''; 
                chatInput.focus();
                
                if (currentChatMode === 'community') {
                    generateAIResponse(messageText);
                }

            } catch (e) {
                console.error("Error sending message: ", e);
            }
        }
        
        function checkChatEnter(event) {
            if (event.key === 'Enter') {
                sendMessage();
            }
        }

        // --- UI Rendering and Navigation ---
        
        /**
         * Updates the badge for the chat icon (messages from others).
         */
        function updateNotificationBadge() {
             const hasUnread = chatMessages.some(msg => 
                msg.senderId !== userId && 
                msg.senderId !== AI_SENDER_ID &&
                msg.status === 'delivered'
             );

             document.getElementById('chat-notification-badge').classList.toggle('hidden', !hasUnread);
        }
        
        /**
         * Updates the badge for the bell icon (system notifications).
         */
        function updateBellBadge() {
             const count = unseenNotifications.length;
             const badge = document.getElementById('bell-notification-badge');
             
             badge.innerText = count;
             badge.classList.toggle('hidden', count === 0);
        }
        
        function clearNotifications() {
             unseenNotifications = [];
             renderNotifications(); // Rerender to show cleared list
             updateBellBadge(); // Clear the badge
        }

        function updateUI() {
            // Update stats
            document.getElementById('user-score').innerText = `Score: ${totalScore.toFixed(0)}`;
            document.getElementById('stats-total-score').innerText = totalScore.toFixed(0);
            document.getElementById('stats-skill-count').innerText = skillsData.length;
            document.getElementById('stats-friend-count').innerText = peopleData.length;
            document.getElementById('stats-group-count').innerText = groupsData.length;

            // Update badges
            updateNotificationBadge();
            updateBellBadge();

            // Re-render current tab content
            if (currentTab === 'skills') {
                renderSkills(skillsData);
            } else if (currentTab === 'friends') {
                renderFriends(peopleData);
            } else if (currentTab === 'groups') {
                renderGroups(groupsData);
            } else if (currentTab === 'leaderboard') {
                 showLeaderboard('my-score', true); // Force update my score display
            }
            
            handleSearch(); 
        }

        function switchTab(tab) {
            currentTab = tab;
            document.querySelectorAll('.nav-tab').forEach(btn => {
                btn.classList.remove('active', 'bg-blue-500', 'text-white');
                btn.classList.add('bg-transparent', 'text-gray-500');
            });
            const activeTab = document.getElementById(`tab-${tab}`);
            activeTab.classList.add('active', 'bg-blue-500', 'text-white');
            activeTab.classList.remove('bg-transparent', 'text-gray-500');
            
            document.getElementById('grid-container').classList.add('hidden');
            document.getElementById('friends-list-container').classList.add('hidden');
            document.getElementById('leaderboard-content').classList.add('hidden');
            document.getElementById('groups-list-container').classList.add('hidden'); 
            
            if (tab === 'skills') {
                document.getElementById('grid-container').classList.remove('hidden');
                renderSkills(skillsData);
            } else if (tab === 'friends') {
                document.getElementById('friends-list-container').classList.remove('hidden');
                renderFriends(peopleData); 
            } else if (tab === 'groups') {
                document.getElementById('groups-list-container').classList.remove('hidden');
                renderGroups(groupsData);
            } else if (tab === 'leaderboard') {
                document.getElementById('leaderboard-content').classList.remove('hidden');
                showLeaderboard('my-score'); // Default to 'My Score' view
            }

            const btn = document.getElementById('add-new-btn');
            let btnText = 'Item';
            if (tab === 'skills') btnText = 'Skill';
            if (tab === 'friends') btnText = 'Friend';
            
            btn.innerHTML = `<i class='bx bx-plus-circle mr-2'></i> Add New ${btnText}`;
            btn.classList.toggle('hidden', tab === 'groups' || tab === 'leaderboard');
        }

        function handleSearch() {
            const query = document.getElementById('search-input').value.toLowerCase().trim();
            document.getElementById('no-result').classList.add('hidden');

            if (currentTab === 'skills') {
                renderSkills(skillsData);
            } else if (currentTab === 'friends') {
                renderFriends(peopleData);
            } else if (currentTab === 'groups') {
                renderGroups(groupsData);
            }
        }

        function renderSkills(items) {
            const container = document.getElementById('grid-container');
            container.innerHTML = '';
            
            const query = document.getElementById('search-input').value.toLowerCase().trim();
            const filteredItems = items.filter(item => 
                item.title?.toLowerCase().includes(query) || item.desc?.toLowerCase().includes(query)
            );
            
            if (filteredItems.length === 0 && query === '') {
                container.innerHTML = '<div class="text-center text-gray-500 p-4 col-span-full">No skills added yet. Click "Add New Skill" to start tracking.</div>';
                return;
            } else if (filteredItems.length === 0 && query !== '') {
                 document.getElementById('no-result').classList.remove('hidden');
                 return;
            }

            filteredItems.forEach(skill => {
                const card = createCard(skill);
                container.appendChild(card);
            });
        }
        
        function renderAlphabetIndex(container) {
            container.innerHTML = '';
            
            const title = document.createElement('div');
            title.className = 'text-xs font-bold text-gray-500 mr-2 flex-shrink-0';
            title.innerText = 'Go To:';
            container.appendChild(title);

            FULL_ALPHABET.forEach(letter => {
                const link = document.createElement('a');
                link.href = `#friends-${letter}`;
                link.className = 'font-mono text-sm font-semibold p-1 px-2 rounded-md text-gray-600 hover:bg-blue-100 hover:text-blue-700 transition duration-150 flex-shrink-0';
                link.innerText = letter;
                
                link.onclick = (e) => {
                    e.preventDefault();
                    const targetId = `friends-${letter}`;
                    const targetElement = document.getElementById(targetId);
                    if (targetElement) {
                        window.scrollTo({
                            top: targetElement.offsetTop - 120, 
                            behavior: 'smooth'
                        });
                    }
                };
                container.appendChild(link);
            });
        }
        
        function renderFriends(items) {
            const container = document.getElementById('friends-list');
            container.innerHTML = '';
            
            const indexContainer = document.getElementById('alphabet-index-header');
            renderAlphabetIndex(indexContainer);

            const query = document.getElementById('search-input').value.toLowerCase().trim();
            const filteredItems = items.filter(item => 
                item.title.toLowerCase().includes(query) || item.subtitle?.toLowerCase().includes(query)
            );

            if (filteredItems.length === 0 && query === '') {
                container.innerHTML = '<div class="text-center text-gray-500 p-4">No friends added. Click "Add New Friend" to connect.</div>';
                return;
            }

            const groupedFriends = filteredItems.reduce((acc, person) => {
                let initial = person.title.charAt(0).toUpperCase(); 
                if (!/^[A-Z]$/.test(initial)) {
                    initial = '#'; 
                }
                
                if (!acc[initial]) {
                    acc[initial] = [];
                }
                acc[initial].push(person);
                return acc;
            }, {});
            
            
            FULL_ALPHABET.forEach(initial => {
                const friendsInGroup = groupedFriends[initial] || [];
                
                if (query !== '' && friendsInGroup.length === 0) {
                    return;
                }

                const header = document.createElement('h3');
                header.id = `friends-${initial}`; 
                header.className = 'text-2xl font-black text-gray-800 mt-6 mb-3 border-b-2 border-green-500/80 pb-1 pt-1 bg-white/90 sticky top-[60px] z-10 transition duration-300 shadow-md px-3 rounded-lg';
                header.innerText = initial;
                container.appendChild(header);
                
                if (friendsInGroup.length === 0) {
                    if (query === '') {
                         const emptyMsg = document.createElement('p');
                         emptyMsg.className = 'text-sm text-gray-400 p-2 pl-3 bg-white rounded-lg shadow-inner';
                         emptyMsg.innerText = `No friends starting with ${initial} yet.`;
                         container.appendChild(emptyMsg);
                    }
                } else {
                    friendsInGroup.forEach(person => {
                        const item = createFriendListItem(person);
                        container.appendChild(item);
                    });
                }
            });
        }
        
        function renderGroups(items) {
            const container = document.getElementById('groups-list');
            container.innerHTML = '';
            
            if (items.length === 0) {
                container.innerHTML = '<div class="text-center text-gray-500 p-4">You haven\'t created any private groups yet.</div>';
                return;
            }

            items.forEach(group => {
                const item = createGroupListItem(group);
                container.appendChild(item);
            });
        }
        
        function renderNotifications() {
            const container = document.getElementById('notification-list');
            const noNotifications = document.getElementById('no-notifications');
            container.innerHTML = '';
            
            if (unseenNotifications.length === 0) {
                noNotifications.classList.remove('hidden');
                return;
            }
            noNotifications.classList.add('hidden');
            
            // Sort newest first
            unseenNotifications.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

            unseenNotifications.forEach(n => {
                const div = document.createElement('div');
                div.className = 'p-4 bg-white rounded-xl shadow-md border-l-4 border-amber-400 flex items-start space-x-3';
                
                let iconClass = 'bx bx-trophy';
                if (n.type === 'skill_milestone') iconClass = 'bx bxs-check-shield';

                div.innerHTML = `
                    <div class="text-2xl text-amber-500 pt-1"><i class='${iconClass}'></i></div>
                    <div class="flex-1">
                        <div class="font-bold text-gray-800">${n.message}</div>
                        <div class="text-xs text-gray-500 mt-1">${new Date(n.timestamp).toLocaleDateString()} ${new Date(n.timestamp).toLocaleTimeString()}</div>
                    </div>
                `;
                container.appendChild(div);
            });
        }


        function renderChatMessages() {
            const container = document.getElementById('chat-messages-container');
            const shouldAutoScroll = (container.scrollTop + container.clientHeight) >= container.scrollHeight - 50; 

            container.innerHTML = '';

            if (chatMessages.length === 0) {
                 container.innerHTML = '<div class="text-center text-gray-500 text-sm">No messages yet. Say hi!</div>';
                 return;
            }

            chatMessages.forEach(msg => {
                const isSent = msg.senderId === userId;
                const isAI = msg.senderId === AI_SENDER_ID;
                
                let bubbleClass = isSent ? 'sent' : 'received';
                let senderName = isSent ? 'You' : msg.senderShortId;
                let avatarIcon = 'bx bxs-user'; 
                let avatarBg = isSent ? 'bg-green-300' : 'bg-gray-300';

                if (isAI) {
                    bubbleClass = 'ai-response';
                    senderName = 'AI Assistant (SkillUp)';
                    avatarIcon = 'bx bx-brain'; 
                    avatarBg = 'bg-amber-300';
                } else if (!isSent && msg.senderId !== AI_SENDER_ID) {
                    const friend = peopleData.find(p => p.id === msg.senderId)
                    senderName = friend ? friend.title : `User ${msg.senderShortId}`;
                    avatarBg = 'bg-blue-300'; 
                }

                const time = new Date(msg.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                
                let statusIcon = '';
                if (isSent) {
                    const iconColor = msg.status === 'read' ? 'text-amber-400' : 'text-white/50'; 

                    if (msg.status === 'read') {
                        statusIcon = `<i class='bx bxs-check-double text-xs ${iconColor} ml-1'></i>`;
                    } else if (msg.status === 'delivered') {
                        statusIcon = `<i class='bx bx-check text-xs ${iconColor} ml-1'></i>`;
                    } else {
                         statusIcon = `<i class='bx bx-time-five text-xs ${iconColor} ml-1'></i>`;
                    }
                }
                
                const senderColor = isAI ? 'text-amber-200' : (isSent ? 'text-white/80' : 'text-blue-500');

                const messageDiv = document.createElement('div');
                messageDiv.className = `flex ${isSent ? 'justify-end' : 'justify-start'} items-start`;
                
                if (!isSent) {
                    messageDiv.innerHTML += `
                        <div class="w-8 h-8 rounded-full ${avatarBg} flex items-center justify-center text-white text-xl mr-2 mt-1 flex-shrink-0">
                            <i class='${avatarIcon}'></i>
                        </div>
                    `;
                }

                messageDiv.innerHTML += `
                    <div class="message-bubble ${bubbleClass} flex flex-col shadow-md">
                        <div class="text-xs font-bold ${senderColor} mb-1">${senderName}</div>
                        <p class="text-sm">${msg.message}</p>
                        <div class="text-xs mt-1 ${isSent ? 'text-white/70' : 'text-gray-400'} self-end flex items-center">
                            ${time}
                            ${statusIcon}
                        </div>
                    </div>
                `;
                container.appendChild(messageDiv);
            });

            if (shouldAutoScroll) {
                container.scrollTop = container.scrollHeight;
            }
        }


        function createCard(item) {
            const div = document.createElement('div');
            div.className = 'cyan-card'; 

            let starHtml = '';
            const stars = item.stars || 1;
            for(let i=0; i<Math.floor(stars); i++) starHtml += '★';

            // --- PROGRESS BAR LOGIC ---
            const targetLogs = (item.stars || 1) * LOGS_PER_STAR_MILESTONE; 
            const currentProgress = item.progress || 0;
            let progressPercent = Math.min(100, (currentProgress / targetLogs) * 100);
            progressPercent = progressPercent.toFixed(0); 
            
            const progressText = item.progress ? `Logs: ${item.progress} / ${targetLogs}` : 'Not started';
            
            div.innerHTML = `
                <img src="https://placehold.co/300x200/${Math.floor(Math.random()*16777215).toString(16)}/fff?text=${item.title}" class="card-img w-full h-36 object-cover rounded-xl mb-3" alt="${item.title} Skill Image">
                <div class="flex-1">
                    <div class="card-title text-xl font-extrabold text-gray-800">${item.title}</div>
                    <div class="card-subtitle text-sm text-gray-500 mb-2">${item.desc}</div>
                    <div class="text-yellow-500 text-lg">${starHtml}</div>
                </div>
                
                <!-- Progress Bar Section -->
                <div class="mt-3">
                    <div class="flex justify-between items-center text-xs font-semibold mb-1">
                        <span class="text-gray-600">${progressText}</span>
                        <span class="text-green-600">${progressPercent}%</span>
                    </div>
                    <div class="w-full bg-gray-200 rounded-full h-2.5">
                        <div class="bg-green-500 h-2.5 rounded-full transition-all duration-500" style="width: ${progressPercent}%"></div>
                    </div>
                </div>
                <!-- END Progress Bar -->

                <!-- Action bar at the bottom -->
                <div class="flex justify-between items-center mt-3 pt-3 border-t border-gray-100">
                    <div class="text-blue-500 font-bold">Score: ${(currentProgress * stars).toFixed(0)}</div>
                    <div class="flex gap-2">
                        <!-- Delete Button -->
                        <button class="bg-red-500 text-white rounded-full w-10 h-10 flex items-center justify-center text-lg shadow-lg hover:bg-red-600 transition" 
                             title="删除技能" onclick="showConfirmationModal('${item.id}', '${item.title}')">
                            <i class='bx bx-trash'></i>
                        </button>
                        <!-- View Detail Button -->
                        <button class="bg-blue-500 text-white rounded-full w-10 h-10 flex items-center justify-center text-2xl shadow-lg hover:bg-blue-600 transition" 
                             title="查看详情" onclick="openSkillDetail('${item.id}')">
                            <i class='bx bx-chevron-right'></i>
                        </button>
                    </div>
                </div>
            `;
            return div;
        }

        function createFriendListItem(person) {
            const div = document.createElement('div');
            div.className = 'flex items-center bg-white p-3 rounded-xl shadow-sm cursor-pointer hover:shadow-lg transition';
            
            const isAI = person.id === AI_SENDER_ID;
            let avatarHtml = '';
            let avatarBgColor = isAI ? 'bg-amber-500' : 'bg-blue-500';

            avatarHtml = `<div class="w-12 h-12 rounded-full ${avatarBgColor} flex items-center justify-center text-white text-xl mr-4"><i class='${isAI ? 'bx bx-brain' : 'bx bxs-user'}'></i></div>`;
            
            div.innerHTML = `
                ${avatarHtml}
                <div class="flex-1">
                    <div class="font-bold text-gray-800">${person.title} ${isAI ? '(AI)' : ''}</div>
                    <div class="text-sm text-gray-500">${person.subtitle || 'Friend added'}</div>
                </div>
                <div class="text-gray-400 text-xl"><i class='bx bx-message-square-detail'></i></div>
            `;
            
            div.onclick = () => openChatModal('community');
            
            return div;
        }
        
        function createGroupListItem(group) {
            const div = document.createElement('div');
            div.className = 'flex items-center bg-white p-3 rounded-xl shadow-sm cursor-pointer hover:shadow-lg transition';
            div.onclick = () => openChatModal('group', group.id, group.name);

            const memberCount = group.memberUids.length;
            const memberList = group.memberNames.join(', ');

            div.innerHTML = `
                <div class="w-12 h-12 rounded-full bg-indigo-200 flex items-center justify-center text-indigo-700 text-xl font-bold mr-4">
                    <i class='bx bxs-group'></i>
                </div>
                <div class="flex-1">
                    <div class="font-bold text-gray-800">${group.name}</div>
                    <div class="text-sm text-gray-500">${memberCount} members: ${memberList}</div>
                </div>
                <div class="text-blue-500 text-xl"><i class='bx bx-message-square-detail'></i></div>
            `;
            return div;
        }

        function openPage(pageId) { 
            if (pageId === 'create-group-modal') {
                populateGroupFriendList();
            }
            document.getElementById(pageId).classList.add('open'); 
        }

        function closePage(pageId) { 
            document.getElementById(pageId).classList.remove('open'); 
            if (pageId === 'group-chat-modal') {
                if (currentChatMode === 'group' && unsubscribeCurrentChat) {
                    unsubscribeCurrentChat();
                    unsubscribeCurrentChat = null; 
                }
                
                if (currentChatMode === 'community') {
                    updateMessageStatusesToRead(); 
                }
                
                currentChatMode = 'community';
                currentGroupId = null;
            }
        }
        
        function openNotificationModal() {
            renderNotifications();
            openPage('notification-modal');
        }

        function openSkillDetail(id) {
            currentSkillDocId = id;
            const skill = skillsData.find(s => s.id === id);
            if (!skill) return;
            
            const currentProgress = skill.progress || 0;
            const stars = skill.stars || 1;
            const score = currentProgress * stars;
            const targetLogs = stars * LOGS_PER_STAR_MILESTONE;
            let progressPercent = Math.min(100, (currentProgress / targetLogs) * 100).toFixed(0);

            document.getElementById('sd-title').innerText = skill.title;
            document.getElementById('sd-desc').innerText = skill.desc;
            
            let starHtml = '';
            for(let i=0; i<Math.floor(stars); i++) starHtml += '★';
            document.getElementById('sd-stars').innerHTML = starHtml; 

            const progressDiv = document.getElementById('sd-progress');
            progressDiv.innerHTML = `
                <div class="bg-blue-50 p-4 rounded-xl shadow-inner border border-blue-200">
                    <div class="flex justify-between items-center text-sm font-semibold mb-1">
                        <span class="text-gray-700">Current Progress:</span>
                        <span class="text-blue-600 font-extrabold">${currentProgress} Logs</span>
                    </div>
                    <div class="flex justify-between items-center text-sm font-semibold mb-3 border-b pb-3">
                        <span class="text-gray-700">Goal for 5-Star Mastery:</span>
                        <span class="text-blue-600 font-extrabold">${targetLogs} Logs</span>
                    </div>

                    <!-- Progress Bar in Detail -->
                    <div class="mb-3">
                        <div class="flex justify-between items-center text-xs font-semibold mb-1">
                            <span class="text-gray-600">Progress Towards Goal</span>
                            <span class="text-green-600">${progressPercent}%</span>
                        </div>
                        <div class="w-full bg-gray-200 rounded-full h-2.5">
                            <div class="bg-green-500 h-2.5 rounded-full transition-all duration-500" style="width: ${progressPercent}%"></div>
                        </div>
                    </div>
                    
                    <div class="flex justify-between items-center text-sm font-semibold text-green-700 pt-2 border-t border-dashed">
                        <span>Total Score Earned:</span>
                        <span class="font-extrabold">${score.toFixed(0)} Points</span>
                    </div>
                </div>

                <!-- Input/Logging Section -->
                <div class="bg-green-100 p-3 rounded-lg flex justify-between items-center">
                    <span class="font-semibold text-green-700">Log a Practice Session (+1 Log)</span>
                    <button class="bg-green-500 text-white px-4 py-2 rounded-full font-bold text-sm hover:bg-green-600 transition shadow" onclick="logSkillProgress()">Log Progress</button>
                </div>
            `;

            openPage('skill-detail-page');
        }
        
        function showConfirmationModal(docId, itemTitle) {
            document.getElementById('confirm-title').innerText = "Confirm Deletion";
            document.getElementById('confirm-message').innerText = `Are you sure you want to delete the skill "${itemTitle}"? This cannot be undone.`;
            
            const confirmBtn = document.getElementById('confirm-action-btn');
            confirmBtn.onclick = null; 
            confirmBtn.onclick = async () => {
                currentSkillDocId = docId;
                await deleteSkill();
                closePage('confirmation-modal');
            };
            openPage('confirmation-modal');
        }

        function openAddModal() {
            const type = currentTab === 'skills' ? 'skill' : 'person';
            document.getElementById('add-modal-title').innerText = `Add New ${type === 'skill' ? 'Skill' : 'Friend'}`;
            document.getElementById('skill-fields').classList.toggle('hidden', type !== 'skill');
            document.getElementById('add-form-error').classList.add('hidden');
            document.getElementById('add-form').reset();
            
            const form = document.getElementById('add-form');
            form.onsubmit = (e) => {
                e.preventDefault();
                const title = document.getElementById('item-title').value.trim();
                const desc = document.getElementById('item-desc').value.trim();
                const stars = document.getElementById('item-stars').value;
                
                if (title) {
                    saveItem(type, title, desc, stars);
                }
            };

            openPage('add-new-modal');
        }
        
        function openChatModal(mode, groupId = null, groupName = 'Community Chat') {
            const titleElement = document.getElementById('chat-title');
            
            if (mode === 'community') {
                titleElement.innerText = 'Community Chat';
                // Trigger read status update and badge clear immediately upon opening
                updateMessageStatusesToRead(); 
            } else {
                titleElement.innerText = groupName;
            }
            
            // Set up listener for the selected chat mode/group
            setupChatListener(mode, groupId); 

            openPage('group-chat-modal');
        }
        
        function populateGroupFriendList() {
            const container = document.getElementById('friend-checkbox-list');
            container.innerHTML = '';
            
            const selectableFriends = peopleData.filter(p => p.id !== AI_SENDER_ID);
            
            if (selectableFriends.length === 0) {
                container.innerHTML = '<p class="text-sm text-gray-500">No friends added. Add friends in the \'Friends\' tab first.</p>';
                return;
            }

            selectableFriends.forEach(person => {
                const label = document.createElement('label');
                label.className = 'flex items-center space-x-3 cursor-pointer';
                const friendId = person.id === AI_SENDER_ID ? person.id : person.docId;
                label.innerHTML = `
                    <input type="checkbox" name="member" value="${friendId}" class="form-checkbox h-5 w-5 text-blue-600 rounded">
                    <span class="text-gray-700 font-medium">${person.title} (${(person.id || person.docId).substring(0, 8)}...)</span>
                `;
                container.appendChild(label);
            });
            
            document.getElementById('create-group-form').onsubmit = createNewGroup;
        }
        
        // --- Leaderboard Functions (New) ---

        /**
         * Helper function to create an HTML list item for the leaderboard.
         */
        function createLeaderboardItem(rank, scoreEntry, isCurrentUser) {
            // Check if the scoreEntry corresponds to a friend (excluding AI)
            const isFriend = peopleData.some(p => p.id === scoreEntry.userId && p.id !== AI_SENDER_ID);
            let name = scoreEntry.userShortId;
            let rankColor = 'text-gray-600';
            let icon = 'bx bx-user';
            let cardClass = 'bg-white';
            
            if (isCurrentUser) {
                name = `You (${scoreEntry.userShortId})`;
                cardClass = 'bg-blue-100 border-blue-500 border-l-4 font-bold shadow-md';
            } else if (isFriend) {
                const friend = peopleData.find(p => p.id === scoreEntry.userId);
                name = friend ? `${friend.title} (${scoreEntry.userShortId})` : scoreEntry.userShortId;
                cardClass = 'bg-green-50 border-green-500 border-l-4 shadow-sm';
            }
            
            if (rank === 1) { rankColor = 'text-yellow-600'; icon = 'bx bxs-crown'; }
            else if (rank === 2) { rankColor = 'text-gray-400'; icon = 'bx bxs-medal'; }
            else if (rank === 3) { rankColor = 'text-orange-700'; icon = 'bx bxs-medal'; }

            return `
                <div class="p-4 rounded-xl flex items-center justify-between ${cardClass} transition duration-150 hover:shadow-lg">
                    <div class="flex items-center space-x-4">
                        <span class="text-2xl font-extrabold w-8 text-center ${rankColor}">${rank}</span>
                        <div class="text-xl ${rankColor}"><i class='${icon}'></i></div>
                        <span class="text-gray-800 font-medium truncate">${name}</span>
                    </div>
                    <span class="text-2xl font-bold text-blue-700">${scoreEntry.totalScore.toFixed(0)}</span>
                </div>
            `;
        }


        async function fetchFriendsLeaderboard() {
            const listContainer = document.getElementById('friends-leaderboard-list');
            const noFriendsMsg = document.getElementById('no-friends-for-lb');
            listContainer.innerHTML = '<p class="text-center text-blue-500 p-4">Loading friends scores...</p>';
            noFriendsMsg.classList.add('hidden');

            const friends = peopleData.filter(p => p.id !== AI_SENDER_ID);
            const friendIds = friends.map(p => p.id);
            
            // Include current user's ID
            let allIds = [userId, ...friendIds].filter((value, index, self) => self.indexOf(value) === index);

            if (allIds.length <= 1) { // Only current user or no valid friends
                listContainer.innerHTML = '';
                noFriendsMsg.classList.remove('hidden');
                return;
            }

            const path = getPublicCollectionPath('user_scores');
            if (!path) {
                listContainer.innerHTML = '<p class="text-center text-red-500 p-4">Error: Firestore not ready.</p>';
                return;
            }

            try {
                // Firestore 'in' query supports up to 10 IDs. We will query batches if needed.
                // Since this is a simple app, we'll use one query for the first 10 IDs.
                const queryIds = allIds.slice(0, 10); 
                
                const q = query(collection(db, path), where('userId', 'in', queryIds));
                const snapshot = await getDocs(q);
                
                let scores = [];
                snapshot.forEach(doc => {
                    scores.push({ ...doc.data(), id: doc.id });
                });

                scores.sort((a, b) => b.totalScore - a.totalScore); // Sort descending

                listContainer.innerHTML = '';
                scores.forEach((scoreEntry, index) => {
                    const isCurrentUser = scoreEntry.userId === userId;
                    listContainer.innerHTML += createLeaderboardItem(index + 1, scoreEntry, isCurrentUser);
                });
                
            } catch (e) {
                console.error("Error fetching friends leaderboard:", e);
                listContainer.innerHTML = '<p class="text-center text-red-500 p-4">Error loading friends leaderboard. (Check console for details)</p>';
            }
        }

        async function fetchGlobalLeaderboard() {
            const listContainer = document.getElementById('global-leaderboard-list');
            // Use the loading message element's inner HTML to reset the list and show loading
            listContainer.innerHTML = document.getElementById('loading-global-lb').outerHTML; 

            const path = getPublicCollectionPath('user_scores');
            if (!path) {
                listContainer.innerHTML = '<p class="text-center text-red-500 p-4">Error: Firestore not ready.</p>';
                return;
            }

            try {
                // Query for top 50 users globally by score, ordering by totalScore descending
                const q = query(collection(db, path), orderBy('totalScore', 'desc'), limit(50));
                const snapshot = await getDocs(q);

                let scores = [];
                snapshot.forEach(doc => {
                    scores.push({ ...doc.data(), id: doc.id });
                });

                listContainer.innerHTML = '';
                if (scores.length === 0) {
                    listContainer.innerHTML = '<p class="text-center text-gray-500 p-4">No global scores recorded yet.</p>';
                    return;
                }

                scores.forEach((scoreEntry, index) => {
                    const isCurrentUser = scoreEntry.userId === userId;
                    listContainer.innerHTML += createLeaderboardItem(index + 1, scoreEntry, isCurrentUser);
                });
                
                // Check if the current user is in the top 50
                const currentUserEntry = scores.find(s => s.userId === userId);
                if (!currentUserEntry && userId) {
                    // Fetch current user's score to display below the list
                    const userDocRef = doc(db, path, userId);
                    const userDocSnap = await getDoc(userDocRef);

                    if (userDocSnap.exists()) {
                         const userScore = userDocSnap.data();
                         listContainer.innerHTML += `
                             <div class="text-center text-sm text-gray-600 mt-6 pt-4 border-t border-dashed">
                                <p>Your Score: <span class="font-bold text-blue-700 text-lg">${userScore.totalScore.toFixed(0)}</span> (Not in Top 50)</p>
                             </div>
                         `;
                    }
                }

            } catch (e) {
                console.error("Error fetching global leaderboard:", e);
                listContainer.innerHTML = '<p class="text-center text-red-500 p-4">Error loading global leaderboard. (Check console for details)</p>';
            }
        }

        function showLeaderboard(view, forceUpdate = false) {
            document.querySelectorAll('.lb-tab-btn').forEach(btn => {
                btn.classList.remove('active', 'border-blue-500', 'text-blue-500');
                btn.classList.add('border-transparent', 'text-gray-700');
            });

            const activeBtn = document.querySelector(`.lb-tab-btn[data-view="${view}"]`);
            if (activeBtn) {
                activeBtn.classList.add('active', 'border-blue-500', 'text-blue-500');
                activeBtn.classList.remove('border-transparent', 'text-gray-700');
            }


            document.querySelectorAll('.lb-view').forEach(v => v.classList.add('hidden'));
            const activeView = document.getElementById(`lb-${view}`);
            if (activeView) {
                activeView.classList.remove('hidden');
            }


            // Always update 'My Score' display
            document.getElementById('my-leaderboard-score').innerText = totalScore.toFixed(0);

            if (view === 'friends-lb' || forceUpdate && view === 'friends-lb') {
                fetchFriendsLeaderboard();
            } else if (view === 'global-lb' || forceUpdate && view === 'global-lb') {
                fetchGlobalLeaderboard();
            }
        }


        // --- Export Globals and Initialize ---
        window.switchTab = switchTab;
        window.handleSearch = handleSearch;
        window.openPage = openPage;
        window.closePage = closePage;
        window.openAddModal = openAddModal;
        window.openSkillDetail = openSkillDetail;
        window.logSkillProgress = logSkillProgress;
        window.deleteSkill = deleteSkill;
        window.sendMessage = sendMessage;
        window.checkChatEnter = checkChatEnter;
        window.openChatModal = openChatModal; 
        window.showConfirmationModal = showConfirmationModal; 
        window.openNotificationModal = openNotificationModal; 
        window.clearNotifications = clearNotifications; 
        window.showLeaderboard = showLeaderboard; // Export new function

        // Start Firebase Initialization
        initFirebase();
