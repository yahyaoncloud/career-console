import { PrismaClient } from '@prisma/client'
import { MongoClient, Db } from 'mongodb'
import dotenv from 'dotenv'

dotenv.config()

const prisma = new PrismaClient()
let mongoClient: MongoClient | null = null
let mongoDb: Db | null = null

// MongoDB connection
async function connectMongoDB() {
  const mongoUri = process.env.MONGO_URI
  if (!mongoUri) {
    console.warn('MONGO_URI not found in environment variables. Skipping MongoDB migration.')
    return false
  }

  try {
    mongoClient = new MongoClient(mongoUri)
    await mongoClient.connect()
    console.log('✅ Connected to MongoDB')
    
    // Extract database name from connection string or use default
    const dbName = mongoUri.split('/').pop()?.split('?')[0] || 'portfolio'
    mongoDb = mongoClient.db(dbName)
    return true
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error)
    return false
  }
}

// Transform MongoDB User to Prisma User
function transformUser(mongoUser: any) {
  return {
    id: mongoUser._id?.toString() || undefined,
    firebaseUid: mongoUser.firebaseUid || mongoUser._id?.toString() || '',
    email: mongoUser.email || '',
    emailVerified: mongoUser.emailVerified ? new Date(mongoUser.emailVerified) : null,
    name: mongoUser.name || null,
    image: mongoUser.image || mongoUser.avatar || null,
    role: mongoUser.role || 'USER',
    authorStatus: mongoUser.authorStatus || 'ACTIVE',
    createdAt: mongoUser.createdAt ? new Date(mongoUser.createdAt) : new Date(),
    updatedAt: mongoUser.updatedAt ? new Date(mongoUser.updatedAt) : new Date(),
    deletedAt: mongoUser.deletedAt ? new Date(mongoUser.deletedAt) : null,
    createdBy: mongoUser.createdBy || null,
    updatedBy: mongoUser.updatedBy || null,
  }
}

// Transform MongoDB Application to Prisma Application
function transformApplication(mongoApp: any, userId: string) {
  return {
    id: mongoApp._id?.toString() || undefined,
    userId,
    company: mongoApp.company || '',
    position: mongoApp.position || '',
    location: mongoApp.location || null,
    salary: mongoApp.salary || null,
    employmentType: mongoApp.employmentType || null,
    appliedDate: mongoApp.appliedDate ? new Date(mongoApp.appliedDate) : new Date(),
    deadline: mongoApp.deadline ? new Date(mongoApp.deadline) : null,
    referral: mongoApp.referral || null,
    recruiter: mongoApp.recruiter || null,
    contact: mongoApp.contact || null,
    website: mongoApp.website || null,
    priority: mongoApp.priority || 'MEDIUM',
    status: mongoApp.status || 'APPLIED',
    interviewDate: mongoApp.interviewDate ? new Date(mongoApp.interviewDate) : null,
    notes: mongoApp.notes || null,
    resumeUsed: mongoApp.resumeUsed || null,
    coverLetter: mongoApp.coverLetter || null,
    tags: mongoApp.tags || [],
    version: mongoApp.version || 1,
    createdAt: mongoApp.createdAt ? new Date(mongoApp.createdAt) : new Date(),
    updatedAt: mongoApp.updatedAt ? new Date(mongoApp.updatedAt) : new Date(),
    deletedAt: mongoApp.deletedAt ? new Date(mongoApp.deletedAt) : null,
    createdBy: mongoApp.createdBy || null,
    updatedBy: mongoApp.updatedBy || null,
  }
}

// Transform MongoDB Portfolio to Prisma Portfolio
function transformPortfolio(mongoPortfolio: any, userId: string) {
  return {
    id: mongoPortfolio._id?.toString() || undefined,
    userId,
    title: mongoPortfolio.title || mongoPortfolio.name || '',
    description: mongoPortfolio.description || '',
    architectureDiagram: mongoPortfolio.architectureDiagram || null,
    techStack: mongoPortfolio.techStack || mongoPortfolio.technologies || [],
    githubLink: mongoPortfolio.githubLink || mongoPortfolio.github || null,
    demoLink: mongoPortfolio.demoLink || mongoPortfolio.link || null,
    caseStudy: mongoPortfolio.caseStudy || null,
    category: mongoPortfolio.category || 'Infrastructure',
    version: mongoPortfolio.version || 1,
    createdAt: mongoPortfolio.createdAt ? new Date(mongoPortfolio.createdAt) : new Date(),
    updatedAt: mongoPortfolio.updatedAt ? new Date(mongoPortfolio.updatedAt) : new Date(),
    deletedAt: mongoPortfolio.deletedAt ? new Date(mongoPortfolio.deletedAt) : null,
    createdBy: mongoPortfolio.createdBy || null,
    updatedBy: mongoPortfolio.updatedBy || null,
  }
}

