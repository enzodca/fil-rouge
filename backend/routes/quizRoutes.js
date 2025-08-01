const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const { createQuiz, getAllQuizzes, deleteQuiz, updateQuiz, submitQuizResult, getQuizLeaderboard } = require('../controllers/quizController');
const Quiz = require('../models/Quiz');
const Question = require('../models/Question');
const Answer = require('../models/Answer');

router.post('/create', auth, createQuiz);
router.get('/all', auth, getAllQuizzes);
router.delete('/:id', auth, deleteQuiz);
router.put('/:id', auth, updateQuiz);
router.post('/result', auth, submitQuizResult);
router.get('/:id/leaderboard', auth, getQuizLeaderboard);

router.get('/:id', auth, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ message: 'Quiz non trouvé' });

    const user = req.user;
    const isAdmin = user.role === 'admin';
    const isOwner = quiz.creator_id.toString() === user.id;
    const isInOrg = quiz.organization_id?.toString() === user.organization_id;
    const isInvited = quiz.allowed_emails?.includes(user.email);

    const canAccess =
      quiz.visibility === 'public' ||
      isAdmin ||
      isOwner ||
      (quiz.visibility === 'organization' && isInOrg) ||
      (quiz.visibility === 'private' && isInvited);

    if (!canAccess) return res.status(403).json({ message: 'Accès refusé' });

    const questions = await Question.find({ quiz_id: quiz._id });
    const full = [];
    for (const q of questions) {
      const answers = await Answer.find({ question_id: q._id });
      const questionData = { ...q.toObject(), answers };

      if (questionData.audio_data && questionData.audio_mimetype) {
        questionData.audio_url = `data:${questionData.audio_mimetype};base64,${questionData.audio_data}`;
        delete questionData.audio_data;
      }
      
      full.push(questionData);
    }

    res.json({ ...quiz.toObject(), questions: full });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
});

router.put('/:id/invite', auth, async (req, res) => {
  const { email } = req.body;
  const quiz = await Quiz.findById(req.params.id);

  if (!quiz) return res.status(404).json({ message: 'Quiz non trouvé' });

  const isOwner = quiz.creator_id.toString() === req.user.id;
  const isAdmin = req.user.role === 'admin';

  if (!isOwner && !isAdmin) return res.status(403).json({ message: 'Accès refusé' });
  if (quiz.visibility !== 'private') return res.status(400).json({ message: 'Quiz non privé' });

  if (!quiz.allowed_emails.includes(email)) {
    quiz.allowed_emails.push(email);
    await quiz.save();
  }

  res.json({ message: 'Email ajouté' });
});

module.exports = router;