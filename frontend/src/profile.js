// API 기본 경로
const AUTH_API_URL = '/api/auth';

// DOM 요소
const messageBox = document.getElementById('message-box');
const userNameSpan = document.getElementById('user-name');
const profileButton = document.getElementById('profile-button');
const boardButton = document.getElementById('board-button');
const logoutButton = document.getElementById('logout-button');

const profileEmail = document.getElementById('profile-email');
const profileName = document.getElementById('profile-name');
const profileCreated = document.getElementById('profile-created');

const profileForm = document.getElementById('profile-form');
const editNameInput = document.getElementById('edit-name');
const currentPasswordInput = document.getElementById('current-password');
const newPasswordInput = document.getElementById('new-password');
const cancelEditButton = document.getElementById('cancel-edit');

const myPostsList = document.getElementById('my-posts-list');
const myCommentsList = document.getElementById('my-comments-list');
const postsEmpty = document.getElementById('posts-empty');
const commentsEmpty = document.getElementById('comments-empty');

const deleteAccountBtn = document.getElementById('delete-account-btn');

// 현재 사용자 정보
let currentUser = null;

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
    messageBox.style.display = 'block';
    setTimeout(() => {
        messageBox.textContent = '';
        messageBox.className = 'message';
        messageBox.style.display = 'none';
    }, 3000);
}

// API 요청 헬퍼
async function apiRequest(url, options = {}) {
    try {
        const response = await fetch(url, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        });
        return await response.json();
    } catch (error) {
        console.error('API 요청 에러:', error);
        return { success: false, message: '네트워크 오류가 발생했습니다.' };
    }
}

// 날짜 포맷팅
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// 프로필 정보 로드
async function loadProfile() {
    const result = await apiRequest(`${AUTH_API_URL}/profile?userId=${currentUser.id}`, {
        method: 'GET'
    });

    if (result.success) {
        const profile = result.data;
        profileEmail.textContent = profile.email;
        profileName.textContent = profile.name;
        profileCreated.textContent = formatDate(profile.createdAt);
        editNameInput.value = profile.name;
    } else {
        showMessage(result.message, 'error');
    }
}

// 프로필 수정
async function updateProfile(e) {
    e.preventDefault();

    const name = editNameInput.value.trim();
    const currentPassword = currentPasswordInput.value;
    const newPassword = newPasswordInput.value;

    // 이름도 비밀번호도 변경하지 않는 경우
    if (!name && !currentPassword && !newPassword) {
        showMessage('변경할 내용을 입력해주세요.', 'error');
        return;
    }

    // 비밀번호 변경 시 검증
    if ((currentPassword && !newPassword) || (!currentPassword && newPassword)) {
        showMessage('현재 비밀번호와 새 비밀번호를 모두 입력해주세요.', 'error');
        return;
    }

    const data = {
        userId: currentUser.id
    };

    if (name) data.name = name;
    if (currentPassword) data.currentPassword = currentPassword;
    if (newPassword) data.newPassword = newPassword;

    const result = await apiRequest(`${AUTH_API_URL}/profile`, {
        method: 'PUT',
        body: JSON.stringify(data)
    });

    if (result.success) {
        showMessage(result.message, 'success');

        // localStorage 업데이트
        const updatedUser = {
            ...currentUser,
            name: result.data.name
        };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        currentUser = updatedUser;
        userNameSpan.textContent = `${updatedUser.name}님`;

        // 폼 초기화
        currentPasswordInput.value = '';
        newPasswordInput.value = '';

        // 프로필 다시 로드
        await loadProfile();
    } else {
        showMessage(result.message || '프로필 수정에 실패했습니다.', 'error');
    }
}

// 내가 쓴 글 로드
async function loadMyPosts() {
    const result = await apiRequest(`${AUTH_API_URL}/my-posts?userId=${currentUser.id}`, {
        method: 'GET'
    });

    if (result.success) {
        const posts = result.data;

        if (posts.length === 0) {
            myPostsList.style.display = 'none';
            postsEmpty.style.display = 'block';
        } else {
            myPostsList.style.display = 'block';
            postsEmpty.style.display = 'none';
            renderMyPosts(posts);
        }
    } else {
        showMessage(result.message, 'error');
    }
}

