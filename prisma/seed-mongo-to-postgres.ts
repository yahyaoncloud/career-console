import { MongoClient } from 'mongodb';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';

// Load env variables
dotenv.config();

const prisma = new PrismaClient();

async function main() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error('MONGO_URI is not set in the env file');
    process.exit(1);
  }

  console.log('Connecting to MongoDB...');
  const mongoClient = new MongoClient(uri);

  try {
    await mongoClient.connect();
    console.log('Connected to MongoDB successfully.');
    const db = mongoClient.db();

    console.log('Clearing existing PostgreSQL data for clean migration...');
    await prisma.document.deleteMany();
    await prisma.company.deleteMany();
    await prisma.profile.deleteMany();
    await prisma.learningTopic.deleteMany();
    await prisma.config.deleteMany();
    await prisma.log.deleteMany();
    await prisma.guestbook.deleteMany();
    await prisma.portfolio.deleteMany();
    await prisma.application.deleteMany();
    await prisma.user.deleteMany();
    console.log('PostgreSQL data cleared.');

    // 1. Users
    console.log('\n--- Migrating Users ---');
    const usersCollection = db.collection('users');
    const users = await usersCollection.find({}).toArray();
    for (const u of users) {
      await prisma.user.upsert({
        where: { id: u._id.toString() },
        update: {},
        create: {
          id: u._id.toString(),
          firebaseUid: u.firebaseUid || u._id.toString(), // Needs unique
          email: u.email,
          emailVerified: u.emailVerified || null,
          name: u.name || null,
          image: u.image || null,
          role: u.role ? u.role.toUpperCase() : 'USER',
          authorStatus: u.authorStatus ? u.authorStatus.toUpperCase() : 'ACTIVE',
          createdAt: u.createdAt || new Date(),
          updatedAt: u.updatedAt || new Date(),
          deletedAt: u.deletedAt || null,
          createdBy: u.createdBy || null,
          updatedBy: u.updatedBy || null,
        },
      });
    }
    console.log(`Migrated ${users.length} users.`);

    // 2. Applications
    console.log('\n--- Migrating Applications ---');
    const applicationsCollection = db.collection('applications');
    const applications = await applicationsCollection.find({}).toArray();
    for (const a of applications) {
      await prisma.application.upsert({
        where: { id: a._id.toString() },
        update: {},
        create: {
          id: a._id.toString(),
          userId: a.userId || (users[0] ? users[0]._id.toString() : 'unknown'),
          company: a.company || 'Unknown',
          position: a.position || 'Unknown',
          location: a.location || null,
          salary: a.salary || null,
          employmentType: a.employmentType || null,
          appliedDate: a.appliedDate ? new Date(a.appliedDate) : new Date(),
          deadline: a.deadline ? new Date(a.deadline) : null,
          referral: a.referral || null,
          recruiter: a.recruiter || null,
          contact: a.contact || null,
          website: a.website || null,
          priority: a.priority ? a.priority.toUpperCase().replace(/\s+/g, '_') : 'MEDIUM',
          status: a.status ? a.status.toUpperCase().replace(/\s+/g, '_') : 'APPLIED',
          interviewDate: a.interviewDate ? new Date(a.interviewDate) : null,
          notes: a.notes || null,
          resumeUsed: a.resumeUsed || null,
          coverLetter: a.coverLetter || null,
          tags: a.tags || [],
          version: a.version || 1,
          createdAt: a.createdAt || new Date(),
          updatedAt: a.updatedAt || new Date(),
          deletedAt: a.deletedAt || null,
          createdBy: a.createdBy || null,
          updatedBy: a.updatedBy || null,
        },
      });
    }
    console.log(`Migrated ${applications.length} applications.`);

    // 3. Portfolios
    console.log('\n--- Migrating Portfolios ---');
    const portfoliosCollection = db.collection('portfolios');
    const portfolios = await portfoliosCollection.find({}).toArray();
    for (const p of portfolios) {
      await prisma.portfolio.upsert({
        where: { id: p._id.toString() },
        update: {},
        create: {
          id: p._id.toString(),
          userId: p.userId || (users[0] ? users[0]._id.toString() : 'unknown'),
          title: p.title || 'Untitled',
          description: p.description || '',
          architectureDiagram: p.architectureDiagram || null,
          techStack: p.techStack || [],
          githubLink: p.githubLink || null,
          demoLink: p.demoLink || null,
          caseStudy: p.caseStudy || null,
          category: p.category || 'General',
          version: p.version || 1,
          createdAt: p.createdAt || new Date(),
          updatedAt: p.updatedAt || new Date(),
          deletedAt: p.deletedAt || null,
          createdBy: p.createdBy || null,
          updatedBy: p.updatedBy || null,
        },
      });
    }
    console.log(`Migrated ${portfolios.length} portfolios.`);

    // 4. Guestbook
    console.log('\n--- Migrating Guestbook ---');
    const guestbooksCollection = db.collection('guestbooks');
    const guestbooks = await guestbooksCollection.find({}).toArray();
    for (const g of guestbooks) {
      await prisma.guestbook.upsert({
        where: { id: g._id.toString() },
        update: {},
        create: {
          id: g._id.toString(),
          userId: g.userId || null,
          name: g.name || 'Anonymous',
          message: g.message || '',
          createdAt: g.createdAt || new Date(),
          updatedAt: g.updatedAt || new Date(),
          deletedAt: g.deletedAt || null,
        },
      });
    }
    console.log(`Migrated ${guestbooks.length} guestbook entries.`);

    // 5. Logs
    console.log('\n--- Migrating Logs ---');
    const logsCollection = db.collection('logs');
    const logs = await logsCollection.find({}).toArray();
    for (const l of logs) {
      await prisma.log.upsert({
        where: { id: l._id.toString() },
        update: {},
        create: {
          id: l._id.toString(),
          userId: l.userId || null,
          event: l.event || 'Unknown',
          status: l.status ? l.status.toUpperCase() : 'INFO',
          module: l.module || 'Unknown',
          createdAt: l.createdAt || new Date(),
        },
      });
    }
    console.log(`Migrated ${logs.length} logs.`);

    // 6. Configs
    console.log('\n--- Migrating Configs ---');
    const configsCollection = db.collection('configs');
    const configs = await configsCollection.find({}).toArray();
    for (const c of configs) {
      await prisma.config.upsert({
        where: { id: c._id.toString() },
        update: {},
        create: {
          id: c._id.toString(),
          userId: c.userId || (users[0] ? users[0]._id.toString() : 'unknown'),
          key: c.key,
          value: c.value === undefined ? true : c.value,
          createdAt: c.createdAt || new Date(),
          updatedAt: c.updatedAt || new Date(),
        },
      });
    }
    console.log(`Migrated ${configs.length} configs.`);

    // 7. LearningTopics
    console.log('\n--- Migrating LearningTopics ---');
    const learningTopicsCollection = db.collection('learningtopics');
    const learningTopics = await learningTopicsCollection.find({}).toArray();
    for (const lt of learningTopics) {
      await prisma.learningTopic.upsert({
        where: { id: lt._id.toString() },
        update: {},
        create: {
          id: lt._id.toString(),
          userId: lt.userId || null,
          topic: lt.topic || 'Unknown',
          description: lt.description || '',
          action: lt.action || '',
          date: lt.date || '',
          createdAt: lt.createdAt || new Date(),
        },
      });
    }
    console.log(`Migrated ${learningTopics.length} learning topics.`);

    // 8. Profiles
    console.log('\n--- Migrating Profiles ---');
    const profilesCollection = db.collection('profiles');
    const profiles = await profilesCollection.find({}).toArray();
    for (const pr of profiles) {
      await prisma.profile.upsert({
        where: { id: pr._id.toString() },
        update: {},
        create: {
          id: pr._id.toString(),
          userId: pr.userId || (users[0] ? users[0]._id.toString() : 'unknown'),
          displayName: pr.displayName || 'Anonymous',
          slug: pr.slug || pr._id.toString(),
          bio: pr.bio || null,
          avatar: pr.avatar || null,
          coverImage: pr.coverImage || null,
          website: pr.website || null,
          socialLinks: pr.socialLinks || null,
          theme: pr.theme || null,
          customDomain: pr.customDomain || null,
          analyticsEnabled: pr.analyticsEnabled === undefined ? true : pr.analyticsEnabled,
          guestbookEnabled: pr.guestbookEnabled === undefined ? true : pr.guestbookEnabled,
          createdAt: pr.createdAt || new Date(),
          updatedAt: pr.updatedAt || new Date(),
        },
      });
    }
    console.log(`Migrated ${profiles.length} profiles.`);

    // 9. Companies
    console.log('\n--- Migrating Companies ---');
    const companiesCollection = db.collection('companies');
    const companies = await companiesCollection.find({}).toArray();
    for (const c of companies) {
      await prisma.company.upsert({
        where: { id: c._id.toString() },
        update: {},
        create: {
          id: c._id.toString(),
          userId: c.userId || (users[0] ? users[0]._id.toString() : 'unknown'),
          name: c.name || 'Unknown',
          website: c.website || null,
          industry: c.industry || null,
          hq: c.hq || null,
          size: c.size || null,
          status: c.status ? c.status.toUpperCase() : 'TRACKING',
          notes: c.notes || null,
          recruiter: c.recruiter || null,
          contactEmail: c.contactEmail || null,
          linkedinUrl: c.linkedinUrl || null,
          tags: c.tags || [],
          createdAt: c.createdAt || new Date(),
          updatedAt: c.updatedAt || new Date(),
          deletedAt: c.deletedAt || null,
        },
      });
    }
    console.log(`Migrated ${companies.length} companies.`);

    // 10. Documents
    console.log('\n--- Migrating Documents ---');
    const documentsCollection = db.collection('documents');
    const documents = await documentsCollection.find({}).toArray();
    for (const d of documents) {
      await prisma.document.upsert({
        where: { id: d._id.toString() },
        update: {},
        create: {
          id: d._id.toString(),
          userId: d.userId || (users[0] ? users[0]._id.toString() : 'unknown'),
          name: d.name || 'Unknown',
          type: d.type ? d.type.toUpperCase().replace(/\s+/g, '_') : 'OTHER',
          url: d.url || '',
          version: d.version || null,
          createdAt: d.createdAt || new Date(),
          updatedAt: d.updatedAt || new Date(),
          deletedAt: d.deletedAt || null,
        },
      });
    }
    console.log(`Migrated ${documents.length} documents.`);

    console.log('\nMigration from MongoDB to PostgreSQL complete!');
  } catch (error) {
    console.error('Error during migration:', error);
  } finally {
    await mongoClient.close();
    await prisma.$disconnect();
  }
}

main();
