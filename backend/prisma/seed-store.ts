import { PrismaClient, StoreItemType, StoreItemRarity } from '@prisma/client';

const prisma = new PrismaClient();

const STORE_PERMISSIONS: Array<{
  code: string;
  group: string;
  description: string;
  roles: string[];
}> = [
  {
    code: 'store:view_items',
    group: 'Store',
    description: 'Browse store items and cosmetics catalog',
    roles: ['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT', 'CS'],
  },
  {
    code: 'store:redeem',
    group: 'Store',
    description: 'Redeem store items with coins',
    roles: ['STUDENT'],
  },
  {
    code: 'store:manage_items',
    group: 'Store',
    description: 'Create, edit, and deactivate store items',
    roles: ['SUPER_ADMIN', 'ADMIN'],
  },
  {
    code: 'store:grant_coins',
    group: 'Store',
    description: 'Manually grant or deduct student coins',
    roles: ['SUPER_ADMIN', 'ADMIN'],
  },
  {
    code: 'store:view_transactions',
    group: 'Store',
    description: 'View student coin transaction audit log',
    roles: ['SUPER_ADMIN', 'ADMIN', 'CS'],
  },
];

const STARTER_STORE_ITEMS = [
  {
    type: StoreItemType.AVATAR_FRAME,
    rarity: StoreItemRarity.COMMON,
    isActive: true,
    sortOrder: 1,
    coinCost: 80,
    nameEn: 'Emerald Pulse Frame',
    nameHe: 'מסגרת אמרלד',
    nameAr: 'إطار الزمرد',
    descEn: 'A crisp emerald border that highlights your profile avatar.',
    descHe: 'מסגרת ירוקה מרעננת המדגישה את תמונת הפרופיל שלך.',
    descAr: 'إطار زمردي أنيق يبرز صورة ملفك الشخصي.',
    frameAnimated: false,
    frameCssClass: 'frame-emerald-pulse',
    frameBorderColor: '#10b981',
    frameBorderRadius: '50%',
  },
  {
    type: StoreItemType.AVATAR_FRAME,
    rarity: StoreItemRarity.RARE,
    isActive: true,
    sortOrder: 2,
    coinCost: 250,
    nameEn: 'Neon Cyan Frame',
    nameHe: 'מסגרת ניאון תכלת',
    nameAr: 'إطار نيون سماوي',
    descEn: 'Animated electric cyan glow around your avatar.',
    descHe: 'הילה כחולה זוהרת ואנימטיבית סביב הפרופיל.',
    descAr: 'توهج نيون سماوي متحرك حول صورتك.',
    frameAnimated: true,
    frameCssClass: 'frame-neon-cyan',
    frameBorderColor: '#06b6d4',
    frameBorderRadius: '50%',
  },
  {
    type: StoreItemType.AVATAR_FRAME,
    rarity: StoreItemRarity.LEGENDARY,
    isActive: true,
    sortOrder: 3,
    coinCost: 1200,
    nameEn: 'Golden Champion Frame',
    nameHe: 'מסגרת אלופים מוזהבת',
    nameAr: 'إطار البطل الذهبي',
    descEn: 'Prestigious animated golden aura for top academy learners.',
    descHe: 'הילת זהב יוקרתית לתלמידים מצטיינים.',
    descAr: 'هالة ذهبية فاخرة لمتعلمي الأكاديمية المتميزين.',
    frameAnimated: true,
    frameCssClass: 'frame-gold-glow',
    frameBorderColor: '#f59e0b',
    frameBorderRadius: '50%',
  },
  {
    type: StoreItemType.NICKNAME,
    rarity: StoreItemRarity.COMMON,
    isActive: true,
    sortOrder: 4,
    coinCost: 100,
    nameEn: 'Emerald Bold Nickname',
    nameHe: 'כינוי אמרלד מודגש',
    nameAr: 'لقب الزمرد العريض',
    descEn: 'Stand out on the leaderboard with a bold emerald name style.',
    descHe: 'הבלט את שמך בטבלת המובילים בצבע אמרלד מודגש.',
    descAr: 'تميّز في لوحة المتصدرين باسم زمردي عريض.',
    nicknameColor: '#10b981',
    nicknameGlow: false,
    nicknameFont: 'font-bold',
    nicknameBadgeIcon: '✨',
    nicknameCssClass: 'nickname-emerald-bold',
  },
  {
    type: StoreItemType.NICKNAME,
    rarity: StoreItemRarity.EPIC,
    isActive: true,
    sortOrder: 5,
    coinCost: 600,
    nameEn: 'Royal Purple Glow',
    nameHe: 'כינוי סגול מלכותי',
    nameAr: 'لقب أرجواني متوهج',
    descEn: 'Glowing royal purple typography with a crown badge.',
    descHe: 'טיפוגרפיה סגולה זוהרת עם סמל כתר.',
    descAr: 'خط أرجواني ملكي متوهج مع شارة تاج.',
    nicknameColor: '#a855f7',
    nicknameGlow: true,
    nicknameGlowColor: '#a855f7',
    nicknameFont: 'font-bold',
    nicknameBadgeIcon: '👑',
    nicknameCssClass: 'nickname-purple-glow',
  },
  {
    type: StoreItemType.NICKNAME,
    rarity: StoreItemRarity.LEGENDARY,
    isActive: true,
    sortOrder: 6,
    coinCost: 1500,
    nameEn: 'Legendary Gold Name',
    nameHe: 'כינוי זהב אגדי',
    nameAr: 'الاسم الذهبي الأسطوري',
    descEn: 'Radiant golden nickname with trophy badge for true legends.',
    descHe: 'כינוי זהב קורן עם גביע לאלופים אמיתיים.',
    descAr: 'لقب ذهبي مشرق مع شارة الكأس للأساطير.',
    nicknameColor: '#f59e0b',
    nicknameGlow: true,
    nicknameGlowColor: '#fbbf24',
    nicknameFont: 'font-extrabold',
    nicknameBadgeIcon: '🏆',
    nicknameCssClass: 'nickname-gold-legendary',
  },
];

async function main() {
  console.log('Seeding Gamification Store permissions and starter items...');

  const roles = await prisma.roleDefinition.findMany();
  const roleByName = new Map(roles.map((r) => [r.name, r]));

  for (const perm of STORE_PERMISSIONS) {
    const upsertedPerm = await prisma.permission.upsert({
      where: { code: perm.code },
      update: {
        group: perm.group,
        description: perm.description,
      },
      create: {
        code: perm.code,
        group: perm.group,
        description: perm.description,
      },
    });

    for (const roleName of perm.roles) {
      const role = roleByName.get(roleName);
      if (!role) continue;
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: role.id,
            permissionId: upsertedPerm.id,
          },
        },
        update: { granted: true },
        create: {
          roleId: role.id,
          permissionId: upsertedPerm.id,
          granted: true,
        },
      });
    }
  }

  console.log(`Upserted ${STORE_PERMISSIONS.length} store permissions & role mappings.`);

  const existingItemCount = await prisma.storeItem.count();
  if (existingItemCount === 0) {
    await prisma.storeItem.createMany({
      data: STARTER_STORE_ITEMS,
    });
    console.log(`Seeded ${STARTER_STORE_ITEMS.length} starter StoreItems.`);
  } else {
    console.log(`StoreItems already exist (${existingItemCount}); skipping starter item creation.`);
  }

  console.log('Gamification Store seed complete!');
}

main()
  .catch((e) => {
    console.error('Store seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
