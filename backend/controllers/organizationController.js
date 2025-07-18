const Organization = require('../models/Organization');
const User = require('../models/User');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const canManageOrganization = async (userId, orgId) => {
  const user = await User.findById(userId);
  if (user.role === 'admin') return true;
  
  if (user.organization_id?.toString() === orgId && user.organization_role === 'chef') {
    return true;
  }
  
  return false;
};

const validateOrganizationName = (name) => {
  if (!name || typeof name !== 'string') {
    throw new Error('Le nom est requis');
  }
  if (name.trim().length < 2) {
    throw new Error('Le nom doit contenir au moins 2 caractères');
  }
  if (name.trim().length > 50) {
    throw new Error('Le nom ne peut pas dépasser 50 caractères');
  }
  return name.trim();
};

const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    throw new Error('Email invalide');
  }
  return email.toLowerCase().trim();
};

exports.createOrganization = async (req, res) => {
  try {
    const { name } = req.body;
    const userId = req.user.id;
    
    const validatedName = validateOrganizationName(name);
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }
    
    if (user.organization_id) {
      return res.status(400).json({ message: "Vous avez déjà une organisation." });
    }

    const org = await Organization.create({ 
      name: validatedName, 
      members: [userId] 
    });
    
    user.organization_id = org._id;
    user.organization_role = 'chef';
    await user.save();
    
    // Générer un nouveau token avec les informations de l'organisation
    const newToken = jwt.sign(
      {
        id: user._id,
        username: user.username,
        role: user.role,
        organization_id: org._id,
        organization_name: org.name,
        email: user.email
      },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );
    
    res.status(201).json({ 
      message: "Organisation créée avec succès", 
      organization: org,
      token: newToken
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: "Ce nom d'organisation existe déjà" });
    }
    
    res.status(400).json({ 
      message: err.message || "Erreur création organisation" 
    });
  }
};

exports.getOrganizationById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "ID d'organisation invalide" });
    }
    
    const org = await Organization.findById(id)
      .populate('members', 'username email organization_role');
      
    if (!org) {
      return res.status(404).json({ message: "Organisation non trouvée" });
    }
    
    const user = await User.findById(userId);
    const isAdmin = user.role === 'admin';
    const isMember = org.members.some(member => member._id.toString() === userId);
    
    if (!isAdmin && !isMember) {
      return res.status(403).json({ message: "Accès refusé" });
    }
    
    res.json(org);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};

exports.inviteToOrganization = async (req, res) => {
  try {
    const { email } = req.body;
    const orgId = req.params.id;
    const userId = req.user.id;
    
    const validatedEmail = validateEmail(email);
    
    if (!mongoose.Types.ObjectId.isValid(orgId)) {
      return res.status(400).json({ message: "ID d'organisation invalide" });
    }
    
    if (!(await canManageOrganization(userId, orgId))) {
      return res.status(403).json({ 
        message: "Seuls les chefs d'organisation ou les admins peuvent inviter" 
      });
    }
    
    const org = await Organization.findById(orgId);
    if (!org) {
      return res.status(404).json({ message: "Organisation non trouvée" });
    }
    
    const invited = await User.findOne({ email: validatedEmail });
    if (!invited) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }
    
    if (invited.organization_id) {
      return res.status(400).json({ 
        message: "L'utilisateur appartient déjà à une organisation" 
      });
    }
    
    if (org.members.includes(invited._id)) {
      return res.status(400).json({ 
        message: "L'utilisateur est déjà membre de cette organisation" 
      });
    }
    
    invited.organization_id = org._id;
    invited.organization_role = 'membre';
    await invited.save();
    
    org.members.push(invited._id);
    await org.save();
    
    res.json({ message: "Utilisateur ajouté à l'organisation avec succès" });
  } catch (err) {
    res.status(400).json({ 
      message: err.message || "Erreur lors de l'invitation" 
    });
  }
};

exports.updateOrganization = async (req, res) => {
  try {
    const { name } = req.body;
    const orgId = req.params.id;
    const userId = req.user.id;
    
    const validatedName = validateOrganizationName(name);
    
    if (!mongoose.Types.ObjectId.isValid(orgId)) {
      return res.status(400).json({ message: "ID d'organisation invalide" });
    }
    
    if (!(await canManageOrganization(userId, orgId))) {
      return res.status(403).json({ 
        message: "Seuls les chefs d'organisation ou les admins peuvent modifier" 
      });
    }
    
    const org = await Organization.findByIdAndUpdate(
      orgId,
      { name: validatedName },
      { new: true, runValidators: true }
    );
    
    if (!org) {
      return res.status(404).json({ message: "Organisation non trouvée" });
    }
    
    res.json({ 
      message: "Organisation mise à jour avec succès", 
      organization: org 
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: "Ce nom d'organisation existe déjà" });
    }
    res.status(400).json({ 
      message: err.message || "Erreur lors de la mise à jour" 
    });
  }
};

exports.deleteOrganization = async (req, res) => {
  try {
    const orgId = req.params.id;
    const userId = req.user.id;
    
    if (!mongoose.Types.ObjectId.isValid(orgId)) {
      return res.status(400).json({ message: "ID d'organisation invalide" });
    }
    
    if (!(await canManageOrganization(userId, orgId))) {
      return res.status(403).json({ 
        message: "Seuls les chefs d'organisation ou les admins peuvent supprimer" 
      });
    }
    
    const org = await Organization.findById(orgId);
    if (!org) {
      return res.status(404).json({ message: "Organisation non trouvée" });
    }
    
    await User.updateMany(
      { organization_id: orgId }, 
      { 
        $unset: { 
          organization_id: "", 
          organization_role: "" 
        } 
      }
    );
    
    await Organization.findByIdAndDelete(orgId);
    
    // Générer un nouveau token pour l'utilisateur qui a supprimé l'organisation
    const currentUser = await User.findById(userId);
    const newToken = jwt.sign(
      {
        id: currentUser._id,
        username: currentUser.username,
        role: currentUser.role,
        organization_id: null,
        organization_name: null,
        email: currentUser.email
      },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );
    
    res.json({ 
      message: "Organisation supprimée avec succès",
      token: newToken
    });
  } catch (err) {
    res.status(500).json({ 
      message: "Erreur lors de la suppression", 
      error: err.message 
    });
  }
};

exports.removeMember = async (req, res) => {
  try {
    const { orgId, memberId } = req.params;
    const userId = req.user.id;
    
    if (!mongoose.Types.ObjectId.isValid(orgId) || !mongoose.Types.ObjectId.isValid(memberId)) {
      return res.status(400).json({ message: "IDs invalides" });
    }
    
    if (!(await canManageOrganization(userId, orgId))) {
      return res.status(403).json({ 
        message: "Seuls les chefs d'organisation ou les admins peuvent retirer des membres" 
      });
    }
    
    const org = await Organization.findById(orgId);
    if (!org) {
      return res.status(404).json({ message: "Organisation non trouvée" });
    }
    
    const member = await User.findById(memberId);
    if (!member) {
      return res.status(404).json({ message: "Membre non trouvé" });
    }
    
    if (member.organization_role === 'chef') {
      return res.status(400).json({ 
        message: "Impossible de retirer le chef de l'organisation" 
      });
    }
    
    member.organization_id = undefined;
    member.organization_role = undefined;
    await member.save();
    
    org.members = org.members.filter(id => id.toString() !== memberId);
    await org.save();
    
    res.json({ message: "Membre retiré avec succès" });
  } catch (err) {
    res.status(500).json({ 
      message: "Erreur lors du retrait du membre", 
      error: err.message 
    });
  }
};

exports.leaveOrganization = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const user = await User.findById(userId);
    if (!user.organization_id) {
      return res.status(400).json({ message: "Vous n'appartenez à aucune organisation" });
    }
    
    if (user.organization_role === 'chef') {
      return res.status(400).json({ 
        message: "Le chef ne peut pas quitter l'organisation. Supprimez-la ou transférez la direction." 
      });
    }
    
    const org = await Organization.findById(user.organization_id);
    if (org) {
      org.members = org.members.filter(id => id.toString() !== userId);
      await org.save();
    }
    
    user.organization_id = undefined;
    user.organization_role = undefined;
    await user.save();
    
    // Générer un nouveau token sans les informations de l'organisation
    const newToken = jwt.sign(
      {
        id: user._id,
        username: user.username,
        role: user.role,
        organization_id: null,
        organization_name: null,
        email: user.email
      },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );
    
    res.json({ 
      message: "Vous avez quitté l'organisation avec succès",
      token: newToken
    });
  } catch (err) {
    res.status(500).json({ 
      message: "Erreur lors de la sortie de l'organisation", 
      error: err.message 
    });
  }
};

exports.getMyOrganization = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const user = await User.findById(userId);
    if (!user.organization_id) {
      return res.status(404).json({ message: "Aucune organisation" });
    }
    
    const org = await Organization.findById(user.organization_id)
      .populate('members', 'username email organization_role');
      
    if (!org) {
      return res.status(404).json({ message: "Organisation non trouvée" });
    }
    
    res.json(org);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};