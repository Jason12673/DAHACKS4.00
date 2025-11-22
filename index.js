/**
 * main.js — FULL VERSION WITH BACKEND INTEGRATION
 * Dynamic UI + fetches users from backend API.
 */

document.addEventListener('DOMContentLoaded', () => {
    const body = document.body;
    body.style.margin = '0';
    body.style.fontFamily = 'sans-serif';
    body.style.backgroundColor = '#f4f7f6';

    // 1. HEADER
    const headerContainer = document.createElement('div');
    headerContainer.className = 'header-container';
    headerContainer.style.background = 'linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)';
    headerContainer.style.padding = '25px 20px 40px 20px';
    headerContainer.style.borderBottomLeftRadius = '35px';
    headerContainer.style.borderBottomRightRadius = '35px';
    headerContainer.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.08)';

    const headerTop = document.createElement('div');
    headerTop.style.display = 'flex';
    headerTop.style.justifyContent = 'space-between';
    headerTop.style.alignItems = 'center';

    headerTop.appendChild(createLogo('bx-spark', 'Statistics'));
    headerTop.appendChild(createIconWithBadge('bxs-bell'));
    headerTop.appendChild(createProfileIcon('bxs-user'));

    headerContainer.appendChild(headerTop);
    headerContainer.appendChild(createSearchBar());
    body.appendChild(headerContainer);

    // 2. MAIN CONTENT
    const mainContent = document.createElement('div');
    mainContent.style.padding = '0 20px 20px 20px';
    mainContent.style.marginTop = '-25px';

    mainContent.appendChild(createTabs(['All', 'Skills', 'Friends']));
    mainContent.appendChild(createSectionTitle('Skill Up'));
    mainContent.appendChild(
        createSkillScrollContainer([
            { title: 'Crochet', rating: 3, img: 'https://via.placeholder.com/180x100?text=Crochet+Image' },
            { title: '100,000 steps in 10 days', rating: 4, img: 'https://via.placeholder.com/180x100?text=Running+Group' },
            { title: 'Learn a new skill', rating: 0, img: 'https://via.placeholder.com/180x100?text=New+Skill' }
        ])
    );

    mainContent.appendChild(createSectionTitle('People you may know', '20px'));
    mainContent.appendChild(
        createPeopleScrollContainer([
            { name: 'Kyle Brown', mutuals: '3+', img: 'https://via.placeholder.com/160x200?text=Kyle+Brown' },
            { name: 'Felisha L', mutuals: '1+', img: 'https://via.placeholder.com/160x200?text=Felisha+L' },
            { name: 'Jane D', mutuals: '2+', img: 'https://via.placeholder.com/160x200?text=Jane+D' }
        ])
    );

    body.appendChild(mainContent);

    // 3. BACKEND OUTPUT BOX
    const backendBox = document.createElement('pre');
    backendBox.id = "backend-output";
    backendBox.style.background = '#fff';
    backendBox.style.margin = '20px';
    backendBox.style.padding = '20px';
    backendBox.style.borderRadius = '10px';
    backendBox.style.boxShadow = '0 4px 10px rgba(0,0,0,0.1)';
    backendBox.style.whiteSpace = 'pre-wrap';
    backendBox.textContent = "Loading users from backend...";
    body.appendChild(backendBox);

    // 4. FETCH BACKEND DATA
    loadUsersFromBackend();
});


// =========================
// BACKEND FETCH FUNCTION
// =========================

async function loadUsersFromBackend() {
    const box = document.getElementById("backend-output");

    try {
        const response = await fetch("https://yaritza-overpowering-homely.ngrok-free.dev/api/users");
        const data = await response.json();
        box.textContent = JSON.stringify(data, null, 2);
    } catch (err) {
        box.textContent = "❌ Error loading users:\n" + err;
    }
}


// =========================
// UI COMPONENT HELPERS
// =========================