// 내가 쓴 글 렌더링
function renderMyPosts(posts) {
    myPostsList.innerHTML = '';

    posts.forEach(post => {
        const li = document.createElement('li');
        li.className = 'activity-item';
        li.onclick = () => {
            window.location.href = `/post-detail.html?id=${post.id}`;
        };

        li.innerHTML = `
            <div class="activity-title">${escapeHtml(post.title)}</div>
            <div class="activity-content">${escapeHtml(post.content)}</div>
            <div class="activity-meta">조회 ${post.views} · ${formatDate(post.createdAt)}</div>
        `;

        myPostsList.appendChild(li);
    });
}

// 내가 쓴 댓글 로드
async function loadMyComments() {
    const result = await apiRequest(`${AUTH_API_URL}/my-comments?userId=${currentUser.id}`, {
        method: 'GET'
    });

    if (result.success) {
        const comments = result.data;

        if (comments.length === 0) {
            myCommentsList.style.display = 'none';
            commentsEmpty.style.display = 'block';
        } else {
            myCommentsList.style.display = 'block';
            commentsEmpty.style.display = 'none';
            renderMyComments(comments);
        }
    } else {
        showMessage(result.message, 'error');
    }
}

// 내가 쓴 댓글 렌더링
function renderMyComments(comments) {
    myCommentsList.innerHTML = '';

    comments.forEach(comment => {
        const li = document.createElement('li');
        li.className = 'activity-item';
        li.onclick = () => {
            window.location.href = `/post-detail.html?id=${comment.postId}`;
        };

        li.innerHTML = `
            <div class="activity-title">게시글: ${escapeHtml(comment.postTitle)}</div>
            <div class="activity-content">${escapeHtml(comment.content)}</div>
            <div class="activity-meta">${formatDate(comment.createdAt)}</div>
        `;

        myCommentsList.appendChild(li);
    });
}

// HTML 이스케이프 (XSS 방지)
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 탭 전환
function switchTab(tabName) {
    // 모든 탭 비활성화
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });

    // 선택한 탭 활성화
    const selectedTab = document.querySelector(`[data-tab="${tabName}"]`);
    const selectedContent = document.getElementById(`${tabName}-content`);

    if (selectedTab) selectedTab.classList.add('active');
    if (selectedContent) selectedContent.classList.add('active');

    // 데이터 로드
    if (tabName === 'posts') {
        loadMyPosts();
    } else if (tabName === 'comments') {
        loadMyComments();
    }
}

// 회원 탈퇴
async function deleteAccount() {
    const confirmed = confirm('정말로 회원 탈퇴하시겠습니까?\n모든 데이터가 영구적으로 삭제됩니다.');
    if (!confirmed) return;

    const password = prompt('비밀번호를 입력하세요:');
    if (!password) {
        showMessage('비밀번호를 입력해야 합니다.', 'error');
        return;
    }

    const result = await apiRequest(`${AUTH_API_URL}/delete`, {
        method: 'DELETE',
        body: JSON.stringify({
            email: currentUser.email,
            password: password
        })
    });

    if (result.success) {
        alert('회원 탈퇴가 완료되었습니다.');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/index.html';
    } else {
        showMessage(result.message || '회원 탈퇴에 실패했습니다.', 'error');
    }
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

// 이벤트 리스너
profileForm.addEventListener('submit', updateProfile);
cancelEditButton.addEventListener('click', () => {
    editNameInput.value = currentUser.name;
    currentPasswordInput.value = '';
    newPasswordInput.value = '';
});

document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
        switchTab(tab.dataset.tab);
    });
});

deleteAccountBtn.addEventListener('click', deleteAccount);
profileButton.addEventListener('click', () => window.location.href = '/profile.html');
boardButton.addEventListener('click', () => window.location.href = '/board.html');
logoutButton.addEventListener('click', logout);

// 페이지 로드 시 실행
document.addEventListener('DOMContentLoaded', () => {
    currentUser = checkLogin();
    if (currentUser) {
        userNameSpan.textContent = `${currentUser.name}님`;
        loadProfile();
        loadMyPosts();
    }
});
