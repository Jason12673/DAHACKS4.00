/**
 * index.js — CLEAN VERSION WITH BACKEND INTEGRATION
 * Builds UI + fetches users from backend.
 */

document.addEventListener('DOMContentLoaded', () => {
    setupBaseStyles();
    buildHeader();
    buildMainContent();
    buildBackendOutput();
    loadUsers(); // Load backend users
});

/* =========================
   BASE STYLES
   ========================= */
function setupBaseStyles() {
    document.body.style.margin = '0';
    document.body.style.fontFamily = 'sans-serif';
    document.body.style.backgroundColor = '#f4f7f6';
}

/* =========================
   HEADER
   ========================= */
function buildHeader() {
    const header = document.createElement('div');
    header.style.background = 'linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)';
    header.style.padding = '25px 20px 40px 20px';
    header.style.borderBottomLeftRadius = '35px';
    header.style.borderBottomRightRadius = '35px';
    header.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.08)';

    const top = document.createElement('div');
    top.style.display = 'flex';
    top.style.justifyContent = 'space-between';
    top.style.alignItems = 'center';

    top.appendChild(createLogo('bx-spark', 'Statistics'));
    top.appendChild(createIconWithBadge('bxs-bell'));
    top.appendChild(createProfileIcon('bxs-user'));

    header.appendChild(top);
    header.appendChild(createSearchBar());
    document.body.appendChild(header);
}

/* =========================
   MAIN CONTENT SECTION
   ========================= */
function buildMainContent() {
    const main = document.createElement('div');
    main.style.padding = '0 20px 20px 20px';
    main.style.marginTop = '-25px';

    main.appendChild(createTabs(['All', 'Skills', 'Friends']));
    main.appendChild(createSectionTitle('Skill Up'));
    main.appendChild(createSkillScrollContainer([
        { title: 'Crochet', rating: 3, img: 'https://via.placeholder.com/180x100?text=Crochet' },
        { title: '100,000 steps', rating: 4, img: 'https://via.placeholder.com/180x100?text=Steps' },
        { title: 'Learn a New Skill', rating: 0, img: 'https://via.placeholder.com/180x100?text=New+Skill' }
    ]));

    main.appendChild(createSectionTitle('People you may know', '20px'));
    main.appendChild(createPeopleScrollContainer([
        { name: 'Kyle Brown', mutuals: '3+', img: 'https://via.placeholder.com/160x200?text=Kyle' },
        { name: 'Felisha L', mutuals: '1+', img: 'https://via.placeholder.com/160x200?text=Felisha' },
        { name: 'Jane D', mutuals: '2+', img: 'https://via.placeholder.com/160x200?text=Jane' }
    ]));

    document.body.appendChild(main);
}

/* =========================
   BACKEND OUTPUT (for testing)
   ========================= */
function buildBackendOutput() {
    const box = document.createElement('pre');
    box.id = "backend-output";
    box.style.background = '#fff';
    box.style.margin = '20px';
    box.style.padding = '20px';
    box.style.borderRadius = '10px';
    box.style.boxShadow = '0 4px 10px rgba(0,0,0,0.1)';
    box.style.whiteSpace = 'pre-wrap';
    box.textContent = "Loading users from backend...";
    document.body.appendChild(box);
}

/* =========================
   BACKEND INTEGRATION
   ========================= */
async function loadUsers() {
    const box = document.getElementById("backend-output");

    try {
        const res = await fetch("https://yaritza-overpowering-homely.ngrok-free.dev/api/users");
        const data = await res.json();

        box.textContent = JSON.stringify(data, null, 2);
    } catch (err) {
        box.textContent = "❌ Error loading users:\n" + err;
    }
}

/* =========================
   UI COMPONENT HELPERS
   ========================= */

function createLogo(iconClass, text) {
    const wrap = document.createElement('div');
    wrap.style.display = 'flex';
    wrap.style.alignItems = 'center';
    wrap.style.fontSize = '1.5em';
    wrap.style.fontWeight = 'bold';
    wrap.style.color = '#112a4d';

    const icon = document.createElement('i');
    icon.className = `bx ${iconClass}`;
    icon.style.marginRight = '5px';

    const label = document.createElement('span');
    label.textContent = text;

    wrap.appendChild(icon);
    wrap.appendChild(label);
    return wrap;
}

function createIconWithBadge(iconClass) {
    const wrap = document.createElement('div');
    wrap.style.position = 'relative';

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
    badge.style.background = 'red';
    badge.style.border = '2px solid #c2e9fb';

    wrap.appendChild(icon);
    wrap.appendChild(badge);

    return wrap;
}