// Transform MongoDB Guestbook to Prisma Guestbook
function transformGuestbook(mongoGuestbook: any, userId: string | null) {
  return {
    id: mongoGuestbook._id?.toString() || undefined,
    userId,
    name: mongoGuestbook.name || 'Anonymous',
    message: mongoGuestbook.message || '',
    createdAt: mongoGuestbook.createdAt ? new Date(mongoGuestbook.createdAt) : new Date(),
    updatedAt: mongoGuestbook.updatedAt ? new Date(mongoGuestbook.updatedAt) : new Date(),
    deletedAt: mongoGuestbook.deletedAt ? new Date(mongoGuestbook.deletedAt) : null,
  }
}

// Transform MongoDB Config to Prisma Config
function transformConfig(mongoConfig: any, userId: string) {
  return {
    id: mongoConfig._id?.toString() || undefined,
    userId,
    key: mongoConfig.key || '',
    value: mongoConfig.value || false,
    createdAt: mongoConfig.createdAt ? new Date(mongoConfig.createdAt) : new Date(),
    updatedAt: mongoConfig.updatedAt ? new Date(mongoConfig.updatedAt) : new Date(),
  }
}

// Transform MongoDB LearningTopic to Prisma LearningTopic
function transformLearningTopic(mongoTopic: any, userId: string | null) {
  return {
    id: mongoTopic._id?.toString() || undefined,
    userId,
    topic: mongoTopic.topic || '',
    description: mongoTopic.description || '',
    action: mongoTopic.action || '',
    date: mongoTopic.date || new Date().toISOString(),
    createdAt: mongoTopic.createdAt ? new Date(mongoTopic.createdAt) : new Date(),
  }
}

// Transform MongoDB Company to Prisma Company
function transformCompany(mongoCompany: any, userId: string) {
  return {
    id: mongoCompany._id?.toString() || undefined,
    userId,
    name: mongoCompany.name || '',
    website: mongoCompany.website || null,
    industry: mongoCompany.industry || null,
    hq: mongoCompany.hq || null,
    size: mongoCompany.size || null,
    status: mongoCompany.status || 'TRACKING',
    notes: mongoCompany.notes || null,
    recruiter: mongoCompany.recruiter || null,
    contactEmail: mongoCompany.contactEmail || null,
    linkedinUrl: mongoCompany.linkedinUrl || null,
    tags: mongoCompany.tags || [],
    createdAt: mongoCompany.createdAt ? new Date(mongoCompany.createdAt) : new Date(),
    updatedAt: mongoCompany.updatedAt ? new Date(mongoCompany.updatedAt) : new Date(),
    deletedAt: mongoCompany.deletedAt ? new Date(mongoCompany.deletedAt) : null,
  }
}

// Transform MongoDB Document to Prisma Document
function transformDocument(mongoDocument: any, userId: string) {
  return {
    id: mongoDocument._id?.toString() || undefined,
    userId,
    name: mongoDocument.name || '',
    type: mongoDocument.type || 'OTHER',
    url: mongoDocument.url || '',
    version: mongoDocument.version || null,
    createdAt: mongoDocument.createdAt ? new Date(mongoDocument.createdAt) : new Date(),
    updatedAt: mongoDocument.updatedAt ? new Date(mongoDocument.updatedAt) : new Date(),
    deletedAt: mongoDocument.deletedAt ? new Date(mongoDocument.deletedAt) : null,
  }
}

