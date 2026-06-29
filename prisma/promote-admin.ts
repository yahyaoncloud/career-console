import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = 'ykinwork1@gmail.com';
  
  const updatedUser = await prisma.user.updateMany({
    where: { email: adminEmail },
    data: { role: 'ADMIN' }
  });
  
  if (updatedUser.count > 0) {
    console.log(`✅ Successfully promoted ${adminEmail} to ADMIN.`);
  } else {
    console.log(`❌ Could not find user with email ${adminEmail}.`);
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
