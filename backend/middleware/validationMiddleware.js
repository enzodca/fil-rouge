const { body, param, query, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(error => ({
      field: error.path,
      message: error.msg,
      value: error.value
    }));

    return res.status(400).json({
      message: 'Données invalides',
      errors: formattedErrors
    });
  }
  next();
};

const validateRegister = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Le nom d\'utilisateur doit contenir entre 3 et 30 caractères')
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Le nom d\'utilisateur ne peut contenir que des lettres, chiffres, tirets et underscores'),
  
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Adresse email invalide')
    .isLength({ max: 255 })
    .withMessage('L\'email ne peut pas dépasser 255 caractères'),
  
  body('password')
    .isLength({ min: 8, max: 128 })
    .withMessage('Le mot de passe doit contenir entre 8 et 128 caractères')
  .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>\-_=+\[\]\\|;'/`~]).+/)
    .withMessage('Le mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre et un caractère spécial'),
  
  handleValidationErrors
];

const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Adresse email invalide'),
  
  body('password')
    .notEmpty()
    .withMessage('Le mot de passe est requis')
    .isLength({ max: 128 })
    .withMessage('Le mot de passe ne peut pas dépasser 128 caractères'),
  
  handleValidationErrors
];

const validateEmail = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Adresse email invalide'),
  
  handleValidationErrors
];

const validateForgotPassword = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Adresse email invalide'),
  handleValidationErrors
];

const validateResetPassword = [
  body('token')
    .isLength({ min: 32, max: 256 })
    .withMessage('Token invalide')
    .matches(/^[a-zA-Z0-9]+$/)
    .withMessage('Le token contient des caractères invalides'),
  body('password')
    .isLength({ min: 8, max: 128 })
    .withMessage('Le mot de passe doit contenir entre 8 et 128 caractères')
  .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>\-_=+\[\]\\|;'/`~]).+/)
    .withMessage('Le mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre et un caractère spécial'),
  handleValidationErrors
];

const validateOrganization = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Le nom de l\'organisation doit contenir entre 2 et 100 caractères')
    .matches(/^[a-zA-Z0-9\s\-_À-ÿ]+$/)
    .withMessage('Le nom de l\'organisation contient des caractères invalides'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('La description ne peut pas dépasser 500 caractères'),
  
  handleValidationErrors
];

const validateQuiz = [
  body('title')
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('Le titre doit contenir entre 3 et 200 caractères'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('La description ne peut pas dépasser 1000 caractères'),
  
  body('difficulty')
    .optional()
    .isIn(['easy', 'medium', 'hard'])
    .withMessage('La difficulté doit être easy, medium ou hard'),
  
  body('timeLimit')
    .optional()
    .isInt({ min: 30, max: 7200 })
    .withMessage('La limite de temps doit être entre 30 secondes et 2 heures'),
  
  body('questions')
    .isArray({ min: 1, max: 100 })
    .withMessage('Un quiz doit contenir entre 1 et 100 questions'),
  
  body('questions.*.question')
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Chaque question doit contenir entre 10 et 500 caractères'),
  
  body('questions.*.answers')
    .isArray({ min: 2, max: 6 })
    .withMessage('Chaque question doit avoir entre 2 et 6 réponses'),
  
  body('questions.*.answers.*.text')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Chaque réponse doit contenir entre 1 et 200 caractères'),
  
  body('questions.*.answers.*.isCorrect')
    .isBoolean()
    .withMessage('Le champ isCorrect doit être un booléen'),
  
  handleValidationErrors
];

const validateMongoId = [
  param('id')
    .isMongoId()
    .withMessage('ID invalide'),
  
  handleValidationErrors
];

const validateQuizId = [
  param('quizId')
    .isMongoId()
    .withMessage('ID de quiz invalide'),
  
  handleValidationErrors
];

const validateOrganizationId = [
  param('organizationId')
    .isMongoId()
    .withMessage('ID d\'organisation invalide'),
  
  handleValidationErrors
];

const validateSearch = [
  query('q')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('La recherche doit contenir entre 1 et 100 caractères')
    .matches(/^[a-zA-Z0-9\s\-_À-ÿ]+$/)
    .withMessage('La recherche contient des caractères invalides'),
  
  query('page')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Le numéro de page doit être entre 1 et 1000'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('La limite doit être entre 1 et 100'),
  
  handleValidationErrors
];

const validateToken = [
  query('token')
    .isLength({ min: 32, max: 256 })
    .withMessage('Token invalide')
    .matches(/^[a-zA-Z0-9]+$/)
    .withMessage('Le token contient des caractères invalides'),
  
  handleValidationErrors
];

module.exports = {
  validateRegister,
  validateLogin,
  validateEmail,
  validateForgotPassword,
  validateResetPassword,
  validateOrganization,
  validateQuiz,
  validateMongoId,
  validateQuizId,
  validateOrganizationId,
  validateSearch,
  validateToken,
  handleValidationErrors
};
