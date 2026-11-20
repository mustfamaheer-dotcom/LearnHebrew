import { PrismaClient, HebrewLevel, GameType } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedCefrAndGames() {
  console.log('--- SEEDING CEFR LEVELS (A1 - C2 + NATIVE) ---');

  // 1. Define CEFR Levels
  const cefrLevelsData = [
    {
      code: 'A1',
      labelEn: 'A1 — Beginner',
      labelHe: 'רמה A1 — מתחילים (אלף)',
      sortOrder: 1,
      color: '#0D9488',
      description: 'Foundations of reading Hebrew alphabet (Alef-Bet), vowels (Nikkud), fundamental greetings, introducing yourself, basic numbers.',
    },
    {
      code: 'A2',
      labelEn: 'A2 — Elementary',
      labelHe: 'רמה A2 — יסודי (בית)',
      sortOrder: 2,
      color: '#10B981',
      description: 'Present tense Pa\'al verbs, daily conversations, ordering food and coffee, shopping, asking directions, family and home vocabulary.',
    },
    {
      code: 'B1',
      labelEn: 'B1 — Intermediate',
      labelHe: 'רמה B1 — בינוני (גימל)',
      sortOrder: 3,
      color: '#F59E0B',
      description: 'Past and future verb tenses (Pa\'al, Pi\'el), prepositions with pronominal suffixes, connecting words, reading simplified Israeli news.',
    },
    {
      code: 'B2',
      labelEn: 'B2 — Upper Intermediate',
      labelHe: 'רמה B2 — מתקדם קל (דלת)',
      sortOrder: 4,
      color: '#6366F1',
      description: 'All 7 verb binyanim (Hif\'il, Hitpa\'el, Nif\'al), contemporary Israeli slang, idioms, expressing nuanced opinions, debating, workplace culture.',
    },
    {
      code: 'C1',
      labelEn: 'C1 — Advanced',
      labelHe: 'רמה C1 — מתקדם גבוה (הא)',
      sortOrder: 5,
      color: '#8B5CF6',
      description: 'Advanced syntax, formal and academic Hebrew, journalistic analysis, professional negotiation, literary expressions, subtle cultural subtext.',
    },
    {
      code: 'C2',
      labelEn: 'C2 — Mastery',
      labelHe: 'רמה C2 — שליטה מלאה (וו)',
      sortOrder: 6,
      color: '#EC4899',
      description: 'Exemption level (Ptor), native-level fluency, Israeli humor, irony, complex legal, medical and scientific registers, effortless spontaneous speech.',
    },
    {
      code: 'NATIVE',
      labelEn: 'Native — Bilingual',
      labelHe: 'שפת אם — דו-לשוני',
      sortOrder: 7,
      color: '#0EA5E9',
      description: 'Full bilingual modern Hebrew and English fluency, colloquial phrasing, cultural nuance, and effortless bilingual code-switching.',
    },
  ];

  // Map legacy levels to new CEFR codes
  const legacyToCefrMap: Record<string, string> = {
    BEGINNER: 'A1',
    ELEMENTARY: 'A2',
    INTERMEDIATE: 'B1',
    UPPER_INTERMEDIATE: 'B2',
    ADVANCED: 'C1',
    FLUENT: 'C2',
  };

  // Upsert all CEFR levels
  const createdLevels: Record<string, any> = {};
  for (const lvl of cefrLevelsData) {
    // Check if level with this code or sortOrder already exists
    const existing = await prisma.level.findFirst({
      where: {
        OR: [{ code: lvl.code }, { sortOrder: lvl.sortOrder }],
      },
    });

    if (existing) {
      const updated = await prisma.level.update({
        where: { id: existing.id },
        data: {
          code: lvl.code,
          labelEn: lvl.labelEn,
          labelHe: lvl.labelHe,
          sortOrder: lvl.sortOrder,
          color: lvl.color,
          description: lvl.description,
          isActive: true,
        },
      });
      createdLevels[lvl.code] = updated;
    } else {
      const created = await prisma.level.create({
        data: lvl,
      });
      createdLevels[lvl.code] = created;
    }
  }

  console.log('Levels configured successfully:', Object.keys(createdLevels));

  // Migrate existing students levelId to A1/A2/etc.
  const students = await prisma.student.findMany({ select: { id: true, level: true, levelId: true } });
  for (const s of students) {
    const targetCode = legacyToCefrMap[s.level] || 'A1';
    const targetLevel = createdLevels[targetCode];
    if (targetLevel && s.levelId !== targetLevel.id) {
      await prisma.student.update({
        where: { id: s.id },
        data: { levelId: targetLevel.id },
      });
    }
  }

  console.log(`Updated ${students.length} students to CEFR level associations.`);

  // Clear existing games to replace with clean, comprehensive real-content game database
  await prisma.studentGameSession.deleteMany({});
  await prisma.studentGameUnlock.deleteMany({});
  await prisma.game.deleteMany({});
  console.log('Cleaned old game instances for real authentic content refresh.');

  // 2. Define Real Games across all CEFR Levels
  const realGames = [
    // ==========================================
    // LEVEL A1 — BEGINNER (Alef)
    // ==========================================
    {
      title: 'Alef-Bet & Essential Greetings',
      titleHe: 'שליטה באלפבית וברכות יסוד',
      description: 'Master the fundamental modern Hebrew alphabet, vowels (nikkud), phonetic pronunciation, and everyday introductory phrases.',
      gameType: GameType.FLASHCARD,
      levelCode: 'A1',
      legacyLevel: HebrewLevel.BEGINNER,
      difficulty: 'EASY',
      estimatedMins: 4,
      tags: ['Alphabet', 'Nikkud', 'Greetings', 'Phonics', 'Level A1'],
      pointsReward: 20,
      configJson: {
        cards: [
          {
            front: 'שָׁלוֹם',
            back: 'Hello / Peace / Goodbye',
            phonetic: 'Sha-lom',
            example: 'שָׁלוֹם, נָעִים לְהַכִּיר! (Hello, nice to meet you!)',
          },
          {
            front: 'תּוֹדָה רַבָּה',
            back: 'Thank you very much',
            phonetic: 'To-da Ra-ba',
            example: 'תּוֹדָה רַבָּה עַל הָעֶזְרָה. (Thank you very much for the help.)',
          },
          {
            front: 'בְּבַקָּשָׁה',
            back: 'Please / You are welcome',
            phonetic: 'Be-va-ka-sha',
            example: 'סְלִיחָה, מַיִם בְּבַקָּשָׁה. (Excuse me, water please.)',
          },
          {
            front: 'בֹּקֶר טוֹב',
            back: 'Good morning',
            phonetic: 'Bo-ker Tov',
            example: 'בֹּקֶר טוֹב, יוֹם מְצוּיָן! (Good morning, have a great day!)',
          },
          {
            front: 'עֶרֶב טוֹב',
            back: 'Good evening',
            phonetic: 'E-rev Tov',
            example: 'עֶרֶב טוֹב לְכֻלָּם. (Good evening to everyone.)',
          },
          {
            front: 'מַה נִּשְׁמַע?',
            back: 'How are you? / What\'s up?',
            phonetic: 'Ma Nish-ma?',
            example: 'הַכֹּל טוֹב, תּוֹדָה! (Everything is good, thanks!)',
          },
          {
            front: 'סַבָּבָה',
            back: 'Awesome / Great / Cool',
            phonetic: 'Sa-ba-ba',
            example: 'הַכֹּל סַבָּבָה! (Everything is great!)',
          },
        ],
      },
    },
    {
      title: 'First Words & Greetings Match',
      titleHe: 'התאמת מילים וברכות ראשונות',
      description: 'Fast-paced word pairing connecting basic Hebrew greetings and survival phrases with accurate English translations.',
      gameType: GameType.MATCHING,
      levelCode: 'A1',
      legacyLevel: HebrewLevel.BEGINNER,
      difficulty: 'EASY',
      estimatedMins: 3,
      tags: ['Matching', 'Basics', 'Daily Life', 'Level A1'],
      pointsReward: 25,
      configJson: {
        pairs: [
          { left: 'שָׁלוֹם', right: 'Hello / Peace' },
          { left: 'תּוֹדָה', right: 'Thank you' },
          { left: 'כֵּן', right: 'Yes' },
          { left: 'לֹא', right: 'No' },
          { left: 'בְּבַקָּשָׁה', right: 'Please / Welcome' },
          { left: 'לְהִתְרָאוֹת', right: 'See you later / Goodbye' },
        ],
      },
    },
    {
      title: 'Hebrew Letters Unscramble',
      titleHe: 'אתגר סידור אותיות א-ב',
      description: 'Reassemble scrambled Hebrew letters into essential foundational vocabulary words.',
      gameType: GameType.WORD_SCRAMBLE,
      levelCode: 'A1',
      legacyLevel: HebrewLevel.BEGINNER,
      difficulty: 'EASY',
      estimatedMins: 4,
      tags: ['Spelling', 'Letters', 'Roots', 'Level A1'],
      pointsReward: 25,
      configJson: {
        words: [
          { word: 'שלום', scrambled: 'םולש', clue: 'Greeting: Hello / Peace', phonetic: 'Shalom' },
          { word: 'תודה', scrambled: 'הדות', clue: 'Gratitude: Thank you', phonetic: 'Toda' },
          { word: 'בוקר', scrambled: 'רקוב', clue: 'Time of day: Morning', phonetic: 'Boker' },
          { word: 'חבר', scrambled: 'רבח', clue: 'Person: Friend', phonetic: 'Chaver' },
          { word: 'ספר', scrambled: 'רפס', clue: 'Object: Book', phonetic: 'Sefer' },
        ],
      },
    },
    {
      title: 'A1 Hebrew Essentials Quiz',
      titleHe: 'חידון מושגי יסוד ברמה א׳',
      description: 'Test your understanding of basic Hebrew numbers, personal pronouns, and everyday courtesies.',
      gameType: GameType.QUIZ,
      levelCode: 'A1',
      legacyLevel: HebrewLevel.BEGINNER,
      difficulty: 'EASY',
      estimatedMins: 5,
      tags: ['Quiz', 'Grammar', 'Basics', 'Level A1'],
      pointsReward: 30,
      configJson: {
        questions: [
          {
            question: 'How do you say "Thank you very much" in Modern Hebrew?',
            questionHe: 'איך אומרים "תודה רבה" בעברית?',
            options: ['סליחה רבה', 'תודה רבה', 'בבקשה רבה', 'שלום רב'],
            correctIndex: 1,
            explanation: '"תודה רבה" (Toda Raba) means "Thank you very much".',
          },
          {
            question: 'What is the Hebrew pronoun for "I" (both masculine and feminine)?',
            questionHe: 'מהו כינוי הגוף ל"אני"?',
            options: ['הוא', 'אתה', 'אני', 'אנחנו'],
            correctIndex: 2,
            explanation: '"אני" (Ani) means "I" in Hebrew and is used by both men and women.',
          },
          {
            question: 'What is the correct greeting for "Good Morning"?',
            questionHe: 'מהי הברכה הנכונה לבוקר?',
            options: ['לילה טוב', 'בוקר טוב', 'ערב טוב', 'צהריים טובים'],
            correctIndex: 1,
            explanation: '"בוקר טוב" (Boker Tov) means "Good morning".',
          },
          {
            question: 'How do you ask "Where is the bathroom?" politely?',
            questionHe: 'איך שואלים בנימוס איפה השירותים?',
            options: ['איפה השירותים?', 'מה זה שירותים?', 'מתי יש שירותים?', 'כמה שירותים?'],
            correctIndex: 0,
            explanation: '"איפה השירותים?" (Eifo ha-sherutim?) means "Where is the bathroom?".',
          },
        ],
      },
    },

    // ==========================================
    // LEVEL A2 — ELEMENTARY (Bet)
    // ==========================================
    {
      title: 'Cafe & Restaurant Ordering Match',
      titleHe: 'הזמנה בבית קפה ומסעדה',
      description: 'Order with confidence: match Israeli coffee terminology, food orders, and bill requests.',
      gameType: GameType.MATCHING,
      levelCode: 'A2',
      legacyLevel: HebrewLevel.ELEMENTARY,
      difficulty: 'EASY',
      estimatedMins: 4,
      tags: ['Food', 'Ordering', 'Daily Life', 'Level A2'],
      pointsReward: 30,
      configJson: {
        pairs: [
          { left: 'קפה הפוך חזק', right: 'Strong cappuccino / latte' },
          { left: 'חשבון בבקשה', right: 'The check please' },
          { left: 'מים קרים עם לימון', right: 'Cold water with lemon' },
          { left: 'שקשוקה חריפה', right: 'Spicy shakshuka' },
          { left: 'לשבת או לקחת?', right: 'For here or to-go?' },
          { left: 'אפשר לקבל תפריט?', right: 'Can I get a menu?' },
        ],
      },
    },
    {
      title: 'Present Tense Pa\'al Verbs',
      titleHe: 'פעלים בזמן הווה — בניין פעל',
      description: 'Essential verb cards covering common daily actions in masculine, feminine, singular, and plural.',
      gameType: GameType.FLASHCARD,
      levelCode: 'A2',
      legacyLevel: HebrewLevel.ELEMENTARY,
      difficulty: 'MEDIUM',
      estimatedMins: 5,
      tags: ['Verbs', 'Paal', 'Present Tense', 'Level A2'],
      pointsReward: 30,
      configJson: {
        cards: [
          {
            front: 'לִכְתֹּב — כּוֹתֵב / כּוֹתֶבֶת',
            back: 'To write — writes (m/f)',
            phonetic: 'Lichtov — Kotev / Kotevet',
            example: 'אֲנִי כּוֹתֵב מִכְתָּב בְּעִבְרִית. (I am writing a letter in Hebrew.)',
          },
          {
            front: 'לִשְׁתּוֹת — שׁוֹתֶה / שׁוֹתָה',
            back: 'To drink — drinks (m/f)',
            phonetic: 'Lishtot — Shote / Shota',
            example: 'הִיא שׁוֹתָה קָפֶה בַּבֹּקֶר. (She drinks coffee in the morning.)',
          },
          {
            front: 'לֶאֱכֹל — אוֹכֵל / אוֹכֶלֶת',
            back: 'To eat — eats (m/f)',
            phonetic: 'Leechol — Ochel / Ochelet',
            example: 'אֲנַחְנוּ אוֹכְלִים צָהֳרַיִם יַחַד. (We eat lunch together.)',
          },
          {
            front: 'לָלֶכֶת — הוֹלֵךְ / הוֹלֶכֶת',
            back: 'To walk / go — goes (m/f)',
            phonetic: 'Lalechet — Holech / Holechet',
            example: 'הוּא הוֹלֵךְ לַעֲבוֹדָה בָּרֶגֶל. (He walks to work on foot.)',
          },
          {
            front: 'לִקְנוֹת — קוֹנֶה / קוֹנָה',
            back: 'To buy — buys (m/f)',
            phonetic: 'Liknot — Kone / Kona',
            example: 'אֲנִי קוֹנֶה יְרָקוֹת בַּשּׁוּק. (I buy vegetables at the market.)',
          },
        ],
      },
    },
    {
      title: 'Daily Routine Sentence Builder',
      titleHe: 'בניית משפטים: שגרת יום',
      description: 'Arrange words in correct grammatical word order to describe everyday Israeli routines and activities.',
      gameType: GameType.SENTENCE_BUILDER,
      levelCode: 'A2',
      legacyLevel: HebrewLevel.ELEMENTARY,
      difficulty: 'MEDIUM',
      estimatedMins: 5,
      tags: ['Sentences', 'Grammar', 'Routines', 'Level A2'],
      pointsReward: 35,
      configJson: {
        sentences: [
          {
            words: ['אני', 'שותה', 'קפה', 'כל', 'בוקר'],
            correct: 'אני שותה קפה כל בוקר',
            translation: 'I drink coffee every morning.',
          },
          {
            words: ['אנחנו', 'לומדים', 'עברית', 'באקדמיה', 'היום'],
            correct: 'אנחנו לומדים עברית באקדמיה היום',
            translation: 'We are learning Hebrew at the academy today.',
          },
          {
            words: ['איפה', 'נמצאת', 'תחנת', 'הרכבת', 'הקרובה?'],
            correct: 'איפה נמצאת תחנת הרכבת הקרובה?',
            translation: 'Where is the nearest train station?',
          },
          {
            words: ['דני', 'רוצה', 'להזמין', 'שולחן', 'במסעדה'],
            correct: 'דני רוצה להזמין שולחן במסעדה',
            translation: 'Danny wants to reserve a table at the restaurant.',
          },
        ],
      },
    },
    {
      title: 'Rapid Present Tense Conjugator',
      titleHe: 'ספרינט הטיית פעלים בהווה',
      description: 'Fast-paced verb sprint: select the correct pronoun and verb conjugation before the clock expires!',
      gameType: GameType.SPEED_ROUND,
      levelCode: 'A2',
      legacyLevel: HebrewLevel.ELEMENTARY,
      difficulty: 'MEDIUM',
      estimatedMins: 4,
      tags: ['Speed', 'Verbs', 'Drill', 'Level A2'],
      pointsReward: 35,
      configJson: {
        rounds: [
          {
            prompt: 'היא (ללמוד) עברית בירושלים',
            verb: 'ללמוד',
            pronoun: 'היא',
            options: ['לומד', 'לומדת', 'לומדים', 'לומדות'],
            answer: 'לומדת',
          },
          {
            prompt: 'אנחנו (לגור) בתל אביב',
            verb: 'לגור',
            pronoun: 'אנחנו',
            options: ['גר', 'גרה', 'גרים', 'גרות'],
            answer: 'גרים',
          },
          {
            prompt: 'אתה (לדבר) אנגלית מצוין',
            verb: 'לדבר',
            pronoun: 'אתה',
            options: ['מדבר', 'מדברת', 'מדברים', 'מדברות'],
            answer: 'מדבר',
          },
          {
            prompt: 'הם (לעבוד) בחברת הייטק',
            verb: 'לעבוד',
            pronoun: 'הם',
            options: ['עובד', 'עובדת', 'עובדים', 'עובדות'],
            answer: 'עובדים',
          },
        ],
      },
    },

    // ==========================================
    // LEVEL B1 — INTERMEDIATE (Gimel)
    // ==========================================
    {
      title: 'Past Tense Mastery & Timeline',
      titleHe: 'שליטה בזמן עבר וציר הזמן',
      description: 'Strengthen past tense verbal roots across Pa\'al and Pi\'el verb groups with authentic Israeli context.',
      gameType: GameType.FLASHCARD,
      levelCode: 'B1',
      legacyLevel: HebrewLevel.INTERMEDIATE,
      difficulty: 'MEDIUM',
      estimatedMins: 5,
      tags: ['Past Tense', 'Binyanim', 'Grammar', 'Level B1'],
      pointsReward: 35,
      configJson: {
        cards: [
          {
            front: 'דִּבַּרְתִּי — לְדַבֵּר',
            back: 'I spoke — To speak (Pi\'el)',
            phonetic: 'Dibarti — Ledaber',
            example: 'דִּבַּרְתִּי עִם הַמּוֹרֶה אֶתְמוֹל בָּעֶרֶב. (I spoke with the teacher yesterday evening.)',
          },
          {
            front: 'רָאִינוּ — לִרְאוֹת',
            back: 'We saw — To see (Pa\'al lamed-hei)',
            phonetic: 'Rainu — Lir\'ot',
            example: 'רָאִינוּ סֶרֶט יִשְׂרְאֵלִי מְרַתֵּק בַּקּוֹלְנוֹעַ. (We saw a fascinating Israeli movie at the cinema.)',
          },
          {
            front: 'הִגַּעְתֶּם — לְהַגִּיעַ',
            back: 'You (pl.) arrived — To arrive (Hif\'il)',
            phonetic: 'Higatem — Lehagi\'a',
            example: 'בְּאֵיזוֹ שָׁעָה הִגַּעְתֶּם לַמָּלוֹן? (What time did you arrive at the hotel?)',
          },
          {
            front: 'קָנִיתִי — לִקְנוֹת',
            back: 'I bought — To buy',
            phonetic: 'Kaniti — Liknot',
            example: 'קָנִיתִי כַּרְטִיסֵי טִיסָה לְאִילַת. (I bought flight tickets to Eilat.)',
          },
          {
            front: 'הֵבַנְתִּי — לְהָבִין',
            back: 'I understood — To understand',
            phonetic: 'Hevanti — Lehavin',
            example: 'הֵבַנְתִּי אֶת כָּל הַהֶסְבֵּר בְּקַלּוּת. (I understood the entire explanation easily.)',
          },
        ],
      },
    },
    {
      title: 'Prepositions with Suffixes Match',
      titleHe: 'התאמת מילות יחס עם כינויים',
      description: 'Connect essential Hebrew prepositions with their attached personal pronominal suffixes.',
      gameType: GameType.MATCHING,
      levelCode: 'B1',
      legacyLevel: HebrewLevel.INTERMEDIATE,
      difficulty: 'MEDIUM',
      estimatedMins: 4,
      tags: ['Prepositions', 'Grammar', 'Level B1'],
      pointsReward: 35,
      configJson: {
        pairs: [
          { left: 'אִתִּי', right: 'With me (Iti)' },
          { left: 'עָלֶיךָ', right: 'On you / About you (m)' },
          { left: 'אֶצְלָהּ', right: 'At her place (Etzlah)' },
          { left: 'בִּשְׁבִילֵנוּ', right: 'For us (Bishvilenu)' },
          { left: 'אֲלֵיהֶם', right: 'To them (Aleyhem)' },
          { left: 'מִמֶּנִּי', right: 'From me (Mimeni)' },
        ],
      },
    },
    {
      title: 'Past & Future Complex Sentences',
      titleHe: 'משפטי חיבור ותנאי בזמן עבר ועתיד',
      description: 'Build connected Hebrew sentences using conjunctions: כי, בגלל ש, כאשר, למרות ש.',
      gameType: GameType.SENTENCE_BUILDER,
      levelCode: 'B1',
      legacyLevel: HebrewLevel.INTERMEDIATE,
      difficulty: 'HARD',
      estimatedMins: 6,
      tags: ['Syntax', 'Complex Sentences', 'Level B1'],
      pointsReward: 40,
      configJson: {
        sentences: [
          {
            words: ['אתמול', 'הלכתי', 'לשוק', 'כי', 'הייתי', 'צריך', 'אוכל'],
            correct: 'אתמול הלכתי לשוק כי הייתי צריך אוכל',
            translation: 'Yesterday I went to the market because I needed food.',
          },
          {
            words: ['למרות', 'שהיה', 'גשם', 'יצאנו', 'לטייל', 'בפארק'],
            correct: 'למרות שהיה גשם יצאנו לטייל בפארק',
            translation: 'Even though it was raining, we went for a walk in the park.',
          },
          {
            words: ['כאשר', 'נגיע', 'לישראל', 'נבקר', 'בירושלים', 'העתיקה'],
            correct: 'כאשר נגיע לישראל נבקר בירושלים העתיקה',
            translation: 'When we arrive in Israel, we will visit ancient Jerusalem.',
          },
        ],
      },
    },

    // ==========================================
    // LEVEL B2 — UPPER INTERMEDIATE (Dalet)
    // ==========================================
    {
      title: 'Tel Aviv Slang & Israeli Idioms',
      titleHe: 'סלנג תל אביבי וביטויים מדוברים',
      description: 'Master the colorful idioms, conversational expressions, and authentic modern slang used on Israeli streets.',
      gameType: GameType.FLASHCARD,
      levelCode: 'B2',
      legacyLevel: HebrewLevel.UPPER_INTERMEDIATE,
      difficulty: 'MEDIUM',
      estimatedMins: 5,
      tags: ['Slang', 'Idioms', 'Culture', 'Level B2'],
      pointsReward: 40,
      configJson: {
        cards: [
          {
            front: 'תַּכְלֶ\'ס',
            back: 'Bottom line / To be frank / Actually',
            phonetic: 'Tachles',
            example: 'תַּכְלֶ\'ס, זֶה הָרַעְיוֹן הֲכִי טוֹב שֶׁשָּׁמַעְתִּי. (Bottom line, that\'s the best idea I\'ve heard.)',
          },
          {
            front: 'חֲבָל עַל הַזְּמַן (חבלז)',
            back: 'Unbelievably good / Out of this world',
            phonetic: 'Chaval al ha-zman',
            example: 'הָאֹכֶל בַּמִּסְעָדָה הַזֹּאת חֲבָל עַל הַזְּמַן! (The food at this restaurant is out of this world!)',
          },
          {
            front: 'סְמוֹךְ עָלַי',
            back: 'Trust me / Rely on me',
            phonetic: 'Smoch alay',
            example: 'אַל תִּדְאַג, סְמוֹךְ עָלַי, הַכֹּל יִהְיֶה בְּסֵדֶר. (Don\'t worry, trust me, all will be fine.)',
          },
          {
            front: 'לָרֶדֶת לַשֹּׁרֶשׁ שֶׁל הָעִנְיָן',
            back: 'To get to the root of the matter',
            phonetic: 'Laredet la-shoresh shel ha-inyan',
            example: 'חַיָּבִים לָרֶדֶת לַשֹּׁרֶשׁ שֶׁל הַבְּעָיָה הַזֹּאת. (We must get to the bottom of this problem.)',
          },
          {
            front: 'לִסְגֹּר פִּנָּה',
            back: 'To wrap something up / Take care of a loose end',
            phonetic: 'Lisgor pina',
            example: 'בּוֹא נִסְגֹּר אֶת הַפִּנָּה הַזֹּאת לִפְנֵי שֶׁנֵּצֵא. (Let\'s wrap this up before we head out.)',
          },
        ],
      },
    },
    {
      title: 'Hi-Tech & Professional Business Match',
      titleHe: 'מושגי הייטק ועולם העבודה',
      description: 'Match contemporary Israeli startup, VC funding, and workplace communication terminology.',
      gameType: GameType.MATCHING,
      levelCode: 'B2',
      legacyLevel: HebrewLevel.UPPER_INTERMEDIATE,
      difficulty: 'MEDIUM',
      estimatedMins: 4,
      tags: ['Hi-Tech', 'Business', 'Workplace', 'Level B2'],
      pointsReward: 40,
      configJson: {
        pairs: [
          { left: 'גִּיּוּס הוֹן', right: 'Capital raise / Funding' },
          { left: 'הַשָּׁקַת מוּצָר', right: 'Product launch' },
          { left: 'קִנְיָן רוּחָנִי', right: 'Intellectual property (IP)' },
          { left: 'מַשָּׂא וּמַתָּן', right: 'Negotiations' },
          { left: 'לוּחַ זְמַנִּים צָפוּף', right: 'Tight schedule / Deadline' },
          { left: 'יִתְרוֹן תַּחֲרוּתִי', right: 'Competitive advantage' },
        ],
      },
    },
    {
      title: 'B2 Idioms & Context Quiz',
      titleHe: 'חידון סלנג, ביטויים ותקשורת עסקית',
      description: 'Challenge your command of Israeli nuance, binyan identification, and idiomatic speech.',
      gameType: GameType.QUIZ,
      levelCode: 'B2',
      legacyLevel: HebrewLevel.UPPER_INTERMEDIATE,
      difficulty: 'MEDIUM',
      estimatedMins: 5,
      tags: ['Quiz', 'Slang', 'Binyanim', 'Level B2'],
      pointsReward: 45,
      configJson: {
        questions: [
          {
            question: 'What does the Israeli expression "לסגור פינה" (Lisgor pina) mean in professional context?',
            questionHe: 'מה המשמעות של הביטוי "לסגור פינה"?',
            options: [
              'To build a corner wall',
              'To take care of a small pending task / loose end',
              'To cancel a contract',
              'To resign from a job',
            ],
            correctIndex: 1,
            explanation: '"לסגור פינה" means to quickly finalize or tie up a loose task.',
          },
          {
            question: 'Which binyan does the verb "להתכתב" (Lehitkatev - to correspond) belong to?',
            questionHe: 'לאיזה בניין שייך הפועל "להתכתב"?',
            options: ['פעל', 'פיעל', 'התפעל', 'הפעיל'],
            correctIndex: 2,
            explanation: 'The prefix "הת" indicates Binyan Hitpa\'el (התפעל), expressing reciprocal action.',
          },
          {
            question: 'When someone says in Hebrew "על הפנים" (Al ha-panim), what do they mean?',
            questionHe: 'כשמישהו אומר שהמצב "על הפנים", למה הוא מתכוון?',
            options: ['It is terrible / awful', 'It is wonderful', 'Look closely at my face', 'Everything is on schedule'],
            correctIndex: 0,
            explanation: '"על הפנים" is slang for something very bad or disappointing.',
          },
          {
            question: 'What is the modern Hebrew term for a startup company?',
            questionHe: 'מה המונח המודרני בעברית לחברת הזנק (סטארט-אפ)?',
            options: ['חברת עבר', 'חברת הזנק', 'מפעל ישן', 'מוסד ציבורי'],
            correctIndex: 1,
            explanation: '"חברת הזנק" is the official Hebrew Academy term for a startup company.',
          },
        ],
      },
    },

    // ==========================================
    // LEVEL C1 — ADVANCED (Hei)
    // ==========================================
    {
      title: 'Formal Rhetoric & Connectors',
      titleHe: 'מילות קישור ורטוריקה רשמית',
      description: 'Elevate your register: master academic connectors, formal transition words, and persuasive rhetoric.',
      gameType: GameType.FLASHCARD,
      levelCode: 'C1',
      legacyLevel: HebrewLevel.ADVANCED,
      difficulty: 'HARD',
      estimatedMins: 6,
      tags: ['Formal', 'Academic', 'Rhetoric', 'Level C1'],
      pointsReward: 45,
      configJson: {
        cards: [
          {
            front: 'בָּרַם',
            back: 'However / Nonetheless / But (High formal register)',
            phonetic: 'Baram',
            example: 'הַנְּתוּנִים נִרְאִים מַבְטִיחִים, בָּרַם יֵשׁ לִנְהֹג בִּזְהִירוּת. (The figures look promising, however caution is warranted.)',
          },
          {
            front: 'יְתֵרָה מִזֹּאת',
            back: 'Furthermore / Moreover',
            phonetic: 'Yetera mi-zot',
            example: 'יְתֵרָה מִזֹּאת, הַמַּחְקָר מַצְבִּיעַ עַל תּוֹצָאוֹת חִיּוּבִיּוֹת. (Furthermore, the study indicates positive outcomes.)',
          },
          {
            front: 'בַּד בְּבַד',
            back: 'Simultaneously / Hand in hand',
            phonetic: 'Bad be-vad',
            example: 'יֵשׁ לְפַתֵּחַ אֶת הַכַּלְכָּלָה בַּד בְּבַד עִם שְׁמִירָה עַל הַסְּבִיבָה. (We must develop the economy simultaneously with environmental conservation.)',
          },
          {
            front: 'לְמַפְרֵעַ',
            back: 'Retroactively / In retrospect',
            phonetic: 'Le-mafre\'a',
            example: 'הַהַחְלָטָה תָּקְפָהּ גַּם לְמַפְרֵעַ. (The decision is valid retroactively as well.)',
          },
          {
            front: 'אִיפְּכָא מִסְתַּבְּרָא',
            back: 'The opposite is true / On the contrary (Aramaic loan in Hebrew)',
            phonetic: 'Ipcha mistabra',
            example: 'הַטְּעָנָה שֶׁהֻצְּגָה מוּטְעֵית; אִיפְּכָא מִסְתַּבְּרָא. (The presented claim is mistaken; on the contrary.)',
          },
        ],
      },
    },
    {
      title: 'Academic & Journalistic Analysis Match',
      titleHe: 'אוצר מילים אקדמי ותקשורתי',
      description: 'Match sophisticated literary and journalistic terms from op-eds, legal debates, and literary works.',
      gameType: GameType.MATCHING,
      levelCode: 'C1',
      legacyLevel: HebrewLevel.ADVANCED,
      difficulty: 'HARD',
      estimatedMins: 5,
      tags: ['Academic', 'Media', 'Journalism', 'Level C1'],
      pointsReward: 45,
      configJson: {
        pairs: [
          { left: 'תַּקְדִּים מִשְׁפָּטִי', right: 'Legal precedent' },
          { left: 'סוּגְיָה עֶקְרוֹנִית', right: 'Fundamental issue / dilemma' },
          { left: 'פְּשָׁרָה הִיסְטוֹרִית', right: 'Historic compromise' },
          { left: 'נִתּוּחַ מַעֲמִיק', right: 'In-depth analysis' },
          { left: 'קֻנְצֶנְזוּס רָחָב', right: 'Broad consensus' },
          { left: 'נְקֻדַּת מִפְנֶה', right: 'Turning point / Watershed' },
        ],
      },
    },
    {
      title: 'C1 Editorial Discourse Builder',
      titleHe: 'הרכבת טיעונים ועמדות ברמה מתקדמת',
      description: 'Arrange complex analytical clauses into authoritative argumentative editorial Hebrew.',
      gameType: GameType.SENTENCE_BUILDER,
      levelCode: 'C1',
      legacyLevel: HebrewLevel.ADVANCED,
      difficulty: 'HARD',
      estimatedMins: 6,
      tags: ['Debate', 'Editorial', 'Advanced Syntax', 'Level C1'],
      pointsReward: 50,
      configJson: {
        sentences: [
          {
            words: ['על', 'אף', 'האתגרים', 'הרבים,', 'הושגו', 'הישגים', 'מרשימים', 'בתחום', 'המחקר'],
            correct: 'על אף האתגרים הרבים, הושגו הישגים מרשימים בתחום המחקר',
            translation: 'Despite the numerous challenges, impressive achievements were attained in research.',
          },
          {
            words: ['מן', 'הראוי', 'להדגיש', 'כי', 'ההחלטה', 'התקבלה', 'לאחר', 'שיקול', 'דעת'],
            correct: 'מן הראוי להדגיש כי ההחלטה התקבלה לאחר שיקול דעת',
            translation: 'It is appropriate to emphasize that the decision was reached after careful deliberation.',
          },
        ],
      },
    },

    // ==========================================
    // LEVEL C2 — MASTERY (Vav / Ptor)
    // ==========================================
    {
      title: 'Biblical & Talmudic Idioms in Modern Hebrew',
      titleHe: 'ניבים מקראיים ותלמודיים בעברית המודרנית',
      description: 'Exemption-level mastery: explore timeless classical idioms and metaphors woven into contemporary discourse.',
      gameType: GameType.FLASHCARD,
      levelCode: 'C2',
      legacyLevel: HebrewLevel.FLUENT,
      difficulty: 'HARD',
      estimatedMins: 6,
      tags: ['Classics', 'Metaphors', 'Mastery', 'Level C2'],
      pointsReward: 50,
      configJson: {
        cards: [
          {
            front: 'אוֹתִיּוֹת קִדּוּשׁ לְבָנָה',
            back: 'Giant prominent headlines / Bold capital letters',
            phonetic: 'Otiyot kidush levana',
            example: 'הַיְּדִיעָה פֻּרְסְמָה בְּאוֹתִיּוֹת קִדּוּשׁ לְבָנָה בְּרֹאשׁ הָעִתּוֹן. (The news was published in giant letters atop the newspaper.)',
          },
          {
            front: 'נִכְסֵי צֹאן בַּרְזֶל',
            back: 'Cultural cornerstones / Enduring classics',
            phonetic: 'Nichsey tzon barzel',
            example: 'שִׁירָיו שֶׁל בְּיָאלִיק הֵם נִכְסֵי צֹאן בַּרְזֶל שֶׁל הַתַּרְבּוּת הָעִבְרִית. (Bialik\'s poems are cultural cornerstones of Hebrew culture.)',
          },
          {
            front: 'שָׂעִיר לַעֲזָאזֵל',
            back: 'Scapegoat',
            phonetic: 'Sa\'ir la-azazel',
            example: 'אַל תַּהַפְכוּ אוֹתוֹ לְשָׂעִיר לַעֲזָאזֵל בִּגְלַל כִּשָּׁלוֹן הַפְּרוֹיֶקְט. (Don\'t make him the scapegoat for the project\'s failure.)',
          },
          {
            front: 'בְּכִיָּה לְדוֹרוֹת',
            back: 'A tragic mistake with lasting ramifications',
            phonetic: 'Bechiya le-dorot',
            example: 'הֶרֶס הַמִּבְנֶה הַהִיסְטוֹרִי הוּא בְּכִיָּה לְדוֹרוֹת. (Demolishing the historical building is an irremediable tragedy for generations.)',
          },
          {
            front: 'לָבוּר אֶת הַתֶּבֶן מִן הַבָּר',
            back: 'To separate the wheat from the chaff',
            phonetic: 'Lavor et ha-teven min ha-bar',
            example: 'עָלֵינוּ לָבוּר אֶת הַתֶּבֶן מִן הַבָּר וּלְהִתְרַכֵּז בָּעֻבְדּוֹת. (We must separate wheat from chaff and focus on facts.)',
          },
        ],
      },
    },
    {
      title: 'Legal & Constitutional Terminology Match',
      titleHe: 'משפט עברי ומינוח חוקתי',
      description: 'Match precision terminology used in Supreme Court opinions, legislative bills, and contracts.',
      gameType: GameType.MATCHING,
      levelCode: 'C2',
      legacyLevel: HebrewLevel.FLUENT,
      difficulty: 'HARD',
      estimatedMins: 5,
      tags: ['Legal', 'Law', 'High Register', 'Level C2'],
      pointsReward: 50,
      configJson: {
        pairs: [
          { left: 'צַו מְנִיעָה זְמַנִּי', right: 'Temporary injunction / restraining order' },
          { left: 'רַשְׁלָנוּת רְפוּאִית', right: 'Medical malpractice' },
          { left: 'כְּתַב הֲגָנָה', right: 'Statement of defense' },
          { left: 'הֶסְכֵּם פְּשָׁרָה', right: 'Settlement agreement' },
          { left: 'מִדָּתִיּוּת וְסַבִּירוּת', right: 'Proportionality and reasonableness' },
          { left: 'חֲזָקַת חַפּוּת', right: 'Presumption of innocence' },
        ],
      },
    },
    {
      title: 'C2 Native Exemption (Ptor) Examination',
      titleHe: 'מבחן פטור אוניברסיטאי לעברית',
      description: 'Rigorous Hebrew proficiency test evaluating nuanced grammatical distinctions and classical literary register.',
      gameType: GameType.QUIZ,
      levelCode: 'C2',
      legacyLevel: HebrewLevel.FLUENT,
      difficulty: 'HARD',
      estimatedMins: 7,
      tags: ['Ptor', 'Exam', 'Mastery', 'Level C2'],
      pointsReward: 60,
      configJson: {
        questions: [
          {
            question: 'What is the precise meaning of the Talmudic phrase "נכסי צאן ברזל" in contemporary usage?',
            questionHe: 'מה המשמעות המדויקת של הביטוי "נכסי צאן ברזל"?',
            options: [
              'Iron farm equipment',
              'Enduring, timeless values and cultural masterpieces',
              'Agricultural investments',
              'Government treasury debt',
            ],
            correctIndex: 1,
            explanation: '"נכסי צאן ברזל" denotes indispensable cultural treasures that endure over time.',
          },
          {
            question: 'What does "למפרע" (Le-mafre\'a) signify in legal and official contracts?',
            questionHe: 'מה פירוש המילה "למפרע" בהסכמים משפטיים?',
            options: ['From this moment forward', 'Retroactively / Backwards in time', 'Temporarily', 'Under protest'],
            correctIndex: 1,
            explanation: '"למפרע" means with retroactive validity to a prior date.',
          },
          {
            question: 'Which of the following phrases expresses ironic, subtle disagreement?',
            questionHe: 'איזה ביטוי מבטא אי-הסכמה מעודנת ואירונית?',
            options: ['במלוא הכבוד, איפכא מסתברא', 'אין ספק בכך', 'כמובן מאליו', 'יישר כוח'],
            correctIndex: 0,
            explanation: '"איפכא מסתברא" is an Aramaic phrase used by intellectuals to assert the exact contrary.',
          },
        ],
      },
    },

    // ==========================================
    // LEVEL NATIVE — BILINGUAL FLUENCY
    // ==========================================
    {
      title: 'Native Bilingual Idiom Code-Switching',
      titleHe: 'שפת אם: קוד-סוויצ\'ינג וביטויים דו-לשוניים',
      description: 'Effortless bilingual fluency: master cultural nuances, comedic timing, and natural Israeli-English translations.',
      gameType: GameType.FLASHCARD,
      levelCode: 'NATIVE',
      legacyLevel: HebrewLevel.FLUENT,
      difficulty: 'HARD',
      estimatedMins: 5,
      tags: ['Bilingual', 'Native', 'Nuance', 'Level Native'],
      pointsReward: 55,
      configJson: {
        cards: [
          {
            front: 'לֹא רוֹאֶה מִמֶּטֶר',
            back: 'Fearless / Completely ignores obstacles / Doesn\'t give a damn',
            phonetic: 'Lo ro\'e mi-meter',
            example: 'הוּא לֹא רוֹאֶה מִמֶּטֶר כְּשֶׁמְּדֻבָּר בַּמַּטָּרוֹת שֶׁלּוֹ. (He\'s completely fearless when pursuing his goals.)',
          },
          {
            front: 'עָשָׂה לִי אֶת הַיּוֹם',
            back: 'Made my day (Natural colloquial loan in Hebrew)',
            phonetic: 'Asa li et ha-yom',
            example: 'הַמַּחְמָאָה הַזֹּאת פָּשׁוּט עָשְׂתָה לִי אֶת הַיּוֹם! (That compliment simply made my day!)',
          },
          {
            front: 'לָשִׂים אֶת הַדְּבָרִים עַל הַשֻּׁלְחָן',
            back: 'To put cards on the table / Address issues candidly',
            phonetic: 'Lasim et ha-dvarim al ha-shulchan',
            example: 'הִגִּיעַ הַזְּמַן לָשִׂים אֶת הַדְּבָרִים עַל הַשֻּׁלְחָן. (It\'s time to put everything on the table.)',
          },
          {
            front: 'לַעֲשׂוֹת מִזְּבוּב פִּיל',
            back: 'To make a mountain out of a molehill',
            phonetic: 'La\'asot mi-zvuv pil',
            example: 'אֵין צֹרֶךְ לַעֲשׂוֹת מִזְּבוּב פִּיל, זֶה עִנְיָן פָּשׁוּט. (No need to make a mountain out of a molehill; it\'s simple.)',
          },
        ],
      },
    },
    {
      title: 'Native Speed-Round Sprint (45s)',
      titleHe: 'ספרינט שפת אם: שליפה מהירה (45 שניות)',
      description: 'Lightning-fast bilingual comprehension: answer as many contextual questions as you can before the buzzer!',
      gameType: GameType.SPEED_ROUND,
      levelCode: 'NATIVE',
      legacyLevel: HebrewLevel.FLUENT,
      difficulty: 'HARD',
      estimatedMins: 3,
      tags: ['Sprint', 'Native', 'Speed', 'Level Native'],
      pointsReward: 60,
      configJson: {
        rounds: [
          {
            prompt: 'מה המשמעות של "חבל על הזמן" כאשר מדברים בהתלהבות?',
            options: ['בזבוז זמן', 'מעולה ויוצא דופן', 'מאוחר מדי', 'מייגע ומשעמם'],
            answer: 'מעולה ויוצא דופן',
          },
          {
            prompt: 'איזה ביטוי שווה ערך ל-"Don\'t jump the gun"?',
            options: ['אל תקפוץ בראש', 'אל תשרוף גשרים', 'אל תבכה על חלב שנשפך', 'אל תסתכל בקנקן'],
            answer: 'אל תקפוץ בראש',
          },
          {
            prompt: 'כשמישהו "אוכל סרטים", מה עובר עליו?',
            options: ['הוא בבית קולנוע', 'הוא נהנה מארוחה', 'הוא לחוץ ומוטרד מספקות', 'הוא עובד בהפקה'],
            answer: 'הוא לחוץ ומוטרד מספקות',
          },
          {
            prompt: 'מה הכוונה ב-"ללכת סחור סחור"?',
            options: ['ללכת ישר למטרה', 'להתחמק מלומר את העיקר', 'לסחור בבורסה', 'ללכת מהר ברחוב'],
            answer: 'להתחמק מלומר את העיקר',
          },
        ],
      },
    },
    {
      title: 'Nuanced Rhetoric Sentence Builder',
      titleHe: 'בניית טיעונים רהוטים ומנומקים',
      description: 'Synthesize articulate, persuasive native speech with natural cadence, rhetorical grace, and punchy conclusions.',
      gameType: GameType.SENTENCE_BUILDER,
      levelCode: 'NATIVE',
      legacyLevel: HebrewLevel.FLUENT,
      difficulty: 'HARD',
      estimatedMins: 5,
      tags: ['Rhetoric', 'Native', 'Syntax', 'Level Native'],
      pointsReward: 65,
      configJson: {
        sentences: [
          {
            words: ['רק', 'באמצעות', 'שיח', 'פתוח', 'ומכבד', 'נוכל', 'לגשר', 'על', 'הפערים'],
            correct: 'רק באמצעות שיח פתוח ומכבד נוכל לגשר על הפערים',
            translation: 'Only through open and respectful dialogue can we bridge the gaps.',
          },
          {
            words: ['מדובר', 'בצעד', 'מכריע', 'שישנה', 'את', 'פני', 'החברה', 'בעתיד'],
            correct: 'מדובר בצעד מכריע שישנה את פני החברה בעתיד',
            translation: 'This is a decisive step that will alter the future face of society.',
          },
        ],
      },
    },
  ];

  for (const gameData of realGames) {
    const level = createdLevels[gameData.levelCode];
    await prisma.game.create({
      data: {
        title: gameData.title,
        titleHe: gameData.titleHe,
        description: gameData.description,
        gameType: gameData.gameType,
        levelId: level ? level.id : null,
        level: gameData.legacyLevel,
        difficulty: gameData.difficulty,
        estimatedMins: gameData.estimatedMins,
        tags: gameData.tags,
        configJson: gameData.configJson,
        pointsReward: gameData.pointsReward,
        isActive: true,
      },
    });
  }

  console.log(`Successfully seeded ${realGames.length} authentic CEFR-aligned games!`);
}

seedCefrAndGames()
  .catch((e) => {
    console.error('Error during CEFR seed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
