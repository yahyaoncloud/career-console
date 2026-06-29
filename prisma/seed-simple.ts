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
      update: {
        resume: {
          summary: [
            'Building scalable infrastructure, serverless architectures, and automation pipelines for modern enterprises.'
          ],
          technicalSkills: [
            { category: "Cloud & Ops", items: ["AWS", "GCP", "Kubernetes", "Docker", "Terraform", "Ansible"] },
            { category: "Languages", items: ["TypeScript", "Python", "Go", "Bash"] },
            { category: "Frameworks", items: ["React", "Node.js", "Express", "Next.js"] }
          ],
          experience: [
            { role: "Cloud DevOps Engineer", company: "Tech Solutions Inc.", period: "2023 - Present", description: "Architecting cloud-native solutions, CI/CD pipelines, and infrastructure as code." },
            { role: "Systems Administrator", company: "Enterprise IT", period: "2021 - 2023", description: "Managed hybrid cloud infrastructure, Linux servers, and automated routine maintenance." }
          ],
          certifications: [
            { name: "AWS Certified Solutions Architect", brand: "Amazon Web Services", date: "2023", status: "completed", credlyLink: "#" },
            { name: "Certified Kubernetes Administrator", brand: "Cloud Native Computing Foundation", date: "2024", status: "ongoing" }
          ]
        }
      },
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
        resume: {
          summary: [
            'Building scalable infrastructure, serverless architectures, and automation pipelines for modern enterprises.'
          ],
          technicalSkills: [
            { category: "Cloud & Ops", items: ["AWS", "GCP", "Kubernetes", "Docker", "Terraform", "Ansible"] },
            { category: "Languages", items: ["TypeScript", "Python", "Go", "Bash"] },
            { category: "Frameworks", items: ["React", "Node.js", "Express", "Next.js"] }
          ],
          experience: [
            { role: "Cloud DevOps Engineer", company: "Tech Solutions Inc.", period: "2023 - Present", description: "Architecting cloud-native solutions, CI/CD pipelines, and infrastructure as code." },
            { role: "Systems Administrator", company: "Enterprise IT", period: "2021 - 2023", description: "Managed hybrid cloud infrastructure, Linux servers, and automated routine maintenance." }
          ],
          certifications: [
            { name: "AWS Certified Solutions Architect", brand: "Amazon Web Services", date: "2023", status: "completed", credlyLink: "#" },
            { name: "Certified Kubernetes Administrator", brand: "Cloud Native Computing Foundation", date: "2024", status: "ongoing" }
          ]
        }
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