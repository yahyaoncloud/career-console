import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding data from resume...');

  // 1. Find the main user
  const user = await prisma.user.findUnique({
    where: { email: 'ykinwork1@gmail.com' },
  });

  if (!user) {
    console.error('User ykinwork1@gmail.com not found. Please ensure the user exists first.');
    process.exit(1);
  }

  // 2. Seed Profile
  console.log('Upserting Profile...');
  const bio = "Cloud Engineer with 1.5 years of experience designing, deploying, and operating secure, highly available cloud infrastructure. Experienced in cloud operations, infrastructure automation with Terraform, production workload management, and incident troubleshooting. Hands-on with VPC design, IPsec VPN, IAM (RBAC), WAF, CI/CD workflows, and automation using Python and Bash.";

  await prisma.profile.upsert({
    where: { userId: user.id },
    update: {
      displayName: 'Yahya',
      slug: 'yahyaoncloud',
      bio: bio,
      socialLinks: {
        email: 'ykinwork1@gmail.com',
        phone: '+91 8096278589',
        linkedin: 'linkedin.com/in/ykinwork1',
        github: 'github.com/yahyaoncloud',
        location: 'Hyderabad, India'
      },
      resume: {
        summary: [
          "I am Yahya, a Cloud Engineer architecting secure infrastructure, writing automation, and solving complex production issues.",
          "I built this space to document real-world lessons—from DevOps to cloud networking—because knowledge compounds when shared. It serves as a growing collection of architecture guides and troubleshooting notes contributed by me and the engineers I collaborate with."
        ],
        technicalSkills: [
          { category: "Cloud Ecosystem", items: ["AWS", "Azure", "GCP", "VPC", "EC2", "ECS", "Lambda", "S3", "CloudFront"] },
          { category: "Security & Identity", items: ["AWS WAF", "IAM (RBAC)", "Security Groups", "Entra ID", "TLS/SSL"] },
          { category: "Automation & IaC", items: ["Terraform", "Ansible", "Python", "Bash", "GitOps"] },
          { category: "CI/CD & DevOps", items: ["CodePipeline", "CodeBuild", "GitHub Actions", "Git", "Ubuntu", "Rocky Linux"] },
          { category: "Monitoring & Ops", items: ["CloudWatch", "Prometheus", "Grafana", "Incident Management"] }
        ],
        experience: [
          {
            role: "Associate Cloud Engineer",
            company: "Minute KSA",
            period: "Nov 2024 - Mar 2026",
            description: "Designed highly available AWS VPC architectures for DEV/PROD. Hosted secure monolithic applications on ECS behind WAF/ALB, orchestrating asynchronous workflows via Lambda, SNS, and SQS. Provisioned infrastructure via Terraform under strict GitOps model, and executed migrations from Mobily Cloud to AWS with zero downtime."
          }
        ],
        certifications: [
          { name: "CCNP", brand: "Cisco", date: "2024", credlyLink: "" },
          { name: "Azure Cloud Architect", brand: "Microsoft", date: "2025", credlyLink: "" },
          { name: "AWS Cloud Architect Associate", brand: "AWS", date: "2025", credlyLink: "" },
          { name: "Terraform Associate", brand: "HashiCorp", date: "Ongoing", credlyLink: "", status: "ongoing" },
          { name: "Fortigate NSE4", brand: "Fortinet", date: "Ongoing", credlyLink: "", status: "ongoing" },
          { name: "Azure Administrator", brand: "Microsoft", date: "2023", credlyLink: "" }
        ]
      }
    },
    create: {
      userId: user.id,
      displayName: 'Yahya',
      slug: 'yahyaoncloud',
      bio: bio,
      socialLinks: {
        email: 'ykinwork1@gmail.com',
        phone: '+91 8096278589',
        linkedin: 'linkedin.com/in/ykinwork1',
        github: 'github.com/yahyaoncloud',
        location: 'Hyderabad, India'
      },
      resume: {
        summary: [
          "I am Yahya, a Cloud Engineer architecting secure infrastructure, writing automation, and solving complex production issues.",
          "I built this space to document real-world lessons—from DevOps to cloud networking—because knowledge compounds when shared. It serves as a growing collection of architecture guides and troubleshooting notes contributed by me and the engineers I collaborate with."
        ],
        technicalSkills: [
          { category: "Cloud Ecosystem", items: ["AWS", "Azure", "GCP", "VPC", "EC2", "ECS", "Lambda", "S3", "CloudFront"] },
          { category: "Security & Identity", items: ["AWS WAF", "IAM (RBAC)", "Security Groups", "Entra ID", "TLS/SSL"] },
          { category: "Automation & IaC", items: ["Terraform", "Ansible", "Python", "Bash", "GitOps"] },
          { category: "CI/CD & DevOps", items: ["CodePipeline", "CodeBuild", "GitHub Actions", "Git", "Ubuntu", "Rocky Linux"] },
          { category: "Monitoring & Ops", items: ["CloudWatch", "Prometheus", "Grafana", "Incident Management"] }
        ],
        experience: [
          {
            role: "Associate Cloud Engineer",
            company: "Minute KSA",
            period: "Nov 2024 - Mar 2026",
            description: "Designed highly available AWS VPC architectures for DEV/PROD. Hosted secure monolithic applications on ECS behind WAF/ALB, orchestrating asynchronous workflows via Lambda, SNS, and SQS. Provisioned infrastructure via Terraform under strict GitOps model, and executed migrations from Mobily Cloud to AWS with zero downtime."
          }
        ],
        certifications: [
          { name: "CCNP", brand: "Cisco", date: "2024", credlyLink: "" },
          { name: "Azure Cloud Architect", brand: "Microsoft", date: "2025", credlyLink: "" },
          { name: "AWS Cloud Architect Associate", brand: "AWS", date: "2025", credlyLink: "" },
          { name: "Terraform Associate", brand: "HashiCorp", date: "Ongoing", credlyLink: "", status: "ongoing" },
          { name: "Fortigate NSE4", brand: "Fortinet", date: "Ongoing", credlyLink: "", status: "ongoing" },
          { name: "Azure Administrator", brand: "Microsoft", date: "2023", credlyLink: "" }
        ]
      },
      analyticsEnabled: true,
      guestbookEnabled: true,
    }
  });

  // 3. Seed Portfolio Projects (from Resume)
  console.log('Seeding Portfolio Projects...');

  const projects = [
    {
      title: 'HormuzWatch',
      description: 'A real-time intelligence platform built for continuous telemetry ingestion, low-latency event processing, and live geospatial queries.',
      caseStudy: 'Decoupled ingestion from processing using Azure Event Hubs as the system spine for high-throughput telemetry without database backpressure. Implemented real-time WebSocket fanout via Container Apps (Go API) and scalable Python workers (VMSS) for anomaly detection. Provisioned enterprise-grade infrastructure with Terraform, utilizing Front Door Premium and VNet isolation for a hardened, SOC-ready architecture.',
      techStack: ['Azure Event Hubs', 'Container Apps', 'PostgreSQL', 'Python', 'Go', 'Terraform'],
      githubLink: 'https://github.com/yahyaoncloud/hormuzwatch',
      demoLink: 'https://hormuzwatch.aburcloud.com',
      category: 'Infrastructure',
    },
    {
      title: 'RaweeGo',
      description: 'An AI-powered document-to-audio platform utilizing OCR and an LLMOps pipeline built with Gunicorn and Python services.',
      caseStudy: 'Architected an MVP utilizing Azure Container Apps, PostgreSQL Flexible Server, and an isolated Ubuntu VM for Python-based AI workers. Engineered a hardened growth phase featuring Azure Front Door Premium, WAF, and Virtual Network isolation with Private Endpoints. Designed automated CI/CD workflows using GitHub Actions and orchestrated multi-region deployments with Terraform and Azure Bicep.',
      techStack: ['Azure Container Apps', 'PostgreSQL', 'Blob Storage', 'Entra ID', 'Terraform', 'Python', 'GitHub Actions'],
      githubLink: 'https://github.com/yahyaoncloud/raweego',
      demoLink: 'https://raweego.aburcloud.com',
      category: 'AI & ML',
    }
  ];

  for (const project of projects) {
    // Check if project exists by title
    const existing = await prisma.portfolio.findFirst({
      where: { userId: user.id, title: project.title }
    });

    if (existing) {
      await prisma.portfolio.update({
        where: { id: existing.id },
        data: project
      });
    } else {
      await prisma.portfolio.create({
        data: {
          ...project,
          userId: user.id,
        }
      });
    }
  }

  // 4. Seed Target Companies and Applications (Mock data based on resume skills to test the applications feature)
  console.log('Seeding mock target Companies and Applications...');

  const companiesData = [
    { name: 'Amazon Web Services', industry: 'Cloud Computing', status: 'TARGET' },
    { name: 'Microsoft', industry: 'Cloud Computing', status: 'TARGET' },
  ] as const;

  for (const c of companiesData) {
    const existingCompany = await prisma.company.findFirst({ where: { userId: user.id, name: c.name } });
    const company = existingCompany || await prisma.company.create({
      data: {
        userId: user.id,
        name: c.name,
        industry: c.industry,
        status: c.status
      }
    });

    // Create a mock application for this company
    const existingApp = await prisma.application.findFirst({ where: { userId: user.id, company: c.name } });
    if (!existingApp) {
      await prisma.application.create({
        data: {
          userId: user.id,
          company: company.name,
          position: 'Cloud DevOps Engineer',
          location: 'Remote',
          appliedDate: new Date(),
          status: 'APPLIED',
          priority: 'HIGH',
          tags: ['AWS', 'Terraform', 'Kubernetes'],
          notes: 'Mock application generated from seed script.'
        }
      });
    }
  }

  console.log('Resume seed complete!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
