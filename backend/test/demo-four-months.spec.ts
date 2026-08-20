import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';
import { seedDemoFourMonths } from '../scripts/seed-demo-four-months';
import { cleanDemoFourMonths, DEMO_FORUM_SLUG } from '../scripts/clean-demo-four-months';
import { verifyDemoFourMonths } from '../scripts/verify-demo-four-months';

describe('4-Month Comprehensive Demo Dataset Tests', () => {
  let prisma: PrismaClient;

  beforeAll(() => {
    prisma = new PrismaClient({
      adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('1. Seeds the full 4-month demo dataset without error', async () => {
    await seedDemoFourMonths();

    const forum = await prisma.forum.findUnique({
      where: { slug: DEMO_FORUM_SLUG },
    });

    expect(forum).toBeDefined();
    expect(forum?.slug).toBe(DEMO_FORUM_SLUG);
  }, 120000);

  it('2. Passes all relational integrity and count verifications', async () => {
    const result = await verifyDemoFourMonths();

    expect(result.counts.branches).toBe(3);
    expect(result.counts.halaqas).toBe(10);
    expect(result.counts.teachers).toBe(10);
    expect(result.counts.supervisors).toBe(2);
    expect(result.counts.students).toBe(150);
    expect(result.counts.parents).toBeGreaterThanOrEqual(125);
    expect(result.counts.studentGuardians).toBe(150);
    expect(result.counts.attendanceSessions).toBeGreaterThan(800);
    expect(result.counts.attendanceRecords).toBeGreaterThan(10000);
    expect(result.counts.memorizationRecords).toBeGreaterThan(2000);
    expect(result.counts.revisionRecords).toBeGreaterThan(1500);
    expect(result.counts.educationalPlans).toBe(10);
    expect(result.counts.exams).toBe(25);
    expect(result.counts.examResults).toBeGreaterThan(300);
    expect(result.counts.studentEvaluations).toBeGreaterThan(400);
    expect(result.counts.activities).toBe(15);
    expect(result.counts.competitions).toBe(8);
    expect(result.counts.awards).toBeGreaterThanOrEqual(5);
    expect(result.counts.studentAwards).toBe(50);
    expect(result.counts.shelfSections).toBe(4);
    expect(result.counts.shelfItems).toBe(50);
    expect(result.counts.conversations).toBe(20);
    expect(result.counts.chatMessages).toBe(300);
    expect(result.counts.notifications).toBe(400);
    expect(result.counts.adminTasks).toBe(40);
    expect(result.counts.adminRequests).toBe(25);
    expect(result.counts.fieldVisits).toBe(25);
    expect(result.counts.recommendations).toBe(20);

    // Teacher dashboard metrics are non-zero
    expect(result.todayPresent).toBeGreaterThan(0);
    expect(result.todayMemos).toBeGreaterThan(0);
    expect(result.todayRevs).toBeGreaterThan(0);
  });

  it('3. Is idempotent and re-run safe', async () => {
    // Re-running seed must succeed cleanly without throwing duplicate key errors
    await seedDemoFourMonths();

    const studentCount = await prisma.studentProfile.count({
      where: { user: { forum: { slug: DEMO_FORUM_SLUG } } },
    });

    expect(studentCount).toBe(150);
  }, 120000);

  it('4. Cleans only the demo forum without affecting others', async () => {
    // Check initial total forums
    const forumCountBefore = await prisma.forum.count();

    // Clean demo forum
    const cleanRes = await cleanDemoFourMonths({ silent: true });
    expect(cleanRes.cleaned).toBe(true);

    const forumCountAfter = await prisma.forum.count();
    expect(forumCountAfter).toBe(forumCountBefore - 1);

    // Re-seed so it remains ready for user testing
    await seedDemoFourMonths();
  }, 120000);
});
