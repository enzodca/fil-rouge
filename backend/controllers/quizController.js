const Quiz = require('../models/Quiz');
const Question = require('../models/Question');
const Answer = require('../models/Answer');

exports.createQuiz = async (req, res) => {
  const { title, description, questions, visibility, allowed_emails, has_timer } = req.body;
  const creator_id = req.user.id;
  const organization_id = (visibility === 'organization') ? req.user.organization_id : undefined;

  try {
    let total_time = 0;
    if (has_timer && questions) {
      total_time = questions.reduce((sum, q) => sum + (q.time_limit || 30), 0);
    }

    const quiz = await Quiz.create({
      title,
      description,
      creator_id,
      visibility,
      organization_id,
      allowed_emails: Array.isArray(allowed_emails) ? allowed_emails : [],
      has_timer: has_timer || false,
      total_time
    });

    for (const q of questions) {
      const question = await Question.create({
        content: q.content,
        type: q.type,
        quiz_id: quiz._id,
        time_limit: q.time_limit || 30
      });

      for (const a of q.answers) {
        await Answer.create({
          content: a.content,
          is_correct: a.is_correct,
          question_id: question._id,
          correct_order: a.correct_order || 0
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
    
    const TypeQuizzes = await Promise.all(
      quizzes.map(async (quiz) => {
        const questions = await Question.find({ quiz_id: quiz._id });
        const questionTypes = [...new Set(questions.map(q => q.type))];
        
        return {
          ...quiz.toObject(),
          questionTypes
        };
      })
    );
    
    res.json(TypeQuizzes);
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
  const { title, description, visibility, allowed_emails, questions, has_timer } = req.body;
  const { id: userId, role: userRole } = req.user;

  try {
    const quiz = await Quiz.findById(quizId);
    if (!quiz) return res.status(404).json({ message: 'Quiz non trouvé' });

    const isOwner = quiz.creator_id.toString() === userId;
    const isAdmin = userRole === 'admin';
    if (!isOwner && !isAdmin)
      return res.status(403).json({ message: 'Non autorisé à modifier ce quiz' });

    let total_time = 0;
    if (has_timer && questions) {
      total_time = questions.reduce((sum, q) => sum + (q.time_limit || 30), 0);
    }

    quiz.title = title;
    quiz.description = description;
    quiz.visibility = visibility || 'public';
    quiz.allowed_emails = Array.isArray(allowed_emails) ? allowed_emails : [];
    quiz.has_timer = has_timer || false;
    quiz.total_time = total_time;
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
          { 
            content: q.content, 
            type: q.type,
            time_limit: q.time_limit || 30
          },
          { new: true }
        );

        await Answer.deleteMany({ question_id: q._id });

        for (const a of q.answers) {
          await Answer.create({
            content: a.content,
            is_correct: a.is_correct,
            question_id: question._id,
            correct_order: a.correct_order || 0
          });
        }
      } else {
        question = await Question.create({
          content: q.content,
          type: q.type,
          quiz_id: quizId,
          time_limit: q.time_limit || 30
        });

        for (const a of q.answers) {
          await Answer.create({
            content: a.content,
            is_correct: a.is_correct,
            question_id: question._id,
            correct_order: a.correct_order || 0
          });
        }
      }
    }

    res.json({ message: 'Quiz mis à jour avec succès' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur update', error: err.message });
  }
};