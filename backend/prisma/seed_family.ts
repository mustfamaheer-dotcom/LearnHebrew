import { PrismaClient, Role, HebrewLevel, PackageStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding sample family accounts from client specs...');
  const passwordHash = await bcrypt.hash('LearnHebrew@2026', 10);

  const langEn = await prisma.language.findFirst({ where: { code: 'en' } });
  const langHe = await prisma.language.findFirst({ where: { code: 'he' } });
  const levelBet = await prisma.level.findFirst({ where: { code: HebrewLevel.ELEMENTARY } }) ||
                   await prisma.level.findFirst();

  // Find or create a Quarterly Package
  let quarterlyPkg = await prisma.package.findFirst({
    where: { name: { contains: 'Quarterly', mode: 'insensitive' } },
  });

  if (!quarterlyPkg) {
    quarterlyPkg = await prisma.package.create({
      data: {
        name: 'Quarterly Hebrew & English Plan',
        nameHe: 'תוכנית רבעונית לעברית ואנגלית',
        totalLessons: 16,
        validityDays: 90,
        price: 320,
        currency: 'USD',
        isActive: true,
      },
    });
  }

  // 1. Parent: Eenas alknawi
  const parent = await prisma.user.upsert({
    where: { email: 'talenalkrnawi92@gmail.com' },
    update: {
      firstName: 'Eenas',
      lastName: 'alknawi',
      phone: '+972543402227',
      isParent: true,
      familyRole: 'PARENT',
      role: Role.STUDENT,
    },
    create: {
      email: 'talenalkrnawi92@gmail.com',
      phone: '+972543402227',
      passwordHash,
      firstName: 'Eenas',
      lastName: 'alknawi',
      role: Role.STUDENT,
      languagePref: 'en',
      nativeLanguageId: langEn?.id || null,
      learningLanguageId: langHe?.id || null,
      isParent: true,
      familyRole: 'PARENT',
      studentProfile: {
        create: {
          level: HebrewLevel.INTERMEDIATE,
          levelId: levelBet?.id,
          totalPoints: 120,
          streakDays: 4,
        },
      },
      notificationPreference: {
        create: {
          reminder24hEnabled: true,
          reminder1hEnabled: true,
        },
      },
    },
  });

  console.log(`Parent account: ${parent.firstName} ${parent.lastName} (${parent.email}) ID: ${parent.id}`);

  // 2. Child 1: Talin alknawi
  const child1 = await prisma.user.upsert({
    where: { email: 'talenalkrnawi92+Talin@gmail.com' },
    update: {
      firstName: 'Talin',
      lastName: 'alknawi',
      phone: '543402227+TalinAlkrnawi',
      parentId: parent.id,
      isParent: false,
      familyRole: 'CHILD',
    },
    create: {
      email: 'talenalkrnawi92+Talin@gmail.com',
      phone: '543402227+TalinAlkrnawi',
      passwordHash,
      firstName: 'Talin',
      lastName: 'alknawi',
      role: Role.STUDENT,
      languagePref: 'en',
      parentId: parent.id,
      isParent: false,
      familyRole: 'CHILD',
      studentProfile: {
        create: {
          level: HebrewLevel.ELEMENTARY,
          levelId: levelBet?.id,
          totalPoints: 520,
          streakDays: 12,
        },
      },
      notificationPreference: {
        create: {
          reminder24hEnabled: true,
          reminder1hEnabled: true,
        },
      },
    },
    include: { studentProfile: true },
  });

  if (child1.studentProfile) {
    const existingPkg = await prisma.studentPackage.findFirst({
      where: { studentId: child1.studentProfile.id },
    });
    if (!existingPkg) {
      await prisma.studentPackage.create({
        data: {
          studentId: child1.studentProfile.id,
          packageId: quarterlyPkg.id,
          lessonsTotal: 16,
          lessonsUsed: 0,
          startDate: new Date('2026-09-14'),
          endDate: new Date('2026-12-14'),
          status: PackageStatus.ACTIVE,
        },
      });
    }
  }

  // 3. Child 2: Amir alknawi
  const child2 = await prisma.user.upsert({
    where: { email: 'talenalkrnawi92+Amir@gmail.com' },
    update: {
      firstName: 'Amir',
      lastName: 'alknawi',
      phone: '543402227+Amiralkrnawi',
      parentId: parent.id,
      isParent: false,
      familyRole: 'CHILD',
    },
    create: {
      email: 'talenalkrnawi92+Amir@gmail.com',
      phone: '543402227+Amiralkrnawi',
      passwordHash,
      firstName: 'Amir',
      lastName: 'alknawi',
      role: Role.STUDENT,
      languagePref: 'en',
      parentId: parent.id,
      isParent: false,
      familyRole: 'CHILD',
      studentProfile: {
        create: {
          level: HebrewLevel.BEGINNER,
          levelId: levelBet?.id,
          totalPoints: 340,
          streakDays: 7,
        },
      },
      notificationPreference: {
        create: {
          reminder24hEnabled: true,
          reminder1hEnabled: true,
        },
      },
    },
    include: { studentProfile: true },
  });

  if (child2.studentProfile) {
    const existingPkg = await prisma.studentPackage.findFirst({
      where: { studentId: child2.studentProfile.id },
    });
    if (!existingPkg) {
      await prisma.studentPackage.create({
        data: {
          studentId: child2.studentProfile.id,
          packageId: quarterlyPkg.id,
          lessonsTotal: 16,
          lessonsUsed: 0,
          startDate: new Date('2026-09-14'),
          endDate: new Date('2026-12-14'),
          status: PackageStatus.ACTIVE,
        },
      });
    }
  }

  console.log('Sample family accounts & Quarterly subscriptions seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
