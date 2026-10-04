import { db } from './dbConfig';
import { Users, Reports, Rewards, CollectedWastes, Notifications, Transactions } from './schema';
import { eq, sql, and, desc,  } from 'drizzle-orm';

export async function createUser(email: string, name: string) {
  try {
    const [user] = await db.insert(Users).values({ email, name }).returning().execute();
    return user;
  } catch (error) {
    console.error("Error creating user:", error);
    return null;
  }
}

export async function getUserByEmail(email: string) {
  try {
    const [user] = await db.select().from(Users).where(eq(Users.email, email)).execute();
    return user;
  } catch (error) {
    console.error("Error fetching user by email:", error);
    return null;
  }
}

export async function createReport(
  userId: number,
  location: string,
  wasteType: string,
  amount: string,
  imageUrl?: string,
  verificationResult?: string
) {
  try {
    const [report] = await db
      .insert(Reports)
      .values({
        userId,
        location,
        wasteType,
        amount,
        imageUrl,
        verificationResult: verificationResult ? JSON.parse(verificationResult) : null,
        status: "pending",
      })
      .returning()
      .execute();

    // Award 10 points for reporting waste
    const pointsEarned = 10;
    await updateRewardPoints(userId, pointsEarned);

    // Create a transaction for the earned points
    await createTransaction(userId, 'earned_report', pointsEarned, 'Points earned for reporting waste');

    // Create a notification for the user
    await createNotification(
      userId,
      `You've earned ${pointsEarned} points for reporting waste!`,
      'reward'
    );

    return report;
  } catch (error) {
    console.error("Error creating report:", error);
    return null;
  }
}

export async function getReportsByUserId(userId: number) {
  try {
    const reports = await db.select().from(Reports).where(eq(Reports.userId, userId)).execute();
    return reports;
  } catch (error) {
    console.error("Error fetching reports:", error);
    return [];
  }
}

export async function getOrCreateReward(userId: number) {
  try {
    let [reward] = await db.select().from(Rewards).where(eq(Rewards.userId, userId)).execute();
    if (!reward) {
      [reward] = await db.insert(Rewards).values({
        userId,
        name: 'Default Reward',
        collectionInfo: 'Default Collection Info',
        points: 0,
        level: 1,
        isAvailable: true,
      }).returning().execute();
    }
    return reward;
  } catch (error) {
    console.error("Error getting or creating reward:", error);
    return null;
  }
}

export async function updateRewardPoints(userId: number, pointsToAdd: number) {
  try {
    await getOrCreateReward(userId);
    const [updatedReward] = await db
      .update(Rewards)
      .set({ 
        points: sql`${Rewards.points} + ${pointsToAdd}`,
        updatedAt: new Date()
      })
      .where(eq(Rewards.userId, userId))
      .returning()
      .execute();
    return updatedReward;
  } catch (error) {
    console.error("Error updating reward points:", error);
    return null;
  }
}

export async function createCollectedWaste(reportId: number, collectorId: number) {
  try {
    const [collectedWaste] = await db
      .insert(CollectedWastes)
      .values({
        reportId,
        collectorId,
        collectionDate: new Date(),
      })
      .returning()
      .execute();
    return collectedWaste;
  } catch (error) {
    console.error("Error creating collected waste:", error);
    return null;
  }
}

export async function getCollectedWastesByCollector(collectorId: number) {
  try {
    return await db.select().from(CollectedWastes).where(eq(CollectedWastes.collectorId, collectorId)).execute();
  } catch (error) {
    console.error("Error fetching collected wastes:", error);
    return [];
  }
}

export async function createNotification(userId: number, message: string, type: string) {
  try {
    const [notification] = await db
      .insert(Notifications)
      .values({ userId, message, type })
      .returning()
      .execute();
    return notification;
  } catch (error) {
    console.error("Error creating notification:", error);
    return null;
  }
}

export async function getUnreadNotifications(userId: number) {
  try {
    return await db.select().from(Notifications).where(
      and(
        eq(Notifications.userId, userId),
        eq(Notifications.isRead, false)
      )
    ).execute();
  } catch (error) {
    console.error("Error fetching unread notifications:", error);
    return [];
  }
}

export async function markNotificationAsRead(notificationId: number) {
  try {
    await db.update(Notifications).set({ isRead: true }).where(eq(Notifications.id, notificationId)).execute();
  } catch (error) {
    console.error("Error marking notification as read:", error);
  }
}

export async function getPendingReports() {
  try {
    return await db.select().from(Reports).where(eq(Reports.status, "pending")).execute();
  } catch (error) {
    console.error("Error fetching pending reports:", error);
    return [];
  }
}

