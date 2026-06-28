import { PrismaClient } from '@prisma/client'
import dotenv from 'dotenv'

dotenv.config()

const prisma = new PrismaClient()

async function seedSampleData() {
  console.log('🌱 Seeding data from portfolio export...')

  try {
    // ─── User ───────────────────────────────────────────────────────────────
    const user = await prisma.user.upsert({
      where: { email: 'ykinwork1@gmail.com' },
      update: {},
      create: {
        firebaseUid: '6a3f155a4ec3514f7c44e23a',
        email: 'ykinwork1@gmail.com',
        name: 'Yahya',
        role: 'USER',
        authorStatus: 'ACTIVE',
      },
    })
    console.log(`✅ User: ${user.email}`)

    // ─── Profile ────────────────────────────────────────────────────────────
    const profile = await prisma.profile.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        displayName: 'Yahya',
        slug: 'yahyaoncloud',
        bio: 'Cloud Engineer specializing in scalable infrastructure, serverless deployments, and robust web applications. Experienced in modern development workflows and cloud platforms.',
        avatar: 'https://olxnluwjpkboskbjsmlj.supabase.co/storage/v1/object/public/career-assets/avatars/avatar.jpeg?t=1782589329276',
        socialLinks: {
          github: 'github.com/yahyaoncloud',
          linkedin: 'linkedin.com/in/yahyaoncloud',
        },
        analyticsEnabled: true,
        guestbookEnabled: true,
      },
    })
    console.log(`✅ Profile: ${profile.displayName} (@${profile.slug})`)

    // ─── Portfolio ──────────────────────────────────────────────────────────
    const portfolioItems = [
      {
        id: 'proj-1',
        userId: user.id,
        title: 'Raweego',
        description:
          'AI Powered Android Application that converts documents into narrators, listen to your briefs, podcasts and stories on the go.',
        architectureDiagram:
          'Raweego Client Application [Android] -> Go Backend Server [REST, WEBSOCKETs, gRPC] -> Python AI Inference pipeline [llms, tts processing], Azure Cloud.',
        techStack: ['Kotlin', 'Python', 'Go', 'Postgres'],
        githubLink: 'https://github.com/raweego',
        demoLink: 'https://raweego.aburcloud.com',
        caseStudy: 'Built to provide tool for medical students, engineers and researchers.',
        category: 'Infrastructure',
      },
    ]

    for (const item of portfolioItems) {
      await prisma.portfolio.upsert({
        where: { id: item.id },
        update: {},
        create: item,
      })
      console.log(`✅ Portfolio: ${item.title}`)
    }

    console.log('\n✅ Seeding completed!')
  } catch (error) {
    console.error('❌ Seeding failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
    console.log('🔌 Prisma disconnected')
  }
}

seedSampleData()