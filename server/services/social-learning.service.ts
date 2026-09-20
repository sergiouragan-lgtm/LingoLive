import { getFirestore } from 'firebase-admin/firestore';
import { logSecurityEvent } from './security.event.logger';

export interface StudyGroup {
  groupId: string;
  name: string;
  description: string;
  createdBy: string;
  members: string[];
  memberCount: number;
  targetLanguage: string;
  proficiencyLevel: string;
  createdAt: Date;
  updatedAt: Date;
  isPublic: boolean;
  maxMembers: number;
}

export interface PeerChallenge {
  challengeId: string;
  initiatorId: string;
  opponentId: string;
  concept: string;
  difficulty: number;
  questionsCount: number;
  status: 'pending' | 'in_progress' | 'completed';
  initiatorScore?: number;
  opponentScore?: number;
  winner?: string;
  createdAt: Date;
  completedAt?: Date;
  timeLimit: number; // seconds
}

export interface ForumThread {
  threadId: string;
  authorId: string;
  title: string;
  content: string;
  concept: string;
  createdAt: Date;
  updatedAt: Date;
  replies: number;
  views: number;
  isPinned: boolean;
  tags: string[];
  status: 'open' | 'resolved' | 'closed';
}

export interface ForumReply {
  replyId: string;
  threadId: string;
  authorId: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  likes: number;
  isAcceptedAnswer: boolean;
  mentions: string[];
}

export interface CollaborativeExercise {
  exerciseId: string;
  groupId: string;
  createdBy: string;
  title: string;
  description: string;
  participantIds: string[];
  content: string;
  dueDate: Date;
  submissionCount: number;
  averageScore?: number;
  createdAt: Date;
  status: 'active' | 'completed';
}

export interface SocialMessage {
  messageId: string;
  senderId: string;
  recipientId?: string;
  groupId?: string;
  content: string;
  attachments?: string[];
  isRead: boolean;
  createdAt: Date;
  editedAt?: Date;
}

export interface SocialNotification {
  notificationId: string;
  userId: string;
  type: 'group_invite' | 'challenge_received' | 'reply_mention' | 'exercise_due' | 'message_received';
  sourceUserId: string;
  sourceId: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
  actionUrl: string;
}

class SocialLearningService {
  private db: FirebaseFirestore.Firestore;

  constructor() {
    this.db = getFirestore();
  }

  public async createStudyGroup(
    userId: string,
    name: string,
    description: string,
    targetLanguage: string,
    proficiencyLevel: string,
    isPublic: boolean = true
  ): Promise<StudyGroup> {
    try {
      const groupId = `group-${userId}-${Date.now()}`;
      const group: StudyGroup = {
        groupId,
        name,
        description,
        createdBy: userId,
        members: [userId],
        memberCount: 1,
        targetLanguage,
        proficiencyLevel,
        createdAt: new Date(),
        updatedAt: new Date(),
        isPublic,
        maxMembers: 30,
      };

      await this.db.collection('study_groups').doc(groupId).set(group);
      logSecurityEvent('STUDY_GROUP_CREATED' as any, 'error' as any, 'OPERATION FAILED', { groupId, createdBy: userId });
      return group;
    } catch (error) {
      logSecurityEvent('STUDY_GROUP_CREATION_FAILED' as any, 'error' as any, 'OPERATION FAILED', { userId, error: (error as Error).message });
      throw error;
    }
  }

  public async joinStudyGroup(userId: string, groupId: string): Promise<void> {
    try {
      const groupDoc = await this.db.collection('study_groups').doc(groupId).get();
      if (!groupDoc.exists) throw new Error('Group not found');

      const groupData = groupDoc.data() as StudyGroup;
      if (groupData.members.includes(userId)) throw new Error('Already a member');
      if (groupData.memberCount >= groupData.maxMembers) throw new Error('Group is full');

      await this.db.collection('study_groups').doc(groupId).update({
        members: [...groupData.members, userId],
        memberCount: groupData.memberCount + 1,
        updatedAt: new Date(),
      });

      logSecurityEvent('GROUP_JOINED' as any, 'error' as any, 'OPERATION FAILED', { userId, groupId });
    } catch (error) {
      logSecurityEvent('GROUP_JOIN_FAILED' as any, 'error' as any, 'OPERATION FAILED', { userId, groupId, error: (error as Error).message });
      throw error;
    }
  }

  public async initiateChallenge(
    initiatorId: string,
    opponentId: string,
    concept: string,
    difficulty: number = 5
  ): Promise<PeerChallenge> {
    try {
      const challengeId = `challenge-${initiatorId}-${opponentId}-${Date.now()}`;
      const challenge: PeerChallenge = {
        challengeId,
        initiatorId,
        opponentId,
        concept,
        difficulty,
        questionsCount: 5,
        status: 'pending',
        createdAt: new Date(),
        timeLimit: 600,
      };

      await this.db.collection('peer_challenges').doc(challengeId).set(challenge);
      await this.createNotification(
        opponentId,
        'challenge_received',
        initiatorId,
        challengeId,
        `${initiatorId} challenged you to a ${concept} quiz!`,
        `/challenges/${challengeId}`
      );

      logSecurityEvent('PEER_CHALLENGE_INITIATED' as any, 'error' as any, 'OPERATION FAILED', { initiatorId, opponentId, concept });
      return challenge;
    } catch (error) {
      logSecurityEvent('CHALLENGE_INITIATION_FAILED' as any, 'error' as any, 'OPERATION FAILED', { initiatorId, error: (error as Error).message });
      throw error;
    }
  }

  public async submitChallengeScore(
    challengeId: string,
    userId: string,
    score: number
  ): Promise<{ winner?: string; message: string }> {
    try {
      const challengeDoc = await this.db.collection('peer_challenges').doc(challengeId).get();
      if (!challengeDoc.exists) throw new Error('Challenge not found');

      const challenge = challengeDoc.data() as PeerChallenge;
      const updateData: any = {};

      if (userId === challenge.initiatorId) {
        updateData.initiatorScore = score;
      } else if (userId === challenge.opponentId) {
        updateData.opponentScore = score;
      } else {
        throw new Error('Not a participant in this challenge');
      }

      if (challenge.initiatorScore !== undefined && challenge.opponentScore !== undefined) {
        const winner = challenge.initiatorScore! > challenge.opponentScore! ? challenge.initiatorId : challenge.opponentId;
        updateData.status = 'completed';
        updateData.winner = winner;
        updateData.completedAt = new Date();

        await this.createNotification(
          winner === challenge.initiatorId ? challenge.opponentId : challenge.initiatorId,
          'challenge_received',
          winner,
          challengeId,
          `Challenge completed! ${winner} won!`,
          `/challenges/${challengeId}`
        );

        logSecurityEvent('CHALLENGE_COMPLETED' as any, 'error' as any, 'OPERATION FAILED', { challengeId, winner });
        return { winner, message: 'Challenge completed!' };
      }

      await this.db.collection('peer_challenges').doc(challengeId).update(updateData);
      return { message: 'Score submitted. Waiting for opponent.' };
    } catch (error) {
      logSecurityEvent('CHALLENGE_SCORE_SUBMISSION_FAILED' as any, 'error' as any, 'OPERATION FAILED', { challengeId, error: (error as Error).message });
      throw error;
    }
  }

  public async createForumThread(
    userId: string,
    title: string,
    content: string,
    concept: string,
    tags: string[] = []
  ): Promise<ForumThread> {
    try {
      const threadId = `thread-${userId}-${Date.now()}`;
      const thread: ForumThread = {
        threadId,
        authorId: userId,
        title,
        content,
        concept,
        createdAt: new Date(),
        updatedAt: new Date(),
        replies: 0,
        views: 0,
        isPinned: false,
        tags,
        status: 'open',
      };

      await this.db.collection('forum_threads').doc(threadId).set(thread);
      logSecurityEvent('FORUM_THREAD_CREATED' as any, 'error' as any, 'OPERATION FAILED', { threadId, userId, concept });
      return thread;
    } catch (error) {
      logSecurityEvent('FORUM_THREAD_CREATION_FAILED' as any, 'error' as any, 'OPERATION FAILED', { userId, error: (error as Error).message });
      throw error;
    }
  }

  public async replyToThread(threadId: string, userId: string, content: string): Promise<ForumReply> {
    try {
      const threadDoc = await this.db.collection('forum_threads').doc(threadId).get();
      if (!threadDoc.exists) throw new Error('Thread not found');

      const replyId = `reply-${threadId}-${userId}-${Date.now()}`;
      const reply: ForumReply = {
        replyId,
        threadId,
        authorId: userId,
        content,
        createdAt: new Date(),
        updatedAt: new Date(),
        likes: 0,
        isAcceptedAnswer: false,
        mentions: [],
      };

      await this.db.collection('forum_replies').doc(replyId).set(reply);
      await this.db.collection('forum_threads').doc(threadId).update({
        replies: (threadDoc.data() as any).replies + 1,
        updatedAt: new Date(),
      });

      const threadData = threadDoc.data() as ForumThread;
      await this.createNotification(
        threadData.authorId,
        'reply_mention',
        userId,
        replyId,
        `${userId} replied to your thread: "${threadData.title}"`,
        `/forum/${threadId}`
      );

      logSecurityEvent('FORUM_REPLY_POSTED' as any, 'error' as any, 'OPERATION FAILED', { replyId, threadId, userId });
      return reply;
    } catch (error) {
      logSecurityEvent('FORUM_REPLY_FAILED' as any, 'error' as any, 'OPERATION FAILED', { threadId, userId, error: (error as Error).message });
      throw error;
    }
  }

  public async sendMessage(
    senderId: string,
    content: string,
    recipientId?: string,
    groupId?: string
  ): Promise<SocialMessage> {
    try {
      const messageId = `message-${senderId}-${Date.now()}`;
      const message: SocialMessage = {
        messageId,
        senderId,
        recipientId,
        groupId,
        content,
        isRead: false,
        createdAt: new Date(),
      };

      await this.db.collection('social_messages').doc(messageId).set(message);

      if (recipientId) {
        await this.createNotification(
          recipientId,
          'message_received',
          senderId,
          messageId,
          `New message from ${senderId}`,
          `/messages/${messageId}`
        );
      }

      logSecurityEvent('MESSAGE_SENT' as any, 'error' as any, 'OPERATION FAILED', { senderId, recipientId, groupId });
      return message;
    } catch (error) {
      logSecurityEvent('MESSAGE_SEND_FAILED' as any, 'error' as any, 'OPERATION FAILED', { senderId, error: (error as Error).message });
      throw error;
    }
  }

  public async getStudyGroups(userId: string): Promise<StudyGroup[]> {
    try {
      const snapshot = await this.db
        .collection('study_groups')
        .where('members', 'array-contains', userId)
        .get();

      return snapshot.docs.map((doc) => doc.data() as StudyGroup);
    } catch (error) {
      logSecurityEvent('STUDY_GROUPS_FETCH_FAILED' as any, 'error' as any, 'OPERATION FAILED', { userId, error: (error as Error).message });
      throw error;
    }
  }

  public async getUserNotifications(userId: string): Promise<SocialNotification[]> {
    try {
      const snapshot = await this.db
        .collection('social_notifications')
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .limit(50)
        .get();

      return snapshot.docs.map((doc) => doc.data() as SocialNotification);
    } catch (error) {
      logSecurityEvent('NOTIFICATIONS_FETCH_FAILED' as any, 'error' as any, 'OPERATION FAILED', { userId, error: (error as Error).message });
      throw error;
    }
  }

  private async createNotification(
    userId: string,
    type: string,
    sourceUserId: string,
    sourceId: string,
    message: string,
    actionUrl: string
  ): Promise<void> {
    try {
      const notificationId = `notif-${userId}-${Date.now()}`;
      const notification: SocialNotification = {
        notificationId,
        userId,
        type: type as any,
        sourceUserId,
        sourceId,
        message,
        isRead: false,
        createdAt: new Date(),
        actionUrl,
      };

      await this.db.collection('social_notifications').doc(notificationId).set(notification);
    } catch (error) {
      logSecurityEvent('NOTIFICATION_CREATION_FAILED' as any, 'error' as any, 'OPERATION FAILED', { userId, error: (error as Error).message });
    }
  }
}

export const socialLearningService = new SocialLearningService();
