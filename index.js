/**
 * main.js
 * * 动态创建和渲染应用界面，模仿提供的HTML结构和样式。
 */

document.addEventListener('DOMContentLoaded', () => {
    const body = document.body;
    body.style.margin = '0';
    body.style.fontFamily = 'sans-serif';
    body.style.backgroundColor = '#f4f7f6';

    // 1. 创建并渲染 Header 区域
    const headerContainer = document.createElement('div');
    headerContainer.className = 'header-container';
    headerContainer.style.background = 'linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)';
    headerContainer.style.padding = '25px 20px 40px 20px';
    headerContainer.style.borderBottomLeftRadius = '35px';
    headerContainer.style.borderBottomRightRadius = '35px';
    headerContainer.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.08)';

    // Header Top (Logo, Notif, User Icon)
    const headerTop = document.createElement('div');
    headerTop.className = 'header-top';
    headerTop.style.display = 'flex';
    headerTop.style.justifyContent = 'space-between';
    headerTop.style.alignItems = 'center';

    const logoStats = createLogo('bx-spark', 'Statistics');
    const notification = createIconWithBadge('bxs-bell');
    const userIcon = createProfileIcon('bxs-user');

    headerTop.appendChild(logoStats);
    headerTop.appendChild(notification);
    headerTop.appendChild(userIcon);
    
    // Search Container
    const searchContainer = createSearchBar();

    headerContainer.appendChild(headerTop);
    headerContainer.appendChild(searchContainer);
    body.appendChild(headerContainer);

    // 2. 创建并渲染 Main Content
    const mainContent = document.createElement('div');
    mainContent.className = 'main-content';
    mainContent.style.padding = '0 20px 20px 20px';
    mainContent.style.marginTop = '-25px'; // 部分覆盖在 header 上

    // Tabs
    mainContent.appendChild(createTabs(['All', 'Skills', 'Friends']));

    // Skill Up Section
    mainContent.appendChild(createSectionTitle('Skill Up'));
    mainContent.appendChild(createSkillScrollContainer([
        { title: 'Crochet', rating: 3, img: 'https://via.placeholder.com/180x100?text=Crochet+Image' },
        { title: '100,000 steps in 10 days', rating: 4, img: 'https://via.placeholder.com/180x100?text=Running+Group' },
        { title: 'Learn a new skill', rating: 0, img: 'https://via.placeholder.com/180x100?text=New+Skill' }
    ]));

    // People You May Know Section
    mainContent.appendChild(createSectionTitle('People you may know', '20px'));
    mainContent.appendChild(createPeopleScrollContainer([
        { name: 'Kyle Brown', mutuals: '3+', img: 'https://via.placeholder.com/160x200?text=Kyle+Brown' },
        { name: 'Felisha L', mutuals: '1+', img: 'https://via.placeholder.com/160x200?text=Felisha+L' },
        { name: 'Jane D', mutuals: '2+', img: 'https://via.placeholder.com/160x200?text=Jane+D' }
    ]));

    body.appendChild(mainContent);
});

// --- Helper Functions to build components ---

/** 创建应用 Logo 和文字 */
function createLogo(iconClass, text) {
    const logoStats = document.createElement('div');
    logoStats.className = 'logo-stats';
    logoStats.style.display = 'flex';
    logoStats.style.alignItems = 'center';
    logoStats.style.fontSize = '1.5em';
    logoStats.style.fontWeight = 'bold';
    logoStats.style.color = '#112a4d';

    const icon = document.createElement('i');
    icon.className = `bx ${iconClass}`;
    icon.style.marginRight = '5px';

    const span = document.createElement('span');
    span.textContent = text;

    logoStats.appendChild(icon);
    logoStats.appendChild(span);
    return logoStats;
}

/** 创建带通知气泡的图标 */
function createIconWithBadge(iconClass) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.style.position = 'relative';

    const icon = document.createElement('i');
    icon.className = `bx ${iconClass}`;
    icon.style.fontSize = '1.8em';
    icon.style.color = '#fff';

    const badge = document.createElement('span');
    badge.className = 'notification-badge';
    badge.style.position = 'absolute';
    badge.style.top = '0';
    badge.style.right = '0';
    badge.style.width = '10px';
    badge.style.height = '10px';
    badge.style.borderRadius = '50%';
    badge.style.backgroundColor = 'red';
    badge.style.border = '2px solid #c2e9fb';

    notification.appendChild(icon);
    notification.appendChild(badge);
    return notification;
}