// Transform MongoDB AuthorProfile to Prisma Profile
function transformProfile(mongoProfile: any, userId: string) {
  return {
    id: mongoProfile._id?.toString() || undefined,
    userId,
    displayName: mongoProfile.displayName || mongoProfile.name || '',
    slug: mongoProfile.slug || mongoProfile.displayName?.toLowerCase().replace(/\s+/g, '-') || '',
    bio: mongoProfile.bio || null,
    avatar: mongoProfile.avatar || mongoProfile.profileImage || null,
    coverImage: mongoProfile.coverImage || null,
    website: mongoProfile.website || null,
    socialLinks: mongoProfile.socialLinks || null,
    theme: mongoProfile.theme || null,
    customDomain: mongoProfile.customDomain || null,
    analyticsEnabled: mongoProfile.analyticsEnabled ?? true,
    guestbookEnabled: mongoProfile.guestbookEnabled ?? true,
    createdAt: mongoProfile.createdAt ? new Date(mongoProfile.createdAt) : new Date(),
    updatedAt: mongoProfile.updatedAt ? new Date(mongoProfile.updatedAt) : new Date(),
  }
}

// Main migration function
async function migrateData() {
  const mongoConnected = await connectMongoDB()
  
  if (!mongoConnected) {
    console.log('⚠️  MongoDB not connected. Skipping data migration.')
    return
  }

  try {
    console.log('🚀 Starting data migration from MongoDB to PostgreSQL...')

    // Migrate Users
    console.log('\n📦 Migrating Users...')
    const mongoUsers = await mongoDb!.collection('users').find({}).toArray()
    console.log(`Found ${mongoUsers.length} users in MongoDB`)
    
    for (const mongoUser of mongoUsers) {
      const userData = transformUser(mongoUser)
      
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { firebaseUid: userData.firebaseUid }
      })
      
      if (!existingUser) {
        await prisma.user.create({ data: userData })
        console.log(`  ✅ Created user: ${userData.email}`)
      } else {
        console.log(`  ⏭️  User already exists: ${userData.email}`)
      }
    }

    // Get all users for foreign key references
    const users = await prisma.user.findMany()
    const userMap = new Map(users.map(u => [u.email, u.id]))
    const firebaseUidMap = new Map(users.map(u => [u.firebaseUid, u.id]))

    // Migrate Applications
    console.log('\n📦 Migrating Applications...')
    const mongoApplications = await mongoDb!.collection('applications').find({}).toArray()
    console.log(`Found ${mongoApplications.length} applications in MongoDB`)
    
    for (const mongoApp of mongoApplications) {
      const userId = firebaseUidMap.get(mongoApp.userId) || mongoApp.userId
      if (!userId) {
        console.log(`  ⚠️  Skipping application - no user found: ${mongoApp._id}`)
        continue
      }
      
      const appData = transformApplication(mongoApp, userId)
      
      const existingApp = await prisma.application.findUnique({
        where: { id: appData.id }
      })
      
      if (!existingApp) {
        await prisma.application.create({ data: appData })
        console.log(`  ✅ Created application: ${appData.company}`)
      } else {
        console.log(`  ⏭️  Application already exists: ${appData.company}`)
      }
    }

    // Migrate Portfolio
    console.log('\n📦 Migrating Portfolio...')
    const mongoPortfolio = await mongoDb!.collection('portfolio').find({}).toArray()
    console.log(`Found ${mongoPortfolio.length} portfolio items in MongoDB`)
    
    for (const mongoItem of mongoPortfolio) {
      const userId = firebaseUidMap.get(mongoItem.userId) || mongoItem.userId
      if (!userId) {
        console.log(`  ⚠️  Skipping portfolio item - no user found: ${mongoItem._id}`)
        continue
      }
      
      const portfolioData = transformPortfolio(mongoItem, userId)
      
      const existingPortfolio = await prisma.portfolio.findUnique({
        where: { id: portfolioData.id }
      })
      
      if (!existingPortfolio) {
        await prisma.portfolio.create({ data: portfolioData })
        console.log(`  ✅ Created portfolio item: ${portfolioData.title}`)
      } else {
        console.log(`  ⏭️  Portfolio item already exists: ${portfolioData.title}`)
      }
    }

    // Migrate Guestbook
    console.log('\n📦 Migrating Guestbook...')
    const mongoGuestbook = await mongoDb!.collection('guestbook').find({}).toArray()
    console.log(`Found ${mongoGuestbook.length} guestbook entries in MongoDB`)
    
    for (const mongoEntry of mongoGuestbook) {
      const userId = mongoEntry.userId ? (firebaseUidMap.get(mongoEntry.userId) || null) : null
      const guestbookData = transformGuestbook(mongoEntry, userId)
      
      const existingEntry = await prisma.guestbook.findUnique({
        where: { id: guestbookData.id }
      })
      
      if (!existingEntry) {
        await prisma.guestbook.create({ data: guestbookData })
        console.log(`  ✅ Created guestbook entry: ${guestbookData.name}`)
      } else {
        console.log(`  ⏭️  Guestbook entry already exists: ${guestbookData.name}`)
      }
    }

    // Migrate Config
    console.log('\n📦 Migrating Config...')
    const mongoConfig = await mongoDb!.collection('config').find({}).toArray()
    console.log(`Found ${mongoConfig.length} config items in MongoDB`)
    
    for (const mongoItem of mongoConfig) {
      const userId = firebaseUidMap.get(mongoItem.userId) || mongoItem.userId
      if (!userId) {
        console.log(`  ⚠️  Skipping config item - no user found: ${mongoItem._id}`)
        continue
      }
      
      const configData = transformConfig(mongoItem, userId)
      
      const existingConfig = await prisma.config.findUnique({
        where: { id: configData.id }
      })
      
      if (!existingConfig) {
        await prisma.config.create({ data: configData })
        console.log(`  ✅ Created config item: ${configData.key}`)
      } else {
        console.log(`  ⏭️  Config item already exists: ${configData.key}`)
      }
    }

    // Migrate LearningTopics
    console.log('\n📦 Migrating LearningTopics...')
    const mongoTopics = await mongoDb!.collection('learningTopics').find({}).toArray()
    console.log(`Found ${mongoTopics.length} learning topics in MongoDB`)
    
    for (const mongoTopic of mongoTopics) {
      const userId = mongoTopic.userId ? (firebaseUidMap.get(mongoTopic.userId) || null) : null
      const topicData = transformLearningTopic(mongoTopic, userId)
      
      const existingTopic = await prisma.learningTopic.findUnique({
        where: { id: topicData.id }
      })
      
      if (!existingTopic) {
        await prisma.learningTopic.create({ data: topicData })
        console.log(`  ✅ Created learning topic: ${topicData.topic}`)
      } else {
        console.log(`  ⏭️  Learning topic already exists: ${topicData.topic}`)
      }
    }

    // Migrate Companies
    console.log('\n📦 Migrating Companies...')
    const mongoCompanies = await mongoDb!.collection('companies').find({}).toArray()
    console.log(`Found ${mongoCompanies.length} companies in MongoDB`)
    
    for (const mongoCompany of mongoCompanies) {
      const userId = firebaseUidMap.get(mongoCompany.userId) || mongoCompany.userId
      if (!userId) {
        console.log(`  ⚠️  Skipping company - no user found: ${mongoCompany._id}`)
        continue
      }
      
      const companyData = transformCompany(mongoCompany, userId)
      
      const existingCompany = await prisma.company.findUnique({
        where: { id: companyData.id }
      })
      
      if (!existingCompany) {
        await prisma.company.create({ data: companyData })
        console.log(`  ✅ Created company: ${companyData.name}`)
      } else {
        console.log(`  ⏭️  Company already exists: ${companyData.name}`)
      }
    }

    // Migrate Documents
    console.log('\n📦 Migrating Documents...')
    const mongoDocuments = await mongoDb!.collection('documents').find({}).toArray()
    console.log(`Found ${mongoDocuments.length} documents in MongoDB`)
    
    for (const mongoDocument of mongoDocuments) {
      const userId = firebaseUidMap.get(mongoDocument.userId) || mongoDocument.userId
      if (!userId) {
        console.log(`  ⚠️  Skipping document - no user found: ${mongoDocument._id}`)
        continue
      }
      
      const documentData = transformDocument(mongoDocument, userId)
      
      const existingDocument = await prisma.document.findUnique({
        where: { id: documentData.id }
      })
      
      if (!existingDocument) {
        await prisma.document.create({ data: documentData })
        console.log(`  ✅ Created document: ${documentData.name}`)
      } else {
        console.log(`  ⏭️  Document already exists: ${documentData.name}`)
      }
    }

    // Migrate AuthorProfile to Profile
    console.log('\n📦 Migrating AuthorProfile to Profile...')
    const mongoProfiles = await mongoDb!.collection('authorProfiles').find({}).toArray()
    console.log(`Found ${mongoProfiles.length} author profiles in MongoDB`)
    
    for (const mongoProfile of mongoProfiles) {
      const userId = firebaseUidMap.get(mongoProfile.userId) || mongoProfile.userId
      if (!userId) {
        console.log(`  ⚠️  Skipping profile - no user found: ${mongoProfile._id}`)
        continue
      }
      
      const profileData = transformProfile(mongoProfile, userId)
      
      const existingProfile = await prisma.profile.findUnique({
        where: { userId }
      })
      
      if (!existingProfile) {
        await prisma.profile.create({ data: profileData })
        console.log(`  ✅ Created profile: ${profileData.displayName}`)
      } else {
        console.log(`  ⏭️  Profile already exists: ${profileData.displayName}`)
      }
    }

    console.log('\n✅ Data migration completed successfully!')
  } catch (error) {
    console.error('❌ Migration failed:', error)
    throw error
  } finally {
    if (mongoClient) {
      await mongoClient.close()
      console.log('🔌 MongoDB connection closed')
    }
  }
}