export async function updateReportStatus(reportId: number, status: string) {
  try {
    const [updatedReport] = await db
      .update(Reports)
      .set({ status })
      .where(eq(Reports.id, reportId))
      .returning()
      .execute();
    return updatedReport;
  } catch (error) {
    console.error("Error updating report status:", error);
    return null;
  }
}

export async function getRecentReports(limit: number = 10) {
  try {
    const reports = await db
      .select()
      .from(Reports)
      .orderBy(desc(Reports.createdAt))
      .limit(limit)
      .execute();
    return reports;
  } catch (error) {
    console.error("Error fetching recent reports:", error);
    return [];
  }
}

export async function getWasteCollectionTasks(limit: number = 20) {
  try {
    const tasks = await db
      .select({
        id: Reports.id,
        location: Reports.location,
        wasteType: Reports.wasteType,
        amount: Reports.amount,
        status: Reports.status,
        date: Reports.createdAt,
        collectorId: Reports.collectorId,
      })
      .from(Reports)
      .limit(limit)
      .execute();

    return tasks.map(task => ({
      ...task,
      date: task.date.toISOString().split('T')[0], // Format date as YYYY-MM-DD
    }));
  } catch (error) {
    console.error("Error fetching waste collection tasks:", error);
    return [];
  }
}

export async function saveReward(userId: number, amount: number) {
  try {
    const [reward] = await db
      .insert(Rewards)
      .values({
        userId,
        name: 'Waste Collection Reward',
        collectionInfo: 'Points earned from waste collection',
        points: amount,
        level: 1,
        isAvailable: true,
      })
      .returning()
      .execute();
    
    // Create a transaction for this reward
    await createTransaction(userId, 'earned_collect', amount, 'Points earned for collecting waste');

    return reward;
  } catch (error) {
    console.error("Error saving reward:", error);
    throw error;
  }
}

export async function saveCollectedWaste(reportId: number, collectorId: number) {
  try {
    const [collectedWaste] = await db
      .insert(CollectedWastes)
      .values({
        reportId,
        collectorId,
        collectionDate: new Date(),
        status: 'verified',
      })
      .returning()
      .execute();
    return collectedWaste;
  } catch (error) {
    console.error("Error saving collected waste:", error);
    throw error;
  }
}

export async function updateTaskStatus(reportId: number, newStatus: string, collectorId?: number) {
  try {
    const updateData: { status: string; collectorId?: number } = { status: newStatus };
    if (collectorId !== undefined) {
      updateData.collectorId = collectorId;
    }
    const [updatedReport] = await db
      .update(Reports)
      .set(updateData)
      .where(eq(Reports.id, reportId))
      .returning()
      .execute();
    return updatedReport;
  } catch (error) {
    console.error("Error updating task status:", error);
    throw error;
  }
}

export async function getAllRewards() {
  try {
    const rewards = await db
      .select({
        id: Rewards.id,
        userId: Rewards.userId,
        points: Rewards.points,
        level: Rewards.level,
        createdAt: Rewards.createdAt,
        userName: Users.name,
      })
      .from(Rewards)
      .leftJoin(Users, eq(Rewards.userId, Users.id))
      .orderBy(desc(Rewards.points))
      .execute();

    return rewards;
  } catch (error) {
    console.error("Error fetching all rewards:", error);
    return [];
  }
}

export async function getRewardTransactions(userId: number) {
  try {
    console.log('Fetching transactions for user ID:', userId)
    const transactions = await db
      .select({
        id: Transactions.id,
        type: Transactions.type,
        amount: Transactions.amount,
        description: Transactions.description,
        date: Transactions.date,
      })
      .from(Transactions)
      .where(eq(Transactions.userId, userId))
      .orderBy(desc(Transactions.date))
      .limit(10)
      .execute();

    console.log('Raw transactions from database:', transactions)

    const formattedTransactions = transactions.map(t => ({
      ...t,
      date: t.date.toISOString().split('T')[0], // Format date as YYYY-MM-DD
    }));

    console.log('Formatted transactions:', formattedTransactions)
    return formattedTransactions;
  } catch (error) {
    console.error("Error fetching reward transactions:", error);
    return [];
  }
}