/** 创建用户图标 (右上角) */
function createProfileIcon(iconClass) {
    const userIcon = document.createElement('div');
    userIcon.className = 'user-icon';
    userIcon.style.width = '40px';
    userIcon.style.height = '40px';
    userIcon.style.backgroundColor = '#fff';
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

/** 创建搜索栏 */
function createSearchBar() {
    const searchContainer = document.createElement('div');
    searchContainer.className = 'search-container';
    searchContainer.style.display = 'flex';
    searchContainer.style.alignItems = 'center';
    searchContainer.style.backgroundColor = 'white';
    searchContainer.style.padding = '8px 15px';
    searchContainer.style.marginTop = '20px';
    searchContainer.style.borderRadius = '25px';
    searchContainer.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
    searchContainer.style.maxWidth = '100%';

    const searchIcon = document.createElement('i');
    searchIcon.className = 'bx bx-search';
    searchIcon.style.color = '#777';
    searchIcon.style.marginRight = '10px';

    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.className = 'search-bar-input';
    searchInput.placeholder = 'Search...';
    searchInput.style.border = 'none';
    searchInput.style.outline = 'none';
    searchInput.style.flexGrow = '1';
    searchInput.style.fontSize = '1em';
    searchInput.style.padding = '0';

    searchContainer.appendChild(searchIcon);
    searchContainer.appendChild(searchInput);
    return searchContainer;
}

/** 创建 Tab 导航栏 */
function createTabs(names) {
    const tabs = document.createElement('div');
    tabs.className = 'tabs';
    tabs.style.display = 'flex';
    tabs.style.gap = '10px';
    tabs.style.marginBottom = '20px';

    names.forEach((name, index) => {
        const button = document.createElement('button');
        button.className = 'tab-button';
        button.textContent = name;
        button.style.border = 'none';
        button.style.padding = '10px 20px';
        button.style.fontWeight = '600';
        button.style.cursor = 'pointer';
        button.style.backgroundColor = 'transparent';
        button.style.color = '#777';

        if (index === 0) { // 模拟 'All' 按钮的选中状态
            button.className += ' active';
            button.style.backgroundColor = '#4facfe';
            button.style.color = 'white';
            button.style.borderRadius = '20px';
            button.style.boxShadow = '0 4px 8px rgba(79, 172, 254, 0.4)';
        } else {
            button.style.borderRadius = '20px';
        }

        tabs.appendChild(button);
    });
    return tabs;
}

/** 创建章节标题 */
function createSectionTitle(text, marginTop = '0') {
    const title = document.createElement('h2');
    title.className = 'section-title';
    title.textContent = text;
    title.style.fontSize = '1.4em';
    title.style.fontWeight = 'bold';
    title.style.color = '#333';
    title.style.margin = `${marginTop} 0 15px 0`;
    return title;
}

/** 创建卡片横向滚动容器 (Skill Up) */
function createSkillScrollContainer(data) {
    const container = document.createElement('div');
    container.className = 'card-scroll-container';
    container.style.display = 'flex';
    container.style.overflowX = 'scroll'; // 关键：横向滚动
    container.style.paddingBottom = '15px'; // 避免内容被滚动条遮挡
    container.style.gap = '15px';
    container.style.maxWidth = '100%';
    container.style.msOverflowStyle = 'none'; // IE and Edge
    container.style.scrollbarWidth = 'none'; // Firefox

    // 隐藏 Webkit/Blink 滚动条
    container.insertAdjacentHTML('afterbegin', `<style>.card-scroll-container::-webkit-scrollbar { display: none; }</style>`);

    data.forEach(item => {
        container.appendChild(createSkillCard(item.title, item.rating, item.img));
    });

    const nextArrow = document.createElement('div');
    nextArrow.className = 'next-arrow'; // 模拟截图中的箭头，但在实际滚动中不必要
    container.appendChild(nextArrow);

    return container;
}

/** 创建单个技能卡片 */
function createSkillCard(title, rating, imgUrl) {
    const card = document.createElement('div');
    card.className = 'skill-card';
    card.style.flexShrink = '0';
    card.style.width = '180px';
    card.style.backgroundColor = 'white';
    card.style.borderRadius = '15px';
    card.style.boxShadow = '0 6px 15px rgba(0, 0, 0, 0.1)';
    card.style.overflow = 'hidden';

    const imageDiv = document.createElement('div');
    imageDiv.className = 'skill-card-image';
    const image = document.createElement('img');
    image.src = imgUrl;
    image.alt = title;
    image.style.width = '100%';
    image.style.height = '100px';
    image.style.objectFit = 'cover';
    imageDiv.appendChild(image);

    const content = document.createElement('div');
    content.className = 'skill-card-content';
    content.style.padding = '10px';

    const titleElem = document.createElement('h3');
    titleElem.textContent = title;
    titleElem.style.fontSize = '1.1em';
    titleElem.style.margin = '0 0 5px 0';
    titleElem.style.whiteSpace = 'nowrap';
    titleElem.style.overflow = 'hidden';
    titleElem.style.textOverflow = 'ellipsis';

    const difficulty = document.createElement('div');
    difficulty.className = 'difficulty';
    difficulty.textContent = 'Difficulty';
    difficulty.style.fontSize = '0.8em';
    difficulty.style.color = '#777';

    const ratingContainer = document.createElement('div');
    ratingContainer.className = 'rating';
    ratingContainer.style.display = 'flex';
    ratingContainer.style.justifyContent = 'space-between';
    ratingContainer.style.alignItems = 'center';
    ratingContainer.style.marginTop = '5px';

    const starContainer = document.createElement('div');
    starContainer.style.color = '#ffd700'; // 金色星星
    for (let i = 0; i < 5; i++) {
        const star = document.createElement('i');
        star.className = `bx ${i < rating ? 'bxs-star' : 'bx-star'}`;
        star.style.fontSize = '1em';
        starContainer.appendChild(star);
    }

    const addButton = createPlusButton();

    ratingContainer.appendChild(starContainer);
    ratingContainer.appendChild(addButton);

    content.appendChild(titleElem);
    content.appendChild(difficulty);
    content.appendChild(ratingContainer);
    card.appendChild(imageDiv);
    card.appendChild(content);

    return card;
}

/** 创建卡片横向滚动容器 (People) */
function createPeopleScrollContainer(data) {
    const container = document.createElement('div');
    container.className = 'card-scroll-container';
    container.style.display = 'flex';
    container.style.overflowX = 'scroll'; // 关键：横向滚动
    container.style.paddingBottom = '15px';
    container.style.gap = '15px';
    container.style.msOverflowStyle = 'none';
    container.style.scrollbarWidth = 'none';
    container.insertAdjacentHTML('afterbegin', `<style>.card-scroll-container::-webkit-scrollbar { display: none; }</style>`);

    data.forEach(item => {
        container.appendChild(createPeopleCard(item.name, item.mutuals, item.img));
    });

    return container;
}

/** 创建单个好友推荐卡片 */
function createPeopleCard(name, mutuals, imgUrl) {
    const card = document.createElement('div');
    card.className = 'people-card';
    card.style.flexShrink = '0';
    card.style.width = '160px';
    card.style.height = '200px';
    card.style.backgroundColor = 'white';
    card.style.borderRadius = '15px';
    card.style.boxShadow = '0 6px 15px rgba(0, 0, 0, 0.1)';
    card.style.overflow = 'hidden';
    card.style.position = 'relative';

    const image = document.createElement('img');
    image.className = 'people-card-bg-image';
    image.src = imgUrl;
    image.alt = name;
    image.style.width = '100%';
    image.style.height = '100%';
    image.style.objectFit = 'cover';
    card.appendChild(image);

    const content = document.createElement('div');
    content.className = 'people-card-content';
    content.style.position = 'absolute';
    content.style.bottom = '0';
    content.style.left = '0';
    content.style.width = '100%';
    content.style.padding = '10px';
    // 渐变背景让文字清晰可见
    content.style.background = 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0) 100%)';
    content.style.color = 'white';

    const nameElem = document.createElement('h3');
    nameElem.textContent = name;
    nameElem.style.fontSize = '1.2em';
    nameElem.style.margin = '0 0 5px 0';
    
    const infoLine = document.createElement('p');
    infoLine.style.display = 'flex';
    infoLine.style.justifyContent = 'space-between';
    infoLine.style.alignItems = 'center';
    infoLine.style.margin = '0';
    
    const mutualsSpan = document.createElement('span');
    mutualsSpan.textContent = `${mutuals} Mutuals`;
    mutualsSpan.style.fontSize = '0.9em';

    const addButton = createPlusButton(); // 复用 "+" 按钮

    infoLine.appendChild(mutualsSpan);
    infoLine.appendChild(addButton);
    
    content.appendChild(nameElem);
    content.appendChild(infoLine);
    card.appendChild(content);

    return card;
}

/** 创建蓝色的 "+" 按钮 */
function createPlusButton() {
    const addButton = document.createElement('div');
    addButton.className = 'add-button';
    addButton.style.width = '25px';
    addButton.style.height = '25px';
    addButton.style.backgroundColor = '#4facfe';
    addButton.style.color = 'white';
    addButton.style.borderRadius = '50%';
    addButton.style.fontSize = '1.2em';
    addButton.style.display = 'flex';
    addButton.style.justifyContent = 'center';
    addButton.style.alignItems = 'center';
    addButton.style.cursor = 'pointer';

    const icon = document.createElement('i');
    icon.className = 'bx bx-plus';
    addButton.appendChild(icon);
    return addButton;
}