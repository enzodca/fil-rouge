const nodemailer = require('nodemailer');
const dns = require('dns').promises;

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  }

  async verifyEmailDomain(email) {
    try {
      const domain = email.split('@')[1];
      if (!domain) {
        return { isValid: false, error: 'Format d\'email invalide' };
      }

      const mxRecords = await dns.resolveMx(domain);
      
      if (mxRecords && mxRecords.length > 0) {
        return { isValid: true, mxRecords };
      } else {
        return { isValid: false, error: 'Aucun serveur de messagerie trouvé pour ce domaine' };
      }
    } catch (error) {
      return { 
        isValid: false, 
        error: 'Domaine invalide ou inexistant',
        details: error.message 
      };
    }
  }

  async sendVerificationEmail(email, username, verificationToken) {
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Vérification de votre adresse e-mail',
      html: `
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
          <div style="background: linear-gradient(135deg, #f093fb, #f5576c); padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">Bienvenue ${username} !</h1>
          </div>
          
          <div style="padding: 30px; background-color: #f9f9f9;">
            <h2 style="color: #333;">Vérifiez votre adresse e-mail</h2>
            <p style="color: #666; line-height: 1.6;">
              Merci de vous être inscrit ! Pour activer votre compte et commencer à utiliser notre plateforme, 
              veuillez cliquer sur le bouton ci-dessous pour vérifier votre adresse e-mail.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" 
                 style="background: linear-gradient(135deg, #f093fb, #f5576c); 
                        color: white; 
                        padding: 15px 30px; 
                        text-decoration: none; 
                        border-radius: 25px; 
                        font-weight: bold;
                        display: inline-block;">
                Vérifier mon e-mail
              </a>
            </div>
            
            <p style="color: #999; font-size: 14px;">
              Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :
              <br>
              <a href="${verificationUrl}" style="color: #f093fb;">${verificationUrl}</a>
            </p>
            
            <p style="color: #999; font-size: 12px; margin-top: 30px;">
              Ce lien expire dans 24 heures. Si vous n'avez pas demandé cette vérification, 
              vous pouvez ignorer cet e-mail en toute sécurité.
            </p>
          </div>
          
          <div style="background-color: #333; color: white; padding: 20px; text-align: center; font-size: 12px;">
            <p style="margin: 0;">© 2025 Votre Application. Tous droits réservés.</p>
          </div>
        </div>
      `
    };

    try {
      await this.transporter.sendMail(mailOptions);
      return { success: true };
    } catch (error) {
      console.error('Erreur envoi e-mail:', error);
      return { success: false, error: error.message };
    }
  }

  async sendWelcomeEmail(email, username) {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Bienvenue ! Votre compte est activé',
      html: `
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
          <div style="background: linear-gradient(135deg, #48dbfb, #0abde3); padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">🎉 Compte activé !</h1>
          </div>
          
          <div style="padding: 30px; background-color: #f9f9f9;">
            <h2 style="color: #333;">Félicitations ${username} !</h2>
            <p style="color: #666; line-height: 1.6;">
              Votre adresse e-mail a été vérifiée avec succès et votre compte est maintenant actif.
              Vous pouvez maintenant profiter de toutes les fonctionnalités de notre plateforme.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL}/login" 
                 style="background: linear-gradient(135deg, #48dbfb, #0abde3); 
                        color: white; 
                        padding: 15px 30px; 
                        text-decoration: none; 
                        border-radius: 25px; 
                        font-weight: bold;
                        display: inline-block;">
                Se connecter
              </a>
            </div>
          </div>
          
          <div style="background-color: #333; color: white; padding: 20px; text-align: center; font-size: 12px;">
            <p style="margin: 0;">© 2025 Votre Application. Tous droits réservés.</p>
          </div>
        </div>
      `
    };

    try {
      await this.transporter.sendMail(mailOptions);
      return { success: true };
    } catch (error) {
      console.error('Erreur envoi e-mail de bienvenue:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new EmailService();
