const menuToggle = document.querySelector('.menu-toggle');
const primaryNav = document.querySelector('.primary-nav');

menuToggle.addEventListener('click', () => {
  const isOpen = menuToggle.getAttribute('aria-expanded') === 'true';
  menuToggle.setAttribute('aria-expanded', String(!isOpen));
  menuToggle.setAttribute('aria-label', isOpen ? '메뉴 열기' : '메뉴 닫기');
  primaryNav.classList.toggle('is-open', !isOpen);
});

primaryNav.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', '메뉴 열기');
    primaryNav.classList.remove('is-open');
  });
});

document.querySelector('.copy-address').addEventListener('click', async (event) => {
  const button = event.currentTarget;
  const status = document.querySelector('.copy-status');
  try {
    await navigator.clipboard.writeText(button.dataset.copy);
    status.textContent = '주소를 복사했습니다.';
  } catch {
    status.textContent = '주소 복사에 실패했습니다. 주소를 직접 선택해 주세요.';
  }
});

const boardContent = {
  notice: { title: '공지사항', empty: '등록된 공지사항이 없습니다.', description: '새로운 소식이 등록되면 이곳에서 확인하실 수 있습니다.' },
  sermons: { title: '설교와 말씀', empty: '등록된 설교 자료가 없습니다.', description: '예배 말씀과 자료를 준비하고 있습니다.' },
  gallery: { title: '교회 앨범', empty: '등록된 앨범이 없습니다.', description: '교회 공동체의 소식을 사진으로 나눌 예정입니다.' },
  weekly: { title: '주보·자료', empty: '등록된 주보와 자료가 없습니다.', description: '주보 및 교회 자료를 준비하고 있습니다.' },
};

function selectBoard(boardName) {
  const selected = boardContent[boardName] ? boardName : 'notice';
  document.querySelectorAll('.board-tab').forEach((tab) => {
    const isActive = tab.dataset.board === selected;
    tab.classList.toggle('is-active', isActive);
    tab.setAttribute('aria-selected', String(isActive));
  });
  document.querySelector('#board-heading').textContent = boardContent[selected].title;
  document.querySelector('#board-empty-title').textContent = boardContent[selected].empty;
  document.querySelector('#board-empty-description').textContent = boardContent[selected].description;
}

document.querySelectorAll('.board-tab').forEach((tab) => {
  tab.addEventListener('click', () => selectBoard(tab.dataset.board));
});

const boardAnchorToKey = { sermons: 'sermons', gallery: 'gallery', weekly: 'weekly' };
document.querySelectorAll('.nav-submenu a[href^="#"]').forEach((link) => {
  link.addEventListener('click', () => {
    const boardKey = boardAnchorToKey[link.getAttribute('href').slice(1)];
    if (boardKey) selectBoard(boardKey);
  });
});

const searchToggle = document.querySelector('.search-toggle');
const searchPanel = document.querySelector('#site-search');
const searchInput = document.querySelector('#site-search-input');
const searchResults = document.querySelector('#search-results');

function closeSearch() {
  searchPanel.hidden = true;
  searchToggle.setAttribute('aria-expanded', 'false');
  searchToggle.setAttribute('aria-label', '사이트 검색 열기');
}

searchToggle.addEventListener('click', () => {
  const open = searchToggle.getAttribute('aria-expanded') !== 'true';
  searchToggle.setAttribute('aria-expanded', String(open));
  searchToggle.setAttribute('aria-label', open ? '사이트 검색 닫기' : '사이트 검색 열기');
  searchPanel.hidden = !open;
  if (open) searchInput.focus();
});

document.querySelector('.site-search-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const query = searchInput.value.trim().toLocaleLowerCase('ko');
  searchResults.replaceChildren();
  if (!query) {
    searchResults.textContent = '검색어를 입력해 주세요.';
    return;
  }

  const matches = [...document.querySelectorAll('main section[id]')].filter((section) =>
    section.textContent.toLocaleLowerCase('ko').includes(query),
  );
  if (!matches.length) {
    searchResults.textContent = '검색 결과가 없습니다.';
    return;
  }

  matches.forEach((section) => {
    const heading = section.querySelector('h1, h2, h3');
    const link = document.createElement('a');
    link.href = `#${section.id}`;
    link.textContent = heading ? heading.textContent.trim() : section.id;
    link.addEventListener('click', () => {
      const boardKey = boardAnchorToKey[section.id];
      if (boardKey) selectBoard(boardKey);
      closeSearch();
    }, { once: true });
    searchResults.append(link);
  });
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !searchPanel.hidden) closeSearch();
});