export async function getAvailableRewards(userId: number) {
  try {
    console.log('Fetching available rewards for user:', userId);
    
    // Get user's total points
    const userTransactions = await getRewardTransactions(userId);
    const userPoints = userTransactions.reduce((total, transaction) => {
      return transaction.type.startsWith('earned') ? total + transaction.amount : total - transaction.amount;
    }, 0);

    console.log('User total points:', userPoints);

    // Get available rewards from the database
    const dbRewards = await db
      .select({
        id: Rewards.id,
        name: Rewards.name,
        cost: Rewards.points,
        description: Rewards.description,
        collectionInfo: Rewards.collectionInfo,
      })
      .from(Rewards)
      .where(eq(Rewards.isAvailable, true))
      .execute();

    console.log('Rewards from database:', dbRewards);

    // Combine user points and database rewards
    const allRewards = [
      {
        id: 0, // Use a special ID for user's points
        name: "Your Points",
        cost: userPoints,
        description: "Redeem your earned points",
        collectionInfo: "Points earned from reporting and collecting waste"
      },
      ...dbRewards
    ];

    console.log('All available rewards:', allRewards);
    return allRewards;
  } catch (error) {
    console.error("Error fetching available rewards:", error);
    return [];
  }
}

export async function createTransaction(userId: number, type: 'earned_report' | 'earned_collect' | 'redeemed', amount: number, description: string) {
  try {
    const [transaction] = await db
      .insert(Transactions)
      .values({ userId, type, amount, description })
      .returning()
      .execute();
    return transaction;
  } catch (error) {
    console.error("Error creating transaction:", error);
    throw error;
  }
}

export async function redeemReward(userId: number, rewardId: number) {
  try {
    const userReward = await getOrCreateReward(userId);
    if (!userReward) {
      throw new Error("User reward not found");
    }
    
    if (rewardId === 0) {
      // Redeem all points
      const [updatedReward] = await db.update(Rewards)
        .set({ 
          points: 0,
          updatedAt: new Date(),
        })
        .where(eq(Rewards.userId, userId))
        .returning()
        .execute();

      // Create a transaction for this redemption
      await createTransaction(userId, 'redeemed', userReward.points, `Redeemed all points: ${userReward.points}`);

      return updatedReward;
    } else {
      // Existing logic for redeeming specific rewards
      const availableReward = await db.select().from(Rewards).where(eq(Rewards.id, rewardId)).execute();

      if (!userReward || !availableReward[0] || userReward.points < availableReward[0].points) {
        throw new Error("Insufficient points or invalid reward");
      }

      const [updatedReward] = await db.update(Rewards)
        .set({ 
          points: sql`${Rewards.points} - ${availableReward[0].points}`,
          updatedAt: new Date(),
        })
        .where(eq(Rewards.userId, userId))
        .returning()
        .execute();

      // Create a transaction for this redemption
      await createTransaction(userId, 'redeemed', availableReward[0].points, `Redeemed: ${availableReward[0].name}`);

      return updatedReward;
    }
  } catch (error) {
    console.error("Error redeeming reward:", error);
    throw error;
  }
}

export async function getUserBalance(userId: number): Promise<number> {
  const transactions = await getRewardTransactions(userId);
  const balance = transactions.reduce((acc, transaction) => {
    return transaction.type.startsWith('earned') ? acc + transaction.amount : acc - transaction.amount
  }, 0);
  return Math.max(balance, 0); // Ensure balance is never negative
}

export async function getAdminMetrics() {
  try {
    const allUsers = await db.select().from(Users).execute();
    const allReports = await db.select().from(Reports).execute();
    const allCollected = await db.select().from(CollectedWastes).execute();
    const allTransactions = await db.select().from(Transactions).execute();

    let totalWasteKg = 0;
    allReports.forEach(r => {
      const match = r.amount?.match(/(\d+(\.\d+)?)/);
      if (match) totalWasteKg += parseFloat(match[0]);
    });

    const totalPointsEarned = allTransactions
      .filter(t => t.type?.startsWith('earned'))
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    const totalPointsRedeemed = allTransactions
      .filter(t => t.type === 'redeemed')
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    return {
      totalUsers: allUsers.length,
      totalReports: allReports.length,
      totalCollected: allCollected.length,
      pendingReports: allReports.filter(r => r.status === 'pending').length,
      totalWasteKg: Math.round(totalWasteKg * 10) / 10,
      totalPointsEarned,
      totalPointsRedeemed,
      co2OffsetKg: Math.round(totalWasteKg * 0.5 * 10) / 10
    };
  } catch (error) {
    console.error("Error fetching admin metrics:", error);
    return null;
  }
}

export async function getAllUsersWithDetailedStats() {
  try {
    const allUsers = await db.select().from(Users).orderBy(desc(Users.createdAt)).execute();
    const allReports = await db.select().from(Reports).execute();
    const allCollected = await db.select().from(CollectedWastes).execute();
    const allRewards = await db.select().from(Rewards).execute();
    const allTransactions = await db.select().from(Transactions).execute();

    return allUsers.map(user => {
      const userReports = allReports.filter(r => r.userId === user.id);
      const userCollections = allCollected.filter(c => c.collectorId === user.id);
      
      let userWasteKg = 0;
      userReports.forEach(r => {
        const match = r.amount?.match(/(\d+(\.\d+)?)/);
        if (match) userWasteKg += parseFloat(match[0]);
      });

      const userTrans = allTransactions.filter(t => t.userId === user.id);
      const balance = userTrans.reduce((acc, t) => {
        return t.type?.startsWith('earned') ? acc + t.amount : acc - t.amount;
      }, 0);

      const rewardRow = allRewards.find(rw => rw.userId === user.id);

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt.toISOString().split('T')[0],
        reportsCount: userReports.length,
        collectionsCount: userCollections.length,
        wasteReportedKg: Math.round(userWasteKg * 10) / 10,
        balance: Math.max(balance, 0),
        rewardPoints: rewardRow?.points || 0,
      };
    });
  } catch (error) {
    console.error("Error fetching users with stats:", error);
    return [];
  }
}

export async function getAllReportsWithUsers() {
  try {
    const reports = await db
      .select({
        id: Reports.id,
        userId: Reports.userId,
        location: Reports.location,
        wasteType: Reports.wasteType,
        amount: Reports.amount,
        imageUrl: Reports.imageUrl,
        status: Reports.status,
        createdAt: Reports.createdAt,
        collectorId: Reports.collectorId,
        reporterName: Users.name,
        reporterEmail: Users.email,
      })
      .from(Reports)
      .leftJoin(Users, eq(Reports.userId, Users.id))
      .orderBy(desc(Reports.createdAt))
      .execute();

    return reports.map(r => ({
      ...r,
      createdAt: r.createdAt ? r.createdAt.toISOString().split('T')[0] : 'N/A'
    }));
  } catch (error) {
    console.error("Error fetching reports with users:", error);
    return [];
  }
}

export async function getUserComprehensiveAnalytics(userId: number) {
  try {
    const userReports = await db.select().from(Reports).where(eq(Reports.userId, userId)).orderBy(desc(Reports.createdAt)).execute();
    const userCollections = await db.select().from(CollectedWastes).where(eq(CollectedWastes.collectorId, userId)).execute();
    const userTransactions = await db.select().from(Transactions).where(eq(Transactions.userId, userId)).orderBy(desc(Transactions.date)).execute();
    const [rewardRow] = await db.select().from(Rewards).where(eq(Rewards.userId, userId)).execute();

    let totalWasteReportedKg = 0;
    const wasteBreakdown: Record<string, number> = {};

    userReports.forEach(r => {
      const match = r.amount?.match(/(\d+(\.\d+)?)/);
      const kg = match ? parseFloat(match[0]) : 0;
      totalWasteReportedKg += kg;

      const type = (r.wasteType || 'General').toLowerCase();
      wasteBreakdown[type] = (wasteBreakdown[type] || 0) + 1;
    });

    const totalEarned = userTransactions
      .filter(t => t.type?.startsWith('earned'))
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    const totalRedeemed = userTransactions
      .filter(t => t.type === 'redeemed')
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    const currentBalance = Math.max(totalEarned - totalRedeemed, 0);

    return {
      reportsCount: userReports.length,
      collectionsCount: userCollections.length,
      totalWasteReportedKg: Math.round(totalWasteReportedKg * 10) / 10,
      co2OffsetKg: Math.round(totalWasteReportedKg * 0.5 * 10) / 10,
      totalEarned,
      totalRedeemed,
      currentBalance,
      level: rewardRow?.level || 1,
      wasteBreakdown,
      recentReports: userReports.slice(0, 5).map(r => ({
        id: r.id,
        location: r.location,
        wasteType: r.wasteType,
        amount: r.amount,
        status: r.status,
        date: r.createdAt ? r.createdAt.toISOString().split('T')[0] : 'N/A'
      })),
      recentTransactions: userTransactions.slice(0, 6).map(t => ({
        id: t.id,
        type: t.type,
        amount: t.amount,
        description: t.description,
        date: t.date ? t.date.toISOString().split('T')[0] : 'N/A'
      }))
    };
  } catch (error) {
    console.error("Error fetching user comprehensive analytics:", error);
    return null;
  }
}