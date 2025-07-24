const Quiz = require('../models/Quiz');
const Question = require('../models/Question');
const Answer = require('../models/Answer');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../uploads/audio');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'audio-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const audioUpload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024
  },
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('Seuls les fichiers audio sont autorisés'), false);
    }
  }
});

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
          correct_order: a.correct_order || 0,
          association_target: a.association_target || null
        });
      }
    }

    res.status(201).json({ message: 'Quiz créé', quizId: quiz._id });
  } catch (err) {
    res.status(500).json({ message: 'Erreur lors de la création', error: err.message });
  }
};

exports.createQuizWithAudio = [
  audioUpload.fields([
    { name: 'audio_0', maxCount: 1 },
    { name: 'audio_1', maxCount: 1 },
    { name: 'audio_2', maxCount: 1 },
    { name: 'audio_3', maxCount: 1 },
    { name: 'audio_4', maxCount: 1 },
    { name: 'audio_5', maxCount: 1 },
    { name: 'audio_6', maxCount: 1 },
    { name: 'audio_7', maxCount: 1 },
    { name: 'audio_8', maxCount: 1 },
    { name: 'audio_9', maxCount: 1 }
  ]),
  async (req, res) => {
    try {
      const quizData = JSON.parse(req.body.quizData);
      const { title, description, questions, visibility, allowed_emails, has_timer } = quizData;
      const creator_id = req.user.id;
      const organization_id = (visibility === 'organization') ? req.user.organization_id : undefined;

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

      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        
        let audioFileName = null;
        let audioUrl = null;
        
        if (q.type === 'blind_test' && req.files[`audio_${i}`]) {
          const audioFile = req.files[`audio_${i}`][0];
          audioFileName = audioFile.filename;
          audioUrl = `/uploads/audio/${audioFile.filename}`;
        }

        const question = await Question.create({
          content: q.content,
          type: q.type,
          quiz_id: quiz._id,
          time_limit: q.time_limit || 30,
          audio_file_name: audioFileName,
          audio_url: audioUrl
        });

        for (const a of q.answers) {
          await Answer.create({
            content: a.content,
            is_correct: a.is_correct,
            question_id: question._id,
            correct_order: a.correct_order || 0,
            association_target: a.association_target || null
          });
        }
      }

      res.status(201).json({ message: 'Quiz créé avec succès', quizId: quiz._id });
    } catch (err) {
      console.error('Erreur création quiz avec audio:', err);
      res.status(500).json({ message: 'Erreur lors de la création', error: err.message });
    }
  }
];

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
            correct_order: a.correct_order || 0,
            association_target: a.association_target || null
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
            correct_order: a.correct_order || 0,
            association_target: a.association_target || null
          });
        }
      }
    }

    res.json({ message: 'Quiz mis à jour avec succès' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur update', error: err.message });
  }
};