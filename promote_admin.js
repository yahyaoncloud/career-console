import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany();
  console.log("Users:", users.map(u => ({ email: u.email, role: u.role })));

  const adminEmail = 'ykinwork1@gmail.com';
  
  const updatedUser = await prisma.user.updateMany({
    where: { email: adminEmail },
    data: { role: 'ADMIN' }
  });
  
  console.log(`Updated ${updatedUser.count} users to ADMIN role.`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