// Seed with sample data if no MongoDB connection
async function seedSampleData() {
  console.log('🌱 Seeding sample data...')

  try {
    // Create a sample user
    const user = await prisma.user.upsert({
      where: { email: 'demo@example.com' },
      update: {},
      create: {
        firebaseUid: 'demo-firebase-uid',
        email: 'demo@example.com',
        name: 'Demo User',
        role: 'USER',
        authorStatus: 'ACTIVE',
      },
    })
    console.log(`✅ Created/updated user: ${user.email}`)

    // Create sample profile
    const profile = await prisma.profile.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        displayName: 'Demo User',
        slug: 'demo-user',
        bio: 'Experienced Cloud Engineer specializing in building scalable infrastructure, serverless architectures, and automation pipelines.',
        avatar: null,
        socialLinks: {
          github: 'github.com/demo',
          linkedin: 'linkedin.com/in/demo'
        },
        analyticsEnabled: true,
        guestbookEnabled: true,
      },
    })
    console.log(`✅ Created/updated profile: ${profile.displayName}`)

    // Create sample portfolio items
    const portfolioItems = [
      {
        userId: user.id,
        title: 'Serverless API Platform',
        description: 'Built a scalable serverless API platform handling millions of requests per day with auto-scaling capabilities.',
        architectureDiagram: 'API Gateway → Lambda → DynamoDB',
        techStack: ['AWS Lambda', 'API Gateway', 'DynamoDB', 'CloudWatch', 'S3'],
        githubLink: 'https://github.com/demo/serverless-api',
        demoLink: 'https://demo.example.com',
        caseStudy: 'Designed and implemented a serverless architecture that reduced infrastructure costs by 70%.',
        category: 'Infrastructure',
      },
      {
        userId: user.id,
        title: 'Kubernetes Microservices',
        description: 'Deployed and managed a microservices architecture on Kubernetes with automated scaling and self-healing capabilities.',
        architectureDiagram: 'Ingress → Service → Pod → Container',
        techStack: ['Kubernetes', 'Docker', 'Helm', 'Prometheus', 'Grafana'],
        githubLink: 'https://github.com/demo/k8s-microservices',
        caseStudy: 'Implemented GitOps workflows using ArgoCD for zero-downtime deployments.',
        category: 'DevOps',
      },
    ]

    for (const item of portfolioItems) {
      await prisma.portfolio.upsert({
        where: { id: 'demo-' + item.title.toLowerCase().replace(/\s+/g, '-') },
        update: {},
        create: {
          id: 'demo-' + item.title.toLowerCase().replace(/\s+/g, '-'),
          ...item,
        },
      })
      console.log(`✅ Created portfolio item: ${item.title}`)
    }

    console.log('✅ Sample data seeding completed!')
  } catch (error) {
    console.error('❌ Sample data seeding failed:', error)
    throw error
  }
}

// Main function
async function main() {
  try {
    // Try to migrate from MongoDB first
    await migrateData()
    
    // If no MongoDB data, seed sample data
    const userCount = await prisma.user.count()
    if (userCount === 0) {
      console.log('\n📊 No users found. Seeding sample data...')
      await seedSampleData()
    }
  } catch (error) {
    console.error('❌ Seed script failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
    console.log('🔌 Prisma client disconnected')
  }
}

main()
