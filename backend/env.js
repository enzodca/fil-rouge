const { cleanEnv, str, num } = require('envalid');

const isTest = process.env.NODE_ENV === 'test';

const spec = {
  NODE_ENV: str({ choices: ['development', 'test', 'production'], default: 'development' }),
  PORT: num({ default: 3000 }),
  MONGODB_URI: isTest ? str({ default: 'mongodb://unused' }) : str(),
  FRONTEND_ORIGIN: str({ default: 'http://localhost:4200' }),
  JWT_SECRET: str({ default: undefined })
};

const env = cleanEnv(process.env, spec);

module.exports = env;
