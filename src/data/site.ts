export const socials = {
  twitch: "https://www.twitch.tv/achimari",
  tiktok: "https://www.tiktok.com/@akadiy.kleshneruk",
  tiktok2: "https://www.tiktok.com/@achimari31",
  youtube: "https://www.youtube.com/@akadiykleshnerukov",
  telegram: "https://t.me/achimari31",
} as const;

export type SocialKey = keyof typeof socials;

export const navLinks = [
  { id: "about", label: "О стримере" },
  { id: "streams", label: "Эфир" },
  { id: "socials", label: "Каналы" },
] as const;

export interface SocialEntry {
  key: SocialKey;
  name: string;
  handle: string;
  description: string;
  url: string;
  accent: "burgundy" | "violet" | "marker";
}

export const socialLinks: SocialEntry[] = [
  {
    key: "twitch",
    name: "Twitch",
    handle: "@achimari",
    description: "Игры, музыка и честные разговоры",
    url: socials.twitch,
    accent: "violet",
  },
  {
    key: "tiktok",
    name: "TikTok",
    handle: "@akadiy.kleshneruk",
    description: "Спорт, музыка и дополнительные видео",
    url: socials.tiktok,
    accent: "burgundy",
  },
  {
    key: "tiktok2",
    name: "TikTok 02",
    handle: "@achimari31",
    description: "Чёрный юмор и короткие фрагменты",
    url: socials.tiktok2,
    accent: "marker",
  },
  {
    key: "youtube",
    name: "YouTube",
    handle: "@akadiykleshnerukov",
    description: "Чистое искуство",
    url: socials.youtube,
    accent: "burgundy",
  },
  {
    key: "telegram",
    name: "Telegram",
    handle: "@achimari31",
    description: "Новости, вечерние планы и сообщество",
    url: socials.telegram,
    accent: "violet",
  },
];

export interface CapabilityEntry {
  code: string;
  title: string;
  description: string;
}

/** Пять главных тем, из которых складывается эфир ACHIMARI. */
export const capabilities: CapabilityEntry[] = [
  {
    code: "A01",
    title: "Игры",
    description: "Играю, шучу и разговариваю с чатом без заранее написанного сценария.",
  },
  {
    code: "A02",
    title: "Музыка",
    description: "Играю на гитаре, пою песни и периодически превращаю стрим в подпольный квартирник.",
  },
  {
    code: "A03",
    title: "Поэзия",
    description: "Читаю стихи и люблю длинные разговоры под мерцание старого экрана.",
  },
  {
    code: "A04",
    title: "Вера",
    description: "Я христианин. Верю в Иисуса Христа не как в красивый символ на стене, а как в единственную надежду среди шума, усталости и общей серости.",
  },
  {
    code: "A05",
    title: "Спорт",
    description: "За плечами 21 километр. Впереди – ещё неизвестно сколько кругов.",
  },
];

export interface ScheduleNote {
  /** Основная фраза подписи. */
  main: string;
  /** Уточнение — вторая, более тихая ступень. */
  qualifier: string;
}

export interface ScheduleEntry {
  days: string;
  note: ScheduleNote;
}

/** Читается как «Возможно вечером, но не точно» — две ступени одной подписи. */
const MAYBE_TONIGHT: ScheduleNote = {
  main: "Возможно вечером",
  qualifier: "Но не точно",
};

/** Редактируемое расписание. Актуальные объявления публикуются в Telegram и на Twitch. */
export const schedule: ScheduleEntry[] = [
  { days: "Понедельник", note: MAYBE_TONIGHT },
  { days: "Среда", note: MAYBE_TONIGHT },
  { days: "Пятница", note: MAYBE_TONIGHT },
  { days: "Выходные", note: MAYBE_TONIGHT },
];
