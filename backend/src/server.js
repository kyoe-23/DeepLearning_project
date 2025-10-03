// .env 파일의 환경 변수를 로드합니다.
// backend/.env 파일을 로드하기 위해 상위 폴더 경로 지정
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const express = require('express');
const path = require('path');
const authRouter = require('./routes/auth');
const boardRouter = require('./routes/board');

const app = express();
const PORT = 3000;

// JSON 요청 본문을 파싱하기 위한 미들웨어
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API 라우터 설정
app.use('/api/auth', authRouter);
app.use('/api/board', boardRouter);

// __dirname은 현재 파일(server.js)의 위치인 'backend/src' 폴더를 가리킵니다.
// 여기서 두 단계 상위 폴더로 올라가 'frontend/src' 폴더를 지정합니다.
app.use(express.static(path.join(__dirname, '../../frontend/src')));

// 서버 실행
app.listen(PORT, () => {
  console.log(`서버가 http://localhost:${PORT} 에서 실행 중입니다.`);
  console.log(`프론트엔드 페이지: http://localhost:${PORT}`);
  console.log(`API 테스트: http://localhost:${PORT}/api/auth/test`);
});