// API 기본 경로
const API_BASE_URL = '/api/board';
const AUTH_API_URL = '/api/auth';

// DOM 요소
const postList = document.getElementById('post-list');
const popularPostsContainer = document.getElementById('popular-posts');
const emptyState = document.getElementById('empty-state');
const messageBox = document.getElementById('message-box');
const navUserName = document.getElementById('nav-user-name');
const navUserIcon = document.getElementById('nav-user-icon');
const writeButton = document.getElementById('write-button');
const searchInput = document.getElementById('search-input');
const sortSelect = document.getElementById('sort-select');

// 카테고리 탭
const categoryTabs = document.querySelectorAll('.category-tab');

let allPosts = [];
let currentCategory = 'all';
let currentSort = 'latest';
let searchQuery = '';

// 로그인 확인
function checkLogin() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');

    if (!token || !user) {
        return null;
    }

    return JSON.parse(user);
}

// 네비게이션은 common-nav.js에서 처리

// 메시지 표시
function showMessage(message, type) {
    messageBox.textContent = message;
    messageBox.className = `message ${type}`;
    messageBox.style.display = 'block';
    setTimeout(() => {
        messageBox.style.display = 'none';
    }, 3000);
}

// 날짜 포맷팅
function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return '방금 전';
    if (diffMins < 60) return `${diffMins}분 전`;
    if (diffHours < 24) return `${diffHours}시간 전`;
    if (diffDays < 7) return `${diffDays}일 전`;

    return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
}

// HTML 이스케이프
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}


// 게시글 목록 불러오기
async function loadPosts() {
    try {
        const response = await fetch(`${API_BASE_URL}/free/posts`);
        const result = await response.json();

        if (result.success) {
            allPosts = result.data;
            updateCategoryCounts();
            renderPosts();
            renderPopularPosts();
        } else {
            showMessage(result.message, 'error');
        }
    } catch (error) {
        console.error('게시글 목록 로딩 에러:', error);
        showMessage('게시글을 불러오는데 실패했습니다.', 'error');
    }
}

// 카테고리 개수 업데이트
function updateCategoryCounts() {
    const categoryCounts = {
        all: 0,
        free: 0,
        question: 0,
        info: 0
    };

    allPosts.forEach(post => {
        categoryCounts.all++;
        if (post.category) {
            categoryCounts[post.category] = (categoryCounts[post.category] || 0) + 1;
        } else {
            // 카테고리가 없는 게시글은 자유게시판으로
            categoryCounts.free++;
        }
    });

    document.getElementById('count-all').textContent = categoryCounts.all;
    document.getElementById('count-free').textContent = categoryCounts.free;
    document.getElementById('count-question').textContent = categoryCounts.question;
    document.getElementById('count-info').textContent = categoryCounts.info;
}

// 게시글 필터링
function filterPosts() {
    let filtered = [...allPosts];

    // 카테고리 필터
    if (currentCategory !== 'all') {
        filtered = filtered.filter(post => {
            if (post.category) {
                return post.category === currentCategory;
            } else {
                // 카테고리가 없는 게시글은 자유게시판으로 간주
                return currentCategory === 'free';
            }
        });
    }

    // 검색어 필터
    if (searchQuery) {
        filtered = filtered.filter(post =>
            post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
            post.authorName.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }

    // 정렬
    switch (currentSort) {
        case 'popular':
            filtered.sort((a, b) => (b.likes || 0) - (a.likes || 0));
            break;
        case 'views':
            filtered.sort((a, b) => (b.views || 0) - (a.views || 0));
            break;
        case 'latest':
        default:
            filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            break;
    }

    return filtered;
}

// 게시글 목록 렌더링
function renderPosts() {
    const posts = filterPosts();

    if (posts.length === 0) {
        postList.style.display = 'none';
        emptyState.style.display = 'block';
    } else {
        postList.style.display = 'block';
        emptyState.style.display = 'none';

        postList.innerHTML = posts.map(post => `
            <div class="post-item" onclick="window.location.href='/post-detail.html?id=${post.id}'">
                <div class="post-header">
                    ${post.likes > 10 ? '<span class="post-badge">공지</span>' : ''}
                    <span class="post-tag">#피부분석</span>
                    <span class="post-tag">#AI분석</span>
                </div>
                <div class="post-title">${escapeHtml(post.title)}</div>
                <div class="post-meta">
                    <span>👤 ${escapeHtml(post.authorName)}</span>
                    <span>👁 ${post.views || 0}</span>
                    <span>❤️ ${post.likes || 0}</span>
                    <span>💬 ${post.commentCount || 0}</span>
                    <span>⏰ ${formatDate(post.createdAt)}</span>
                </div>
            </div>
        `).join('');
    }
}

// 인기 게시글 렌더링
function renderPopularPosts() {
    const popularPosts = [...allPosts]
        .sort((a, b) => (b.likes || 0) - (a.likes || 0))
        .slice(0, 5);

    if (popularPosts.length === 0) {
        popularPostsContainer.innerHTML = '<p style="color: #999; text-align: center;">게시글이 없습니다</p>';
        return;
    }

    popularPostsContainer.innerHTML = popularPosts.map((post, index) => `
        <div class="popular-post" onclick="window.location.href='/post-detail.html?id=${post.id}'">
            <div>
                <span class="popular-rank">${index + 1}</span>
                <span class="popular-post-title">${escapeHtml(post.title)}</span>
            </div>
            <div class="popular-post-stats">
                <span>❤️ ${post.likes || 0}</span>
                <span>💬 ${post.commentCount || 0}</span>
            </div>
        </div>
    `).join('');
}

// 카테고리 탭 클릭 이벤트
categoryTabs.forEach(tab => {
    tab.addEventListener('click', () => {
        categoryTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        currentCategory = tab.dataset.category;
        renderPosts();
    });
});

// 검색 이벤트
searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value;
    renderPosts();
});

// 정렬 변경 이벤트
sortSelect.addEventListener('change', (e) => {
    currentSort = e.target.value;
    renderPosts();
});

// 글쓰기 버튼
writeButton.addEventListener('click', () => {
    const user = checkLogin();
    if (!user) {
        alert('로그인이 필요합니다.');
        window.location.href = 'login.html';
        return;
    }
    window.location.href = '/post-write.html';
});

// 초기화
loadPosts();
