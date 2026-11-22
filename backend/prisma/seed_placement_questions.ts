import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const PLACEMENT_QUESTIONS_SEED = [
  {
    orderNumber: 1,
    questionText: "I ______ bus on Mondays.",
    optionA: "'m going to work with",
    optionB: "'m going to work by",
    optionC: "go to work with",
    optionD: "go to work by",
    correctOption: "D",
    level: "A1",
    explanation: "We use present simple 'go to work' for routine actions and 'by' for modes of transportation (by bus)."
  },
  {
    orderNumber: 2,
    questionText: "Sorry, but this chair is ______.",
    optionA: "me",
    optionB: "mine",
    optionC: "my",
    optionD: "our",
    correctOption: "B",
    level: "A1",
    explanation: "Possessive pronoun 'mine' stands alone without a following noun."
  },
  {
    orderNumber: 3,
    questionText: "A: 'How old ______?'   B: 'I ______ .'",
    optionA: "are you / am 20 years old.",
    optionB: "have you / have 20 years old",
    optionC: "are you / am 20 years.",
    optionD: "do you have / have 20 years.",
    correctOption: "A",
    level: "A1",
    explanation: "In English, we express age using the verb 'to be' ('are you / am 20 years old')."
  },
  {
    orderNumber: 4,
    questionText: "I ______ to the cinema.",
    optionA: "not usually go",
    optionB: "don't usually go",
    optionC: "don't go usually",
    optionD: "do not go usually",
    correctOption: "B",
    level: "A1",
    explanation: "Adverbs of frequency (usually) are placed before the main verb in negative present simple statements: 'don't usually go'."
  },
  {
    orderNumber: 5,
    questionText: "Where ______ ?",
    optionA: "your sister works",
    optionB: "your sister work",
    optionC: "does your sister work",
    optionD: "do your sister work",
    correctOption: "C",
    level: "A1",
    explanation: "Question form in present simple for 3rd person singular takes 'does + subject + base verb'."
  },
  {
    orderNumber: 6,
    questionText: "The test is ______ February.",
    optionA: "in",
    optionB: "at",
    optionC: "on",
    optionD: "over",
    correctOption: "A",
    level: "A1",
    explanation: "We use preposition 'in' with months and years (in February)."
  },
  {
    orderNumber: 7,
    questionText: "I eat pasta ______ week.",
    optionA: "twice in a",
    optionB: "twice a",
    optionC: "one time a",
    optionD: "once in a",
    correctOption: "B",
    level: "A2",
    explanation: "Frequency expression: 'twice a week' or 'once a week'."
  },
  {
    orderNumber: 8,
    questionText: "I don't have ______ free time.",
    optionA: "many",
    optionB: "any",
    optionC: "a lot",
    optionD: "some",
    correctOption: "B",
    level: "A2",
    explanation: "'Any' is standard with uncountable nouns in negative sentences ('don't have any free time')."
  },
  {
    orderNumber: 9,
    questionText: "A: '_____ to the cinema tomorrow?'",
    optionA: "We will go",
    optionB: "Do we go",
    optionC: "We go",
    optionD: "Shall we go",
    correctOption: "D",
    level: "A2",
    explanation: "'Shall we...?' is the standard polite suggestion form in English."
  },
  {
    orderNumber: 10,
    questionText: "We went to the market ______ some vegetables.",
    optionA: "to buy",
    optionB: "for buy",
    optionC: "for to buy",
    optionD: "for buying",
    correctOption: "A",
    level: "A2",
    explanation: "Infinitive of purpose: 'to buy' expresses why someone went somewhere."
  },
  {
    orderNumber: 11,
    questionText: "Sorry, but when you called I ______ a shower.",
    optionA: "had",
    optionB: "did have",
    optionC: "was having",
    optionD: "were having",
    correctOption: "C",
    level: "A2",
    explanation: "Past continuous ('was having') denotes an action in progress interrupted by a past simple action ('you called')."
  },
  {
    orderNumber: 12,
    questionText: "______ are very friendly and very intelligent.",
    optionA: "Dolphins",
    optionB: "The dolphins",
    optionC: "A dolphin",
    optionD: "The dolphin",
    correctOption: "A",
    level: "A2",
    explanation: "Plural nouns referring to species in general do not take the definite article 'the'."
  },
  {
    orderNumber: 13,
    questionText: "Somebody stole ______ yesterday.",
    optionA: "the car of my mother",
    optionB: "my car mother",
    optionC: "my mother's car",
    optionD: "my mother car",
    correctOption: "C",
    level: "B1",
    explanation: "Possessive 's ('my mother's car') is standard for people possessing objects."
  },
  {
    orderNumber: 14,
    questionText: "______ with me?",
    optionA: "Do you like to dance",
    optionB: "Would you like to dance",
    optionC: "Do you like dance",
    optionD: "Would you like dancing",
    correctOption: "B",
    level: "B1",
    explanation: "'Would you like to dance?' is the correct polite invitation/offer structure."
  },
  {
    orderNumber: 15,
    questionText: "She is ______ her sister, I think.",
    optionA: "more happier than",
    optionB: "more happy that",
    optionC: "happier that",
    optionD: "happier than",
    correctOption: "D",
    level: "B1",
    explanation: "Comparative form of happy is 'happier than' (not 'more happier')."
  },
  {
    orderNumber: 16,
    questionText: "I couldn't eat ______ before the exam.",
    optionA: "nothing",
    optionB: "anything",
    optionC: "everything",
    optionD: "something",
    correctOption: "B",
    level: "B1",
    explanation: "Negative verb 'couldn't' pairs with 'anything' to prevent double negatives."
  },
  {
    orderNumber: 17,
    questionText: "Please, pass me the remote. ______ TV.",
    optionA: "I'm watching",
    optionB: "I will watch",
    optionC: "I'm going to watch",
    optionD: "I might watch",
    correctOption: "C",
    level: "B1",
    explanation: "'Be going to' expresses a prior intention or immediate plan."
  },
  {
    orderNumber: 18,
    questionText: "I'll call you when I ______ home.",
    optionA: "arrive",
    optionB: "'m going to arrive",
    optionC: "will arrive",
    optionD: "arrived",
    correctOption: "A",
    level: "B1",
    explanation: "Time clauses starting with 'when' take the present simple to refer to the future."
  },
  {
    orderNumber: 19,
    questionText: "______ Japan?",
    optionA: "Have you ever gone in",
    optionB: "Do you have been in",
    optionC: "Have you ever been to",
    optionD: "Have you ever been into",
    correctOption: "C",
    level: "B2",
    explanation: "'Have you ever been to [place]?' is the standard present perfect construction for life experiences."
  },
  {
    orderNumber: 20,
    questionText: "He drives very ______.",
    optionA: "slow",
    optionB: "slower",
    optionC: "more slowly",
    optionD: "slowly",
    correctOption: "D",
    level: "B2",
    explanation: "Adverb 'slowly' modifies the verb 'drives'."
  },
  {
    orderNumber: 21,
    questionText: "Can you ______ the lights? I can't see.",
    optionA: "open",
    optionB: "turn on",
    optionC: "start",
    optionD: "put on",
    correctOption: "B",
    level: "B2",
    explanation: "Phrasal verb 'turn on' is used for electrical devices and illumination."
  },
  {
    orderNumber: 22,
    questionText: "We couldn't find a taxi, ______ we walked home.",
    optionA: "so",
    optionB: "because",
    optionC: "but",
    optionD: "although",
    correctOption: "A",
    level: "B2",
    explanation: "Conjunction 'so' expresses result/consequence."
  },
  {
    orderNumber: 23,
    questionText: "Tomorrow I ______ get up early; it's my day off.",
    optionA: "mustn't",
    optionB: "must",
    optionC: "haven't to",
    optionD: "don't have to",
    correctOption: "D",
    level: "B2",
    explanation: "'Don't have to' denotes lack of obligation."
  },
  {
    orderNumber: 24,
    questionText: "I ______ this coffee. It tastes horrible.",
    optionA: "am not like",
    optionB: "don't like",
    optionC: "'m not liking",
    optionD: "not like",
    correctOption: "B",
    level: "B2",
    explanation: "'Like' is a stative verb and is used in the present simple, not continuous."
  },
  {
    orderNumber: 25,
    questionText: "We ______ yesterday.",
    optionA: "arrived",
    optionB: "did arrive",
    optionC: "have arrive",
    optionD: "have arrived",
    correctOption: "A",
    level: "C1",
    explanation: "Specific completed past time marker 'yesterday' requires past simple ('arrived')."
  },
  {
    orderNumber: 26,
    questionText: "When I arrive home, I'm going to have a ______ bath.",
    optionA: "relaxing",
    optionB: "relaxed",
    optionC: "relax",
    optionD: "relaxation",
    correctOption: "A",
    level: "C1",
    explanation: "The -ing participle adjective 'relaxing' describes the quality causing the feeling of relaxation."
  },
  {
    orderNumber: 27,
    questionText: "A: 'We don't have any milk.'   B: 'Really? I ______ more.'",
    optionA: "'m going to buy",
    optionB: "'ll buy",
    optionC: "'m buying",
    optionD: "buy",
    correctOption: "B",
    level: "C1",
    explanation: "Spontaneous on-the-spot decision made at the moment of speaking takes 'will'."
  },
  {
    orderNumber: 28,
    questionText: "We ______ to seeing you next Thursday.",
    optionA: "really want",
    optionB: "hope",
    optionC: "are looking forward",
    optionD: "really wish",
    correctOption: "C",
    level: "C1",
    explanation: "The prepositional phrasal verb 'look forward to' is followed by a gerund (-ing form)."
  },
  {
    orderNumber: 29,
    questionText: "I'd like to go ______ in the park.",
    optionA: "to walking",
    optionB: "for walk",
    optionC: "for a walk",
    optionD: "to walk",
    correctOption: "C",
    level: "C1",
    explanation: "Fixed idiomatic English collocation: 'go for a walk'."
  },
  {
    orderNumber: 30,
    questionText: "German ______ in Germany, Austria and Switzerland.",
    optionA: "is spoken",
    optionB: "spoken",
    optionC: "speaks",
    optionD: "is speak",
    correctOption: "A",
    level: "C1",
    explanation: "Passive voice in present simple: 'is + past participle' (is spoken)."
  },
  {
    orderNumber: 31,
    questionText: "I ______ your book. It's fantastic. I'll finish it tonight.",
    optionA: "'ve been reading",
    optionB: "read",
    optionC: "'ve read",
    optionD: "'m read",
    correctOption: "A",
    level: "C2",
    explanation: "Present perfect continuous emphasizes an activity in progress that is not yet completed."
  },
  {
    orderNumber: 32,
    questionText: "He went on a business _____ to New York.",
    optionA: "travel",
    optionB: "journey",
    optionC: "commute",
    optionD: "trip",
    correctOption: "D",
    level: "C2",
    explanation: "'Business trip' is the correct countable noun collocation."
  },
  {
    orderNumber: 33,
    questionText: "If I tell you a secret, ______ anyone?",
    optionA: "are you tell",
    optionB: "do you tell",
    optionC: "will you tell",
    optionD: "are you telling",
    correctOption: "C",
    level: "C2",
    explanation: "First conditional question: 'If + present simple, will + base verb?'."
  },
  {
    orderNumber: 34,
    questionText: "My brother and I don't ______ very well.",
    optionA: "get off",
    optionB: "get on",
    optionC: "go on",
    optionD: "break off",
    correctOption: "B",
    level: "C2",
    explanation: "Phrasal verb 'get on' (or get along) means to have a harmonious relationship."
  },
  {
    orderNumber: 35,
    questionText: "I ______ fifty pages, but I have to read fifty more.",
    optionA: "'ve been reading",
    optionB: "was reading",
    optionC: "'ve reading",
    optionD: "'ve read",
    correctOption: "D",
    level: "C2",
    explanation: "Present perfect simple is used when specifying a completed quantity or number of times."
  },
  {
    orderNumber: 36,
    questionText: "If I ______ you, I wouldn't do it.",
    optionA: "was",
    optionB: "were",
    optionC: "would be",
    optionD: "am",
    correctOption: "B",
    level: "C2",
    explanation: "Subjunctive mood in second conditional: 'If I were you'."
  }
];

async function main() {
  console.log('Seeding 36 Placement Test Questions...');

  for (const q of PLACEMENT_QUESTIONS_SEED) {
    await prisma.placementTestQuestion.upsert({
      where: {
        id: `placement-q-${q.orderNumber}`
      },
      update: {
        orderNumber: q.orderNumber,
        questionText: q.questionText,
        optionA: q.optionA,
        optionB: q.optionB,
        optionC: q.optionC,
        optionD: q.optionD,
        correctOption: q.correctOption,
        level: q.level,
        explanation: q.explanation,
        isActive: true
      },
      create: {
        id: `placement-q-${q.orderNumber}`,
        orderNumber: q.orderNumber,
        questionText: q.questionText,
        optionA: q.optionA,
        optionB: q.optionB,
        optionC: q.optionC,
        optionD: q.optionD,
        correctOption: q.correctOption,
        level: q.level,
        explanation: q.explanation,
        isActive: true
      }
    });
  }

  const count = await prisma.placementTestQuestion.count();
  console.log(`Successfully seeded ${count} Placement Test questions!`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
