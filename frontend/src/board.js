// API 기본 경로
const API_BASE_URL = '/api/board';

// DOM 요소
const postListBody = document.getElementById('post-list-body');
const emptyState = document.getElementById('empty-state');
const postTable = document.getElementById('post-table');
const messageBox = document.getElementById('message-box');
const userNameSpan = document.getElementById('user-name');
const profileButton = document.getElementById('profile-button');
const logoutButton = document.getElementById('logout-button');
const writeButton = document.getElementById('write-button');
const refreshButton = document.getElementById('refresh-button');

// 로그인 확인
function checkLogin() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');

    if (!token || !user) {
        alert('로그인이 필요합니다.');
        window.location.href = '/index.html';
        return null;
    }

    return JSON.parse(user);
}

// 메시지 표시
function showMessage(message, type) {
    messageBox.textContent = message;
    messageBox.className = `message ${type}`;
    setTimeout(() => {
        messageBox.textContent = '';
        messageBox.className = 'message';
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

// 게시글 목록 불러오기
async function loadPosts() {
    try {
        const response = await fetch(`${API_BASE_URL}/free/posts`);
        const result = await response.json();

        if (result.success) {
            const posts = result.data;

            if (posts.length === 0) {
                postTable.style.display = 'none';
                emptyState.style.display = 'block';
            } else {
                postTable.style.display = 'table';
                emptyState.style.display = 'none';
                renderPosts(posts);
            }
        } else {
            showMessage(result.message, 'error');
        }
    } catch (error) {
        console.error('게시글 목록 로딩 에러:', error);
        showMessage('게시글을 불러오는데 실패했습니다.', 'error');
    }
}

// 게시글 목록 렌더링
function renderPosts(posts) {
    postListBody.innerHTML = '';

    posts.forEach((post, index) => {
        const row = document.createElement('tr');
        row.onclick = () => {
            window.location.href = `/post-detail.html?id=${post.id}`;
        };

        row.innerHTML = `
            <td class="text-center">${posts.length - index}</td>
            <td>
                <div class="post-title">${escapeHtml(post.title)}</div>
                <div class="post-meta">
                    <span>💬 ${post.commentCount}</span>
                    <span>❤️ ${post.likeCount}</span>
                </div>
            </td>
            <td>${escapeHtml(post.authorName)}</td>
            <td class="text-center">${post.views}</td>
            <td class="text-center">${post.likeCount}</td>
            <td>${formatDate(post.createdAt)}</td>
        `;

        postListBody.appendChild(row);
    });
}

// HTML 이스케이프 (XSS 방지)
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 로그아웃
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    showMessage('로그아웃되었습니다.', 'success');
    setTimeout(() => {
        window.location.href = '/index.html';
    }, 1000);
}

// 글쓰기 페이지로 이동
function goToWritePage() {
    window.location.href = '/post-write.html';
}

// 프로필 페이지로 이동
function goToProfilePage() {
    window.location.href = '/profile.html';
}

// 이벤트 리스너
profileButton.addEventListener('click', goToProfilePage);
logoutButton.addEventListener('click', logout);
writeButton.addEventListener('click', goToWritePage);
refreshButton.addEventListener('click', loadPosts);

// 페이지 로드 시 실행
document.addEventListener('DOMContentLoaded', () => {
    const user = checkLogin();
    if (user) {
        userNameSpan.textContent = `${user.name}님`;
        loadPosts();
    }
});