function createLogo(iconClass, text) {
    const logo = document.createElement('div');
    logo.style.display = 'flex';
    logo.style.alignItems = 'center';
    logo.style.fontSize = '1.5em';
    logo.style.fontWeight = 'bold';
    logo.style.color = '#112a4d';

    const icon = document.createElement('i');
    icon.className = `bx ${iconClass}`;
    icon.style.marginRight = '5px';

    const span = document.createElement('span');
    span.textContent = text;

    logo.appendChild(icon);
    logo.appendChild(span);
    return logo;
}

function createIconWithBadge(iconClass) {
    const n = document.createElement('div');
    n.style.position = 'relative';

    const icon = document.createElement('i');
    icon.className = `bx ${iconClass}`;
    icon.style.fontSize = '1.8em';
    icon.style.color = '#fff';

    const badge = document.createElement('span');
    badge.style.position = 'absolute';
    badge.style.top = '0';
    badge.style.right = '0';
    badge.style.width = '10px';
    badge.style.height = '10px';
    badge.style.borderRadius = '50%';
    badge.style.backgroundColor = 'red';
    badge.style.border = '2px solid #c2e9fb';

    n.appendChild(icon);
    n.appendChild(badge);
    return n;
}

function createProfileIcon(iconClass) {
    const userIcon = document.createElement('div');
    userIcon.style.width = '40px';
    userIcon.style.height = '40px';
    userIcon.style.background = '#fff';
    userIcon.style.borderRadius = '50%';
    userIcon.style.display = 'flex';
    userIcon.style.justifyContent = 'center';
    userIcon.style.alignItems = 'center';

    const icon = document.createElement('i');
    icon.className = `bx ${iconClass}`;
    icon.style.fontSize = '1.5em';
    icon.style.color = '#333';

    userIcon.appendChild(icon);
    return userIcon;
}

function createSearchBar() {
    const box = document.createElement('div');
    box.style.display = 'flex';
    box.style.alignItems = 'center';
    box.style.background = 'white';
    box.style.padding = '8px 15px';
    box.style.marginTop = '20px';
    box.style.borderRadius = '25px';
    box.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';

    const icon = document.createElement('i');
    icon.className = 'bx bx-search';
    icon.style.color = '#777';
    icon.style.marginRight = '10px';

    const input = document.createElement('input');
    input.placeholder = 'Search...';
    input.style.border = 'none';
    input.style.outline = 'none';
    input.style.flexGrow = '1';

    box.appendChild(icon);
    box.appendChild(input);
    return box;
}

function createTabs(names) {
    const tabs = document.createElement('div');
    tabs.style.display = 'flex';
    tabs.style.gap = '10px';
    tabs.style.marginBottom = '20px';

    names.forEach((name, i) => {
        const btn = document.createElement('button');
        btn.textContent = name;
        btn.style.padding = '10px 20px';
        btn.style.borderRadius = '20px';
        btn.style.border = 'none';
        btn.style.cursor = 'pointer';
        btn.style.fontWeight = '600';

        if (i === 0) {
            btn.style.background = '#4facfe';
            btn.style.color = 'white';
            btn.style.boxShadow = '0 4px 8px rgba(79,172,254,0.4)';
        } else {
            btn.style.background = '#eee';
            btn.style.color = '#777';
        }

        tabs.appendChild(btn);
    });

    return tabs;
}

function createSectionTitle(text, marginTop = '0') {
    const t = document.createElement('h2');
    t.textContent = text;
    t.style.fontSize = '1.4em';
    t.style.fontWeight = 'bold';
    t.style.color = '#333';
    t.style.margin = `${marginTop} 0 15px 0`;
    return t;
}

function createSkillScrollContainer(data) {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.overflowX = 'scroll';
    container.style.gap = '15px';
    container.style.paddingBottom = '15px';
    container.insertAdjacentHTML('afterbegin', `<style>.card-scroll-container::-webkit-scrollbar{display:none;}</style>`);

    data.forEach(item => container.appendChild(createSkillCard(item.title, item.rating, item.img)));

    return container;
}

function createSkillCard(title, rating, imgUrl) {
    const card = document.createElement('div');
    card.style.width = '180px';
    card.style.background = 'white';
    card.style.borderRadius = '15px';
    card.style.boxShadow = '0 6px 15px rgba(0,0,0,0.1)';
    card.style.overflow = 'hidden';

    const img = document.createElement('img');
    img.src = imgUrl;
    img.style.width = '100%';
    img.style.height = '100px';
    img.style.objectFit = 'cover';

    const content = document.createElement('div');
    content.style.padding = '10px';

    const titleElem = document.createElement('h3');
    titleElem.textContent = title;
    titleElem.style.margin = '0 0 5px 0';

    const difficulty = document.createElement('div');
    difficulty.textContent = 'Difficulty';
    difficulty.style.color = '#777';
    difficulty.style.fontSize = '0.8em';

    const ratingContainer = document.createElement('div');
    ratingContainer.style.display = 'flex';
    ratingContainer.style.justifyContent = 'space-between';
    ratingContainer.style.alignItems = 'center';

    const stars = document.createElement('div');
    stars.style.color = '#ffd700';
    for (let i = 0; i < 5; i++) {
        const s = document.createElement('i');
        s.className = `bx ${i < rating ? 'bxs-star' : 'bx-star'}`;
        stars.appendChild(s);
    }

    ratingContainer.appendChild(stars);
    ratingContainer.appendChild(createPlusButton());
    content.appendChild(titleElem);
    content.appendChild(difficulty);
    content.appendChild(ratingContainer);

    card.appendChild(img);
    card.appendChild(content);
    return card;
}

function createPeopleScrollContainer(data) {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.overflowX = 'scroll';
    container.style.gap = '15px';
    container.style.paddingBottom = '15px';
    container.insertAdjacentHTML('afterbegin', `<style>.card-scroll-container::-webkit-scrollbar{display:none;}</style>`);

    data.forEach(item => container.appendChild(createPeopleCard(item.name, item.mutuals, item.img)));

    return container;
}

function createPeopleCard(name, mutuals, imgUrl) {
    const card = document.createElement('div');
    card.style.width = '160px';
    card.style.height = '200px';
    card.style.position = 'relative';
    card.style.background = 'white';
    card.style.borderRadius = '15px';
    card.style.overflow = 'hidden';
    card.style.boxShadow = '0 6px 15px rgba(0,0,0,0.1)';

    const img = document.createElement('img');
    img.src = imgUrl;
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.objectFit = 'cover';

    const content = document.createElement('div');
    content.style.position = 'absolute';
    content.style.bottom = '0';
    content.style.width = '100%';
    content.style.padding = '10px';
    content.style.background = 'linear-gradient(to top, rgba(0,0,0,0.7), rgba(0,0,0,0))';
    content.style.color = 'white';

    const nameElem = document.createElement('h3');
    nameElem.textContent = name;
    nameElem.style.margin = '0 0 5px 0';

    const line = document.createElement('p');
    line.style.display = 'flex';
    line.style.justifyContent = 'space-between';
    line.style.margin = '0';

    const mut = document.createElement('span');
    mut.textContent = `${mutuals} Mutuals`;

    line.appendChild(mut);
    line.appendChild(createPlusButton());

    content.appendChild(nameElem);
    content.appendChild(line);

    card.appendChild(img);
    card.appendChild(content);
    return card;
}

function createPlusButton() {
    const btn = document.createElement('div');
    btn.style.width = '25px';
    btn.style.height = '25px';
    btn.style.background = '#4facfe';
    btn.style.borderRadius = '50%';
    btn.style.display = 'flex';
    btn.style.justifyContent = 'center';
    btn.style.alignItems = 'center';
    btn.style.color = 'white';

    const icon = document.createElement('i');
    icon.className = 'bx bx-plus';

    btn.appendChild(icon);
    return btn;
}
