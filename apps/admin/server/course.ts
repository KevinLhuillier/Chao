/**
 * Starter course, Southern Vietnamese (Saigon / Mekong Delta). Loaded by
 * `npm run seed`; afterwards everything is edited in the admin.
 *
 * `north` is the Northern (Hanoi) word when the South says it differently.
 * `ex` is an example sentence [Vietnamese, English]: it also becomes a
 * "rebuild the sentence" exercise.
 */
import type { UnitColor, UnitIcon } from '@chao/shared';

export type SeedWord = {
  vi: string;
  en: string;
  alt?: string[];
  kind?: 'expression';
  north?: string;
  note?: string;
  ex?: [string, string];
};

export type SeedLesson = { key: string; title: string; words: SeedWord[] };

export type SeedUnit = {
  key: string;
  title: string;
  description: string;
  color: UnitColor;
  icon: UnitIcon;
  lessons: SeedLesson[];
};

export const COURSE: SeedUnit[] = [
  {
    key: 'greetings',
    title: 'Greetings',
    description: 'Say hello the Saigon way',
    color: 'jade',
    icon: 'hello',
    lessons: [
      {
        key: 'greetings-hello',
        title: 'Hello!',
        words: [
          {
            vi: 'xin chào',
            en: 'hello',
            alt: ['hi'],
            note: 'Polite and works with everyone. Between friends you’ll often just hear “Chào!”.',
            ex: ['Xin chào, tui là Nam.', 'Hello, I am Nam.'],
          },
          {
            vi: 'chào anh',
            en: 'hello (to a man)',
            alt: ['hello', 'hi'],
            kind: 'expression',
            note: 'Vietnamese greets with a pronoun: “anh” for a man a bit older than you.',
            ex: ['Chào anh, anh khỏe không?', 'Hello, how are you?'],
          },
          {
            vi: 'chào chị',
            en: 'hello (to a woman)',
            alt: ['hello', 'hi'],
            kind: 'expression',
            note: '“Chị” is for a woman a bit older than you.',
          },
          {
            vi: 'dạ',
            en: 'yes (polite)',
            alt: ['yes'],
            north: 'vâng',
            note: 'The polite “yes” of the South. It’s also how you answer when someone calls your name.',
            ex: ['Dạ, em hiểu rồi.', 'Yes, I understand.'],
          },
        ],
      },
      {
        key: 'greetings-thanks',
        title: 'Thank you & sorry',
        words: [
          {
            vi: 'cảm ơn',
            en: 'thank you',
            alt: ['thanks'],
            ex: ['Cảm ơn chị nhiều!', 'Thank you very much!'],
          },
          {
            vi: 'không có chi',
            en: 'you’re welcome',
            alt: ["you're welcome", 'no problem'],
            kind: 'expression',
            north: 'không có gì',
            note: 'Southern twist: “chi” instead of “gì”.',
          },
          { vi: 'xin lỗi', en: 'sorry', alt: ['excuse me', "i'm sorry", 'i am sorry'] },
          {
            vi: 'không sao',
            en: 'no problem',
            alt: ["it's okay", "it's fine", 'it is okay', 'never mind'],
            kind: 'expression',
            ex: ['Không sao đâu!', 'No problem at all!'],
          },
        ],
      },
      {
        key: 'greetings-bye',
        title: 'How are you?',
        words: [
          {
            vi: 'khỏe không',
            en: 'how are you?',
            alt: ['how are you', 'are you well'],
            kind: 'expression',
            note: 'Literally “healthy, or not?”.',
            ex: ['Dạo này khỏe không?', 'How have you been lately?'],
          },
          {
            vi: 'khỏe',
            en: 'well',
            alt: ['fine', 'good', 'healthy'],
            ex: ['Tui khỏe, cảm ơn.', 'I am fine, thank you.'],
          },
          { vi: 'tạm biệt', en: 'goodbye', alt: ['bye'] },
          {
            vi: 'hẹn gặp lại',
            en: 'see you again',
            alt: ['see you later', 'see you', 'see you soon'],
            kind: 'expression',
          },
        ],
      },
    ],
  },
  {
    key: 'people',
    title: 'People & family',
    description: 'Ba, má and everyone else',
    color: 'lotus',
    icon: 'family',
    lessons: [
      {
        key: 'people-me-you',
        title: 'Me and you',
        words: [
          {
            vi: 'tui',
            en: 'I',
            alt: ['me'],
            north: 'tôi',
            note: 'The everyday “I” of the South. “Tôi” sounds more formal.',
            ex: ['Tui tên là Lan.', 'My name is Lan.'],
          },
          { vi: 'bạn', en: 'friend', alt: ['you'], ex: ['Bạn tên gì?', 'What is your name?'] },
          { vi: 'tên', en: 'name', ex: ['Tên tui là Minh.', 'My name is Minh.'] },
          {
            vi: 'em',
            en: 'younger sibling',
            alt: ['younger brother', 'younger sister', 'you'],
            note: 'Also how you say “you” to someone younger than you.',
          },
        ],
      },
      {
        key: 'people-family',
        title: 'Family',
        words: [
          { vi: 'ba', en: 'dad', alt: ['father', 'daddy'], north: 'bố' },
          { vi: 'má', en: 'mom', alt: ['mother', 'mum', 'mommy'], north: 'mẹ' },
          { vi: 'anh', en: 'older brother', alt: ['brother'] },
          { vi: 'chị', en: 'older sister', alt: ['sister'] },
          {
            vi: 'gia đình',
            en: 'family',
            ex: ['Gia đình tui ở Cần Thơ.', 'My family lives in Can Tho.'],
          },
        ],
      },
    ],
  },
  {
    key: 'food',
    title: 'Food & drinks',
    description: 'Order like a local',
    color: 'gold',
    icon: 'food',
    lessons: [
      {
        key: 'food-street',
        title: 'Street food',
        words: [
          {
            vi: 'hủ tiếu',
            en: 'hu tieu noodle soup',
            alt: ['hu tieu', 'noodle soup', 'noodles'],
            note: 'The noodle soup of the South, a classic Saigon breakfast.',
          },
          { vi: 'bánh mì', en: 'banh mi', alt: ['bread', 'sandwich', 'baguette'] },
          {
            vi: 'cơm',
            en: 'rice',
            alt: ['cooked rice', 'meal'],
            note: '“Ăn cơm chưa?” (Have you eaten yet?) is a friendly way to say hi.',
            ex: ['Ăn cơm chưa?', 'Have you eaten yet?'],
          },
          {
            vi: 'ngon',
            en: 'delicious',
            alt: ['tasty', 'good'],
            ex: ['Ngon quá!', 'So delicious!'],
          },
        ],
      },
      {
        key: 'food-drinks',
        title: 'Drinks',
        words: [
          {
            vi: 'cà phê sữa đá',
            en: 'iced milk coffee',
            alt: ['iced coffee with milk', 'milk coffee'],
            note: 'Saigon’s favourite: strong drip coffee, condensed milk and lots of ice.',
          },
          { vi: 'trà đá', en: 'iced tea' },
          { vi: 'nước', en: 'water' },
          {
            vi: 'ly',
            en: 'glass',
            alt: ['cup'],
            north: 'cốc',
            ex: ['Cho tui một ly nước.', 'A glass of water, please.'],
          },
          { vi: 'uống', en: 'to drink', alt: ['drink'] },
        ],
      },
      {
        key: 'food-table',
        title: 'At the table',
        words: [
          { vi: 'ăn', en: 'to eat', alt: ['eat'] },
          { vi: 'chén', en: 'bowl', north: 'bát' },
          { vi: 'muỗng', en: 'spoon', north: 'thìa' },
          { vi: 'đũa', en: 'chopsticks' },
          {
            vi: 'tính tiền',
            en: 'the bill, please',
            alt: ['the bill please', 'bill please', 'check please', 'the bill'],
            kind: 'expression',
            note: 'To pay at a restaurant, call the waiter: “Em ơi, tính tiền!”',
            ex: ['Em ơi, tính tiền!', 'Excuse me, the bill please!'],
          },
        ],
      },
    ],
  },
  {
    key: 'market',
    title: 'At the market',
    description: 'Bargain at the floating market',
    color: 'lantern',
    icon: 'market',
    lessons: [
      {
        key: 'market-price',
        title: 'How much?',
        words: [
          {
            vi: 'bao nhiêu tiền',
            en: 'how much is it?',
            alt: ['how much', 'how much is it', 'how much money'],
            kind: 'expression',
            note: 'In fast Southern speech you’ll even hear “nhiêu tiền?”.',
            ex: ['Cái này bao nhiêu tiền?', 'How much is this?'],
          },
          { vi: 'mắc', en: 'expensive', north: 'đắt', ex: ['Mắc quá!', 'Too expensive!'] },
          { vi: 'rẻ', en: 'cheap' },
          { vi: 'mua', en: 'to buy', alt: ['buy'] },
          { vi: 'bán', en: 'to sell', alt: ['sell'] },
        ],
      },
      {
        key: 'market-fruit',
        title: 'Fruit',
        words: [
          {
            vi: 'trái cây',
            en: 'fruit',
            north: 'hoa quả',
            note: 'The South says “trái”, the North “quả”.',
          },
          { vi: 'xoài', en: 'mango' },
          {
            vi: 'thơm',
            en: 'pineapple',
            north: 'dứa',
            note: '“Thơm” also means fragrant!',
          },
          { vi: 'chuối', en: 'banana' },
          {
            vi: 'dừa',
            en: 'coconut',
            ex: ['Miền Tây có nhiều dừa.', 'The Mekong Delta has lots of coconuts.'],
          },
        ],
      },
      {
        key: 'market-bargain',
        title: 'Bargaining',
        words: [
          {
            vi: 'bớt đi',
            en: 'lower the price',
            alt: ['give me a discount', 'discount', 'cheaper please', 'a bit cheaper'],
            kind: 'expression',
            ex: ['Bớt đi chị!', 'Give me a better price!'],
          },
          {
            vi: 'được không',
            en: 'is that okay?',
            alt: ['okay?', 'is it okay', 'can you'],
            kind: 'expression',
          },
          {
            vi: 'chợ nổi',
            en: 'floating market',
            note: 'Cái Răng, in Cần Thơ, is the most famous one.',
          },
          {
            vi: 'ghe',
            en: 'boat',
            north: 'thuyền',
            note: 'The wooden boats of the Delta. Look for the eyes painted on the bow!',
          },
        ],
      },
    ],
  },
  {
    key: 'numbers',
    title: 'Numbers',
    description: 'Count from một to ngàn',
    color: 'sky',
    icon: 'numbers',
    lessons: [
      {
        key: 'numbers-1-5',
        title: '1 to 5',
        words: [
          { vi: 'một', en: 'one', alt: ['1'] },
          { vi: 'hai', en: 'two', alt: ['2'] },
          {
            vi: 'ba',
            en: 'three',
            alt: ['3'],
            note: 'Same word as “dad”: context tells them apart.',
          },
          { vi: 'bốn', en: 'four', alt: ['4'] },
          { vi: 'năm', en: 'five', alt: ['5'], note: '“Năm” also means “year”.' },
        ],
      },
      {
        key: 'numbers-6-10',
        title: '6 to 10',
        words: [
          { vi: 'sáu', en: 'six', alt: ['6'] },
          { vi: 'bảy', en: 'seven', alt: ['7'] },
          { vi: 'tám', en: 'eight', alt: ['8'] },
          { vi: 'chín', en: 'nine', alt: ['9'] },
          { vi: 'mười', en: 'ten', alt: ['10'] },
        ],
      },
      {
        key: 'numbers-big',
        title: 'Big numbers',
        words: [
          { vi: 'trăm', en: 'hundred', alt: ['100', 'a hundred'] },
          {
            vi: 'ngàn',
            en: 'thousand',
            alt: ['1000', 'a thousand'],
            north: 'nghìn',
            note: 'Prices are said in thousands: “hai chục ngàn” = 20,000 đồng.',
          },
          { vi: 'chục', en: 'ten (a group of ten)', alt: ['ten', 'dozen'] },
          { vi: 'đồng', en: 'dong', alt: ['vietnamese dong'], note: 'The Vietnamese currency.' },
        ],
      },
    ],
  },
  {
    key: 'travel',
    title: 'Getting around',
    description: 'Xe ôm, ghe and directions',
    color: 'bamboo',
    icon: 'travel',
    lessons: [
      {
        key: 'travel-where',
        title: 'Where is it?',
        words: [
          {
            vi: 'ở đâu',
            en: 'where?',
            alt: ['where', 'where is it'],
            kind: 'expression',
            ex: ['Chợ Bến Thành ở đâu?', 'Where is Ben Thanh market?'],
          },
          { vi: 'bên trái', en: 'on the left', alt: ['left'] },
          { vi: 'bên phải', en: 'on the right', alt: ['right'] },
          {
            vi: 'đi thẳng',
            en: 'go straight',
            alt: ['straight ahead', 'straight'],
            kind: 'expression',
          },
          { vi: 'dừng lại', en: 'stop', alt: ['stop here'] },
        ],
      },
      {
        key: 'travel-transport',
        title: 'Transport',
        words: [
          { vi: 'xe máy', en: 'motorbike', alt: ['scooter', 'motorcycle'] },
          {
            vi: 'xe ôm',
            en: 'motorbike taxi',
            alt: ['moto taxi', 'bike taxi'],
            note: 'Literally “hug vehicle”: you hold on to the driver!',
          },
          { vi: 'xe buýt', en: 'bus' },
          { vi: 'đi', en: 'to go', alt: ['go'], ex: ['Tui đi chợ.', 'I go to the market.'] },
          { vi: 'về', en: 'to go back', alt: ['go home', 'return', 'go back'] },
        ],
      },
    ],
  },
];
