const fs = require('fs');
const path = require('path');

const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

class SecurityLogger {
  constructor() {
    this.securityLogFile = path.join(logsDir, 'security.log');
    this.authLogFile = path.join(logsDir, 'auth.log');
    this.accessLogFile = path.join(logsDir, 'access.log');
  }

  log(level, message, data = {}, logFile = null) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...data
    };

    const logString = JSON.stringify(logEntry) + '\n';

    if (process.env.NODE_ENV === 'development') {
      console.log(`[${level.toUpperCase()}] ${message}`, data);
    }

    const targetFile = logFile || this.securityLogFile;
    fs.appendFileSync(targetFile, logString);
    }

  security(message, data = {}) {
    this.log('SECURITY', message, data, this.securityLogFile);
  }

  auth(message, data = {}) {
    this.log('AUTH', message, data, this.authLogFile);
  }

  access(message, data = {}) {
    this.log('ACCESS', message, data, this.accessLogFile);
  }

  alert(message, data = {}) {
    this.log('ALERT', message, data, this.securityLogFile);

    if (process.env.NODE_ENV === 'production') {
      console.error(`🚨 ALERTE SÉCURITÉ: ${message}`, data);
    }
  }

  accessMiddleware() {
    return (req, res, next) => {
      const startTime = Date.now();

      const originalSend = res.send;
      res.send = function(body) {
        const duration = Date.now() - startTime;

        logger.access('HTTP Request', {
          method: req.method,
          url: req.originalUrl,
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          statusCode: res.statusCode,
          duration,
          userId: req.user?.id || null,
          userEmail: req.user?.email || null
        });

        originalSend.call(this, body);
      };

      next();
    };
  }

  suspiciousActivityMiddleware() {
    return (req, res, next) => {
      const ip = req.ip;
      const userAgent = req.get('User-Agent') || '';
      const url = req.originalUrl;

      const sqlInjectionPatterns = [
        /(\bUNION\b.*\bSELECT\b)/i,
        /(\bSELECT\b.*\bFROM\b)/i,
        /(\bINSERT\b.*\bINTO\b)/i,
        /(\bDELETE\b.*\bFROM\b)/i,
        /(\bDROP\b.*\bTABLE\b)/i,
        /(\bUPDATE\b.*\bSET\b)/i
      ];

      const xssPatterns = [
        /<script[^>]*>.*?<\/script>/gi,
        /javascript:/gi,
        /on\w+\s*=/gi,
        /<iframe[^>]*>.*?<\/iframe>/gi
      ];

      const pathTraversalPatterns = [
        /\.\.\//g,
        /\.\.\\?/g,
        /%2e%2e%2f/gi,
        /%2e%2e\\?/gi
      ];

      const checkPatterns = (text, patterns, type) => {
        for (const pattern of patterns) {
          if (pattern.test(text)) {
            this.alert(`Tentative d'attaque ${type} détectée`, {
              ip,
              userAgent,
              url,
              pattern: pattern.toString(),
              payload: text.substring(0, 200)
            });
            return true;
          }
        }
        return false;
      };

      let suspicious = false;
      suspicious = checkPatterns(url, sqlInjectionPatterns, 'SQL Injection') || suspicious;
      suspicious = checkPatterns(url, xssPatterns, 'XSS') || suspicious;
      suspicious = checkPatterns(url, pathTraversalPatterns, 'Path Traversal') || suspicious;

      if (req.query) {
        Object.values(req.query).forEach(value => {
          if (typeof value === 'string') {
            checkPatterns(value, sqlInjectionPatterns, 'SQL Injection');
            checkPatterns(value, xssPatterns, 'XSS');
            checkPatterns(value, pathTraversalPatterns, 'Path Traversal');
          }
        });
      }

      if (req.body) {
        const bodyStr = JSON.stringify(req.body);
        checkPatterns(bodyStr, sqlInjectionPatterns, 'SQL Injection');
        checkPatterns(bodyStr, xssPatterns, 'XSS');
      }

      const suspiciousUserAgents = [
        /sqlmap/i,
        /nikto/i,
        /burpsuite/i,
        /nmap/i,
        /masscan/i,
        /zap/i,
        /acunetix/i
      ];

      if (suspiciousUserAgents.some(pattern => pattern.test(userAgent))) {
        this.alert('User-Agent suspect détecté', {
          ip,
          userAgent,
          url
        });
      }

      if (suspicious && process.env.NODE_ENV === 'production') {
        return res.status(403).json({
          message: 'Activité suspecte détectée',
          error: 'SUSPICIOUS_ACTIVITY'
        });
      }

      next();
    };
  }

  cleanupOldLogs() {
    const maxAge = 30 * 24 * 60 * 60 * 1000;
    const cutoffDate = new Date(Date.now() - maxAge);

    const logFiles = [this.securityLogFile, this.authLogFile, this.accessLogFile];

    logFiles.forEach(logFile => {
      if (fs.existsSync(logFile)) {
        try {
          const stats = fs.statSync(logFile);
          if (stats.mtime < cutoffDate) {
            const archiveName = `${logFile}.${cutoffDate.toISOString().split('T')[0]}.archived`;
            fs.renameSync(logFile, archiveName);
            this.log('INFO', `Fichier de log archivé: ${archiveName}`);
          }
        } catch (error) {
          console.error('Erreur lors du nettoyage des logs:', error);
        }
      }
    });
  }
}

const logger = new SecurityLogger();

setInterval(() => {
  logger.cleanupOldLogs();
}, 24 * 60 * 60 * 1000);

module.exports = logger;
