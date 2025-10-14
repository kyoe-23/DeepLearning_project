const express = require('express');
const multer = require('multer');
const path = require('path');
const { body, validationResult } = require('express-validator');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// 이미지 저장소 설정
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'skin-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('이미지 파일만 업로드 가능합니다 (jpg, jpeg, png)'));
    }
  }
});

// 임시 저장소
let surveys = []; // 설문지 목록
let surveyIdCounter = 1;
let analyses = []; // 분석 결과
let analysisIdCounter = 1;

// 설문지 질문 목록 (동적으로 관리 가능)
let surveyQuestions = [
  {
    id: 1,
    question: '피부 타입을 선택해주세요',
    type: 'radio',
    options: ['건성', '지성', '복합성', '민감성'],
    required: true
  },
  {
    id: 2,
    question: '현재 피부 고민이 무엇인가요? (복수 선택 가능)',
    type: 'checkbox',
    options: ['여드름', '주름', '색소침착', '모공', '건조함', '민감함'],
    required: true
  },
  {
    id: 3,
    question: '하루 평균 수면 시간은 몇 시간인가요?',
    type: 'radio',
    options: ['4시간 미만', '4-6시간', '6-8시간', '8시간 이상'],
    required: true
  },
  {
    id: 4,
    question: '하루 물 섭취량은 얼마나 되나요?',
    type: 'radio',
    options: ['500ml 미만', '500ml-1L', '1L-2L', '2L 이상'],
    required: true
  },
  {
    id: 5,
    question: '현재 사용 중인 스킨케어 제품이 있나요?',
    type: 'text',
    required: false
  }
];

// 이미지 업로드 (POST /api/ai/image-upload)
router.post('/image-upload', authenticateToken, upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '이미지 파일을 업로드해주세요'
      });
    }

    res.json({
      success: true,
      message: '이미지가 업로드되었습니다',
      data: {
        filename: req.file.filename,
        path: req.file.path,
        size: req.file.size,
        uploadedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('이미지 업로드 에러:', error);
    res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다'
    });
  }
});

// 설문지 목록 조회 (GET /api/ai/survey/questions)
router.get('/survey/questions', (req, res) => {
  try {
    res.json({
      success: true,
      data: surveyQuestions
    });
  } catch (error) {
    console.error('설문지 목록 조회 에러:', error);
    res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다'
    });
  }
});

// 설문지 질문 추가 (POST /api/ai/survey/questions) - 관리자용
router.post('/survey/questions', authenticateToken, [
  body('question').notEmpty().withMessage('질문을 입력해주세요'),
  body('type').isIn(['radio', 'checkbox', 'text']).withMessage('올바른 질문 타입을 선택해주세요'),
  body('options').optional().isArray().withMessage('옵션은 배열이어야 합니다'),
  body('required').optional().isBoolean().withMessage('required는 boolean이어야 합니다')
], (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: '입력값 오류',
        errors: errors.array()
      });
    }

    const { question, type, options, required } = req.body;

    const newQuestion = {
      id: surveyQuestions.length + 1,
      question,
      type,
      options: options || [],
      required: required !== undefined ? required : true
    };

    surveyQuestions.push(newQuestion);

    res.status(201).json({
      success: true,
      message: '질문이 추가되었습니다',
      data: newQuestion
    });
  } catch (error) {
    console.error('질문 추가 에러:', error);
    res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다'
    });
  }
});

// 설문지 질문 수정 (PUT /api/ai/survey/questions/:id) - 관리자용
router.put('/survey/questions/:id', authenticateToken, [
  body('question').optional().notEmpty().withMessage('질문을 입력해주세요'),
  body('type').optional().isIn(['radio', 'checkbox', 'text']).withMessage('올바른 질문 타입을 선택해주세요'),
  body('options').optional().isArray().withMessage('옵션은 배열이어야 합니다'),
  body('required').optional().isBoolean().withMessage('required는 boolean이어야 합니다')
], (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: '입력값 오류',
        errors: errors.array()
      });
    }

    const questionId = parseInt(req.params.id);
    const questionIndex = surveyQuestions.findIndex(q => q.id === questionId);

    if (questionIndex === -1) {
      return res.status(404).json({
        success: false,
        message: '질문을 찾을 수 없습니다'
      });
    }

    const { question, type, options, required } = req.body;

    if (question) surveyQuestions[questionIndex].question = question;
    if (type) surveyQuestions[questionIndex].type = type;
    if (options) surveyQuestions[questionIndex].options = options;
    if (required !== undefined) surveyQuestions[questionIndex].required = required;

    res.json({
      success: true,
      message: '질문이 수정되었습니다',
      data: surveyQuestions[questionIndex]
    });
  } catch (error) {
    console.error('질문 수정 에러:', error);
    res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다'
    });
  }
});

// 설문지 질문 삭제 (DELETE /api/ai/survey/questions/:id) - 관리자용
router.delete('/survey/questions/:id', authenticateToken, (req, res) => {
  try {
    const questionId = parseInt(req.params.id);
    const questionIndex = surveyQuestions.findIndex(q => q.id === questionId);

    if (questionIndex === -1) {
      return res.status(404).json({
        success: false,
        message: '질문을 찾을 수 없습니다'
      });
    }

    const deletedQuestion = surveyQuestions.splice(questionIndex, 1)[0];

    res.json({
      success: true,
      message: '질문이 삭제되었습니다',
      data: deletedQuestion
    });
  } catch (error) {
    console.error('질문 삭제 에러:', error);
    res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다'
    });
  }
});

// 설문지 제출 (POST /api/ai/survey)
router.post('/survey', authenticateToken, [
  body('imageFilename').notEmpty().withMessage('업로드된 이미지 파일명이 필요합니다'),
  body('answers').isArray().withMessage('답변은 배열이어야 합니다')
], (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: '입력값 오류',
        errors: errors.array()
      });
    }

    const { imageFilename, answers } = req.body;
    const userId = req.user.userId;

    // 새 설문지 생성
    const newSurvey = {
      id: surveyIdCounter++,
      userId,
      imageFilename,
      answers,
      submittedAt: new Date().toISOString()
    };

    surveys.push(newSurvey);

    // AI 분석 결과 생성 (실제로는 AI 모델 호출)
    const analysis = generateAnalysis(newSurvey);
    const newAnalysis = {
      id: analysisIdCounter++,
      surveyId: newSurvey.id,
      userId,
      ...analysis,
      createdAt: new Date().toISOString()
    };

    analyses.push(newAnalysis);

    res.status(201).json({
      success: true,
      message: '설문지가 제출되었습니다',
      data: {
        survey: newSurvey,
        analysisId: newAnalysis.id
      }
    });
  } catch (error) {
    console.error('설문지 제출 에러:', error);
    res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다'
    });
  }
});

// 분석 결과 조회 (GET /api/ai/analysis/:id)
router.get('/analysis/:id', authenticateToken, (req, res) => {
  try {
    const analysisId = parseInt(req.params.id);
    const analysis = analyses.find(a => a.id === analysisId);

    if (!analysis) {
      return res.status(404).json({
        success: false,
        message: '분석 결과를 찾을 수 없습니다'
      });
    }

    // 본인의 분석 결과만 조회 가능
    if (analysis.userId !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: '분석 결과를 조회할 권한이 없습니다'
      });
    }

    res.json({
      success: true,
      data: analysis
    });
  } catch (error) {
    console.error('분석 결과 조회 에러:', error);
    res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다'
    });
  }
});

// 내 분석 결과 목록 (GET /api/ai/my-analyses)
router.get('/my-analyses', authenticateToken, (req, res) => {
  try {
    const userId = req.user.userId;
    const userAnalyses = analyses.filter(a => a.userId === userId);

    // 최신순 정렬
    const sortedAnalyses = userAnalyses.sort((a, b) =>
      new Date(b.createdAt) - new Date(a.createdAt)
    );

    res.json({
      success: true,
      data: sortedAnalyses
    });
  } catch (error) {
    console.error('분석 목록 조회 에러:', error);
    res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다'
    });
  }
});

// AI 분석 결과 생성 함수 (실제로는 AI 모델 사용)
function generateAnalysis(survey) {
  // 간단한 규칙 기반 분석 (실제로는 AI 모델 사용)
  const answers = survey.answers;

  return {
    skinType: answers[0] || '알 수 없음',
    concerns: answers[1] || [],
    score: Math.floor(Math.random() * 30) + 70, // 70-100 랜덤 점수
    recommendations: [
      '충분한 수분 공급이 필요합니다',
      '자외선 차단제를 매일 사용하세요',
      '규칙적인 수면 패턴을 유지하세요',
      '비타민 C 함유 제품을 추천합니다'
    ],
    summary: '전반적으로 양호한 피부 상태입니다. 꾸준한 관리가 중요합니다.',
    detailedAnalysis: {
      moisture: Math.floor(Math.random() * 30) + 60,
      elasticity: Math.floor(Math.random() * 30) + 60,
      pores: Math.floor(Math.random() * 30) + 60,
      pigmentation: Math.floor(Math.random() * 30) + 60
    }
  };
}

module.exports = router;