function createProfileIcon(iconClass) {
    const wrap = document.createElement('div');
    wrap.style.width = '40px';
    wrap.style.height = '40px';
    wrap.style.background = '#fff';
    wrap.style.borderRadius = '50%';
    wrap.style.display = 'flex';
    wrap.style.justifyContent = 'center';
    wrap.style.alignItems = 'center';

    const icon = document.createElement('i');
    icon.className = `bx ${iconClass}`;
    icon.style.fontSize = '1.5em';
    icon.style.color = '#333';

    wrap.appendChild(icon);
    return wrap;
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
    input.style.flexGrow = '1';
    input.style.border = 'none';
    input.style.outline = 'none';

    box.appendChild(icon);
    box.appendChild(input);
    return box;
}

function createTabs(list) {
    const tabs = document.createElement('div');
    tabs.style.display = 'flex';
    tabs.style.gap = '10px';
    tabs.style.marginBottom = '20px';

    list.forEach((name, i) => {
        const btn = document.createElement('button');
        btn.textContent = name;
        btn.style.padding = '10px 20px';
        btn.style.borderRadius = '20px';
        btn.style.border = 'none';
        btn.style.fontWeight = '600';
        btn.style.cursor = 'pointer';

        if (i === 0) {
            btn.style.background = '#4facfe';
            btn.style.color = 'white';
            btn.style.boxShadow = '0 4px 8px rgba(79,172,254,0.4)';
        } else {
            btn.style.background = '#eee';
            btn.style.color = '#555';
        }

        tabs.appendChild(btn);
    });

    return tabs;
}

function createSectionTitle(text, mt = '0') {
    const h = document.createElement('h2');
    h.textContent = text;
    h.style.fontSize = '1.4em';
    h.style.fontWeight = 'bold';
    h.style.color = '#333';
    h.style.margin = `${mt} 0 15px 0`;
    return h;
}

function createSkillScrollContainer(data) {
    const wrap = document.createElement('div');
    wrap.style.display = 'flex';
    wrap.style.overflowX = 'scroll';
    wrap.style.gap = '15px';
    wrap.style.paddingBottom = '15px';

    data.forEach(d => wrap.appendChild(createSkillCard(d.title, d.rating, d.img)));

    return wrap;
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

    const diff = document.createElement('p');
    diff.textContent = 'Difficulty';
    diff.style.fontSize = '0.8em';
    diff.style.color = '#777';
    diff.style.margin = '0';

    const ratingWrap = document.createElement('div');
    ratingWrap.style.display = 'flex';
    ratingWrap.style.justifyContent = 'space-between';
    ratingWrap.style.alignItems = 'center';

    const stars = document.createElement('div');
    stars.style.color = '#ffd700';

    for (let i = 0; i < 5; i++) {
        const s = document.createElement('i');
        s.className = `bx ${i < rating ? 'bxs-star' : 'bx-star'}`;
        stars.appendChild(s);
    }

    ratingWrap.appendChild(stars);
    ratingWrap.appendChild(createPlusButton());

    content.appendChild(titleElem);
    content.appendChild(diff);
    content.appendChild(ratingWrap);

    card.appendChild(img);
    card.appendChild(content);
    return card;
}

function createPeopleScrollContainer(data) {
    const wrap = document.createElement('div');
    wrap.style.display = 'flex';
    wrap.style.overflowX = 'scroll';
    wrap.style.gap = '15px';

    data.forEach(d => wrap.appendChild(createPeopleCard(d.name, d.mutuals, d.img)));
    return wrap;
}

function createPeopleCard(name, mutuals, imgUrl) {
    const card = document.createElement('div');
    card.style.width = '160px';
    card.style.height = '200px';
    card.style.borderRadius = '15px';
    card.style.position = 'relative';
    card.style.overflow = 'hidden';
    card.style.boxShadow = '0 6px 15px rgba(0,0,0,0.1)';
    card.style.background = '#fff';

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
    content.style.color = 'white';
    content.style.background = 'linear-gradient(to top, rgba(0,0,0,0.7), rgba(0,0,0,0))';

    const nameElem = document.createElement('h3');
    nameElem.textContent = name;
    nameElem.style.margin = '0 0 5px 0';

    const line = document.createElement('div');
    line.style.display = 'flex';
    line.style.justifyContent = 'space-between';
    line.style.alignItems = 'center';

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
