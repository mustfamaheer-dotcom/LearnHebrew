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
  // ── 8 Avatar Frames ────────────────────────────────────────────────────────
  {
    type: StoreItemType.AVATAR_FRAME,
    rarity: StoreItemRarity.COMMON,
    isActive: true,
    sortOrder: 1,
    coinCost: 50,
    nameEn: 'Bronze Classic Frame',
    nameHe: 'מסגרת ברונזה קלאסית',
    nameAr: 'إطار برونزي كلاسيكي',
    descEn: 'A timeless warm bronze ring to kick off your collection.',
    descHe: 'טבעת ברונזה חמה וקלאסית לתחילת האוסף שלך.',
    descAr: 'حلقة برونزية دافئة كلاسيكية لبداية مجموعتك.',
    frameAnimated: false,
    frameCssClass: 'frame-bronze-classic',
    frameBorderColor: '#cd7f32',
    frameBorderRadius: '50%',
  },
  {
    type: StoreItemType.AVATAR_FRAME,
    rarity: StoreItemRarity.COMMON,
    isActive: true,
    sortOrder: 2,
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
    sortOrder: 3,
    coinCost: 180,
    nameEn: 'Silver Frost Frame',
    nameHe: 'מסגרת כסף קפוא',
    nameAr: 'إطار الفضة المتجمدة',
    descEn: 'Cool metallic silver sheen with a frosty shimmer.',
    descHe: 'ברק כסוף מטאלי עם נצנוץ קריר.',
    descAr: 'بريق فضي معدني بارد مع وميض جليدي.',
    frameAnimated: true,
    frameCssClass: 'frame-silver-frost',
    frameBorderColor: '#94a3b8',
    frameBorderRadius: '50%',
  },
  {
    type: StoreItemType.AVATAR_FRAME,
    rarity: StoreItemRarity.RARE,
    isActive: true,
    sortOrder: 4,
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
    rarity: StoreItemRarity.EPIC,
    isActive: true,
    sortOrder: 5,
    coinCost: 450,
    nameEn: 'Royal Purple Frame',
    nameHe: 'מסגרת סגול מלכותי',
    nameAr: 'إطار أرجواني ملكي',
    descEn: 'Majestic violet aura crafted for dedicated learners.',
    descHe: 'הילה סגולה מלכותית ללומדים מסורים.',
    descAr: 'هالة بنفسجية ملكية مصممة للمتعلمين المجتهدين.',
    frameAnimated: true,
    frameCssClass: 'frame-royal-purple',
    frameBorderColor: '#8b5cf6',
    frameBorderRadius: '50%',
  },
  {
    type: StoreItemType.AVATAR_FRAME,
    rarity: StoreItemRarity.EPIC,
    isActive: true,
    sortOrder: 6,
    coinCost: 650,
    nameEn: 'Crimson Flame Frame',
    nameHe: 'מסגרת להבת ארגמן',
    nameAr: 'إطار اللهب القرمزي',
    descEn: 'Blazing crimson energy pulsing around your profile.',
    descHe: 'אנרגיית אש אדומה פועמת סביב הפרופיל שלך.',
    descAr: 'طاقة قرمزية مشتعلة تنبض حول ملفك الشخصي.',
    frameAnimated: true,
    frameCssClass: 'frame-crimson-flame',
    frameBorderColor: '#ef4444',
    frameBorderRadius: '50%',
  },
  {
    type: StoreItemType.AVATAR_FRAME,
    rarity: StoreItemRarity.LEGENDARY,
    isActive: true,
    sortOrder: 7,
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
    type: StoreItemType.AVATAR_FRAME,
    rarity: StoreItemRarity.LEGENDARY,
    isActive: true,
    sortOrder: 8,
    coinCost: 1800,
    nameEn: 'Rainbow Prism Frame',
    nameHe: 'מסגרת פריזמת קשת',
    nameAr: 'إطار قوس قزح الأسطوري',
    descEn: 'Dazzling rotating spectrum border — the ultimate status symbol.',
    descHe: 'מסגרת קשת מסתובבת מרהיבה — סמל הסטטוס האולטימטיבי.',
    descAr: 'إطار طيفي دوّار مذهل — رمز التميز الأعلى.',
    frameAnimated: true,
    frameCssClass: 'frame-rainbow-legendary',
    frameBorderColor: '#ec4899',
    frameBorderRadius: '50%',
  },

  // ── 8 Nicknames ────────────────────────────────────────────────────────────
  {
    type: StoreItemType.NICKNAME,
    rarity: StoreItemRarity.COMMON,
    isActive: true,
    sortOrder: 9,
    coinCost: 75,
    nameEn: 'Sky Scholar Name',
    nameHe: 'כינוי חוקר שמיים',
    nameAr: 'لقب باحث السماء',
    descEn: 'Clean sky-blue display name with a scholar book badge.',
    descHe: 'שם תצוגה כחול-שמיים נקי עם סמל ספר.',
    descAr: 'اسم عرض أزرق سماوي أنيق مع شارة كتاب.',
    nicknameColor: '#0ea5e9',
    nicknameGlow: false,
    nicknameFont: 'font-semibold',
    nicknameBadgeIcon: '📘',
    nicknameCssClass: '',
  },
  {
    type: StoreItemType.NICKNAME,
    rarity: StoreItemRarity.COMMON,
    isActive: true,
    sortOrder: 10,
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
    rarity: StoreItemRarity.RARE,
    isActive: true,
    sortOrder: 11,
    coinCost: 220,
    nameEn: 'Ocean Wave Name',
    nameHe: 'כינוי גל אוקיינוס',
    nameAr: 'لقب موجة المحيط',
    descEn: 'Smooth deep-ocean gradient typography with a wave badge.',
    descHe: 'טיפוגרפיה בגרדיאנט אוקיינוס עמוק עם סמל גל.',
    descAr: 'تدرج لوني عميق بألوان المحيط مع شارة موجة.',
    nicknameColor: '#0284c7',
    nicknameGlow: false,
    nicknameFont: 'font-bold',
    nicknameBadgeIcon: '🌊',
    nicknameCssClass: 'nickname-ocean-gradient',
  },
  {
    type: StoreItemType.NICKNAME,
    rarity: StoreItemRarity.RARE,
    isActive: true,
    sortOrder: 12,
    coinCost: 300,
    nameEn: 'Neon Cyan Spark',
    nameHe: 'כינוי ניצוץ ניאון',
    nameAr: 'لقب شرارة النيون',
    descEn: 'Electrifying cyan glow with a lightning bolt emblem.',
    descHe: 'זוהר תכלת מחשמל עם סמל ברק.',
    descAr: 'توهج سماوي كهربائي مع شارة البرق.',
    nicknameColor: '#06b6d4',
    nicknameGlow: true,
    nicknameGlowColor: '#22d3ee',
    nicknameFont: 'font-bold',
    nicknameBadgeIcon: '⚡',
    nicknameCssClass: 'nickname-neon-cyan',
  },
  {
    type: StoreItemType.NICKNAME,
    rarity: StoreItemRarity.EPIC,
    isActive: true,
    sortOrder: 13,
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
    rarity: StoreItemRarity.EPIC,
    isActive: true,
    sortOrder: 14,
    coinCost: 750,
    nameEn: 'Crimson Fire Name',
    nameHe: 'כינוי אש ארגמן',
    nameAr: 'لقب النار القرمزية',
    descEn: 'Fiery crimson glow with a flame icon for unstoppable streaks.',
    descHe: 'זוהר אדום לוהט עם אייקון להבה לרצפי למידה מרשימים.',
    descAr: 'توهج قرمزي ناري مع رمز الشعلة لأصحاب السلاسل المستمرة.',
    nicknameColor: '#ef4444',
    nicknameGlow: true,
    nicknameGlowColor: '#f87171',
    nicknameFont: 'font-extrabold',
    nicknameBadgeIcon: '🔥',
    nicknameCssClass: 'nickname-crimson-fire',
  },
  {
    type: StoreItemType.NICKNAME,
    rarity: StoreItemRarity.LEGENDARY,
    isActive: true,
    sortOrder: 15,
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
  {
    type: StoreItemType.NICKNAME,
    rarity: StoreItemRarity.LEGENDARY,
    isActive: true,
    sortOrder: 16,
    coinCost: 2000,
    nameEn: 'Rainbow Mythic Name',
    nameHe: 'כינוי קשת מיתי',
    nameAr: 'الاسم الطيفي الأسطوري',
    descEn: 'Animated rainbow gradient name with a radiant star badge.',
    descHe: 'שם בגרדיאנט קשת אנימטיבי עם כוכב זוהר.',
    descAr: 'اسم بتدرج ألوان قوس قزح متحرك مع شارة نجمة مشرقة.',
    nicknameColor: '#ec4899',
    nicknameGlow: true,
    nicknameGlowColor: '#f472b6',
    nicknameFont: 'font-extrabold',
    nicknameBadgeIcon: '🌟',
    nicknameCssClass: 'nickname-rainbow-legendary',
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

  let createdCount = 0;
  let updatedCount = 0;

  for (const item of STARTER_STORE_ITEMS) {
    const existing = await prisma.storeItem.findFirst({
      where: { nameEn: item.nameEn },
      select: { id: true },
    });

    if (existing) {
      await prisma.storeItem.update({
        where: { id: existing.id },
        data: item,
      });
      updatedCount++;
    } else {
      await prisma.storeItem.create({
        data: item,
      });
      createdCount++;
    }
  }

  const totalItems = await prisma.storeItem.count();
  console.log(`StoreItems synced: ${createdCount} created, ${updatedCount} updated. Total in DB: ${totalItems}.`);
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
