const Quiz = require('../models/Quiz');
const Question = require('../models/Question');
const Answer = require('../models/Answer');

exports.createQuiz = async (req, res) => {
  const { title, description, questions, visibility, allowed_emails } = req.body;
  const creator_id = req.user.id;
  const organization_id = (visibility === 'organization') ? req.user.organization_id : undefined;

  try {
    const quiz = await Quiz.create({
      title,
      description,
      creator_id,
      visibility,
      organization_id,
      allowed_emails: Array.isArray(allowed_emails) ? allowed_emails : []
    });

    for (const q of questions) {
      const question = await Question.create({
        content: q.content,
        type: q.type,
        quiz_id: quiz._id
      });

      for (const a of q.answers) {
        await Answer.create({
          content: a.content,
          is_correct: a.is_correct,
          question_id: question._id
        });
      }
    }

    res.status(201).json({ message: 'Quiz créé', quizId: quiz._id });
  } catch (err) {
    res.status(500).json({ message: 'Erreur lors de la création', error: err.message });
  }
};

exports.getAllQuizzes = async (req, res) => {
  try {
    const quizzes = await Quiz.find().populate('creator_id', 'username');
    res.json(quizzes);
  } catch (err) {
    res.status(500).json({ message: 'Erreur récupération quiz', error: err.message });
  }
};

exports.deleteQuiz = async (req, res) => {
  const quizId = req.params.id;
  const userId = req.user.id;
  const userRole = req.user.role;

  try {
    const quiz = await Quiz.findById(quizId);
    if (!quiz) return res.status(404).json({ message: 'Quiz non trouvé' });

    const isOwner = quiz.creator_id.toString() === userId;
    const isAdmin = userRole === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Non autorisé à supprimer ce quiz' });
    }

    const questions = await Question.find({ quiz_id: quizId });
    const questionIds = questions.map(q => q._id);

    if (questionIds.length > 0) {
      await Answer.deleteMany({ question_id: { $in: questionIds } });
    }

    await Question.deleteMany({ quiz_id: quizId });
    await Quiz.findByIdAndDelete(quizId);

    res.json({ message: 'Quiz supprimé' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

exports.updateQuiz = async (req, res) => {
  const quizId = req.params.id;
  const { title, description, visibility, allowed_emails, questions } = req.body;
  const { id: userId, role: userRole } = req.user;

  try {
    const quiz = await Quiz.findById(quizId);
    if (!quiz) return res.status(404).json({ message: 'Quiz non trouvé' });

    const isOwner = quiz.creator_id.toString() === userId;
    const isAdmin = userRole === 'admin';
    if (!isOwner && !isAdmin)
      return res.status(403).json({ message: 'Non autorisé à modifier ce quiz' });

    quiz.title = title;
    quiz.description = description;
    quiz.visibility = visibility || 'public';
    quiz.allowed_emails = Array.isArray(allowed_emails) ? allowed_emails : [];
    await quiz.save();

    const oldQuestions = await Question.find({ quiz_id: quizId });
    const oldQuestionIds = oldQuestions.map(q => q._id.toString());
    const incomingQuestionIds = questions.filter(q => q._id).map(q => q._id);

    const toDelete = oldQuestionIds.filter(id => !incomingQuestionIds.includes(id));
    for (const id of toDelete) {
      await Answer.deleteMany({ question_id: id });
      await Question.findByIdAndDelete(id);
    }

    for (const q of questions) {
      let question;
      if (q._id) {
        question = await Question.findByIdAndUpdate(
          q._id,
          { content: q.content, type: q.type },
          { new: true }
        );
        await Answer.deleteMany({ question_id: q._id });
      } else {
        question = await Question.create({
          content: q.content,
          type: q.type,
          quiz_id: quizId
        });
      }

      for (const a of q.answers) {
        await Answer.create({
          content: a.content,
          is_correct: a.is_correct,
          question_id: question._id
        });
      }
    }

    res.json({ message: 'Quiz mis à jour avec succès' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur update', error: err.message });
  }
};