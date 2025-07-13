const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const {
  createOrganization,
  getOrganizationById,
  inviteToOrganization,
  deleteOrganization,
  updateOrganization,
  removeMember,
  leaveOrganization,
  getMyOrganization
} = require('../controllers/organizationController');

router.post('/', auth, createOrganization);
router.get('/me', auth, getMyOrganization);
router.put('/leave', auth, leaveOrganization);

router.get('/:id', auth, getOrganizationById);
router.put('/:id', auth, updateOrganization);
router.delete('/:id', auth, deleteOrganization);
router.put('/:id/invite', auth, inviteToOrganization);
router.delete('/:orgId/members/:memberId', auth, removeMember);

module.exports = router;