import { Router } from 'express';
import { socialLearningService } from '../services/social-learning.service';
import { requireAuth } from '../middleware/requireAuth';

const router = Router();

router.post('/group/create', requireAuth, async (req, res) => {
  try {
    const { userId, name, description, targetLanguage, proficiencyLevel, isPublic } = req.body;
    const group = await socialLearningService.createStudyGroup(
      userId,
      name,
      description,
      targetLanguage,
      proficiencyLevel,
      isPublic
    );
    res.json(group);
  } catch (error: any) {
    console.error('Error creating study group:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/group/join', requireAuth, async (req, res) => {
  try {
    const { userId, groupId } = req.body;
    await socialLearningService.joinStudyGroup(userId, groupId);
    res.json({ success: true });
  } catch (error: any) {
    console.error('Error joining group:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/challenge/initiate', requireAuth, async (req, res) => {
  try {
    const { initiatorId, opponentId, concept, difficulty } = req.body;
    const challenge = await socialLearningService.initiateChallenge(
      initiatorId,
      opponentId,
      concept,
      difficulty
    );
    res.json(challenge);
  } catch (error: any) {
    console.error('Error initiating challenge:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/challenge/submit-score', requireAuth, async (req, res) => {
  try {
    const { challengeId, userId, score } = req.body;
    const result = await socialLearningService.submitChallengeScore(challengeId, userId, score);
    res.json(result);
  } catch (error: any) {
    console.error('Error submitting challenge score:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/forum/thread/create', requireAuth, async (req, res) => {
  try {
    const { userId, title, content, concept, tags } = req.body;
    const thread = await socialLearningService.createForumThread(userId, title, content, concept, tags);
    res.json(thread);
  } catch (error: any) {
    console.error('Error creating forum thread:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/forum/reply', requireAuth, async (req, res) => {
  try {
    const { threadId, userId, content } = req.body;
    const reply = await socialLearningService.replyToThread(threadId, userId, content);
    res.json(reply);
  } catch (error: any) {
    console.error('Error posting forum reply:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/message/send', requireAuth, async (req, res) => {
  try {
    const { senderId, content, recipientId, groupId } = req.body;
    const message = await socialLearningService.sendMessage(senderId, content, recipientId, groupId);
    res.json(message);
  } catch (error: any) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/groups/:userId', requireAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    const groups = await socialLearningService.getStudyGroups(userId);
    res.json(groups);
  } catch (error: any) {
    console.error('Error fetching study groups:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/notifications/:userId', requireAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    const notifications = await socialLearningService.getUserNotifications(userId);
    res.json(notifications);
  } catch (error: any) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
