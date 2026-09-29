export const socials = {
  twitch: "https://www.twitch.tv/achimari",
  tiktok: "https://www.tiktok.com/@akadiy.kleshneruk",
  tiktok2: "https://www.tiktok.com/@achimari31",
  youtube: "https://www.youtube.com/@akadiykleshnerukov",
  telegram: "https://t.me/achimari31",
} as const;

export type SocialKey = keyof typeof socials;

/** Разделы одной сцены вместо секций страницы. */
export type Mode = "home" | "about" | "schedule" | "links";

export const modes: { id: Mode; label: string }[] = [
  { id: "home", label: "Главная" },
  { id: "about", label: "Обо мне" },
  { id: "schedule", label: "Когда стрим" },
  { id: "links", label: "Ссылки" },
];

export type SceneId = number;
/** Где в кадре главный объект — по просмотру кадров, а не по имени файла. */
export type SubjectSide = "left" | "center" | "right";

export interface Scene {
  id: SceneId;
  number: string;
  src: string;
  poster: string;
  /** object-position на широком экране и на телефоне (там видна лишь узкая полоса кадра). */
  focusDesktop: string;
  focusMobile: string;
  subjectDesktop: SubjectSide;
  subjectMobile: SubjectSide;
  /** Звуковые дорожки из веб-копий убраны: саундтрек сайта — свой джаз. */
  hasAudio: boolean;
}

const scene = (
  id: number,
  file: string,
  focusDesktop: string,
  focusMobile: string,
  subjectDesktop: SubjectSide,
): Scene => ({
  id,
  number: String(id + 1).padStart(2, "0"),
  src: `/videos/${file}.mp4`,
  poster: `/videos/posters/${file}.webp`,
  focusDesktop,
  focusMobile,
  subjectDesktop,
  subjectMobile: "center",
  hasAudio: false,
});

export const scenes: Scene[] = [
  // Человек идёт справа к центру и слева не бывает.
  scene(0, "snowy-sidewalk", "50% 35%", "62% 40%", "right"),
  // Водитель левее центра.
  scene(1, "car-window", "46% 40%", "28% 40%", "left"),
  // Без человека: поезд и улица по центру.
  scene(2, "chicago-drive", "50% 45%", "50% 45%", "center"),
  scene(3, "tea-table", "50% 40%", "55% 40%", "center"),
  // Человек смещается от центра вправо.
  scene(4, "tram-stop", "50% 40%", "60% 40%", "right"),
  scene(5, "underpass", "50% 40%", "45% 40%", "center"),
];

export const intro = "Привет, я Achimari. Играю, общаюсь с чатом, иногда беру гитару.";

export const about = {
  lead: "Я Achimari. Обычно играю и общаюсь с чатом. Иногда беру гитару, пою или читаю стихи. Ещё бегаю и говорю о том, что для меня важно.",
};

export interface SocialEntry {
  key: SocialKey;
  name: string;
  handle: string;
  description: string;
  url: string;
}

export const socialLinks: SocialEntry[] = [
  { key: "twitch", name: "Twitch", handle: "@achimari", description: "Стримы и чат", url: socials.twitch },
  {
    key: "tiktok",
    name: "TikTok",
    handle: "@akadiy.kleshneruk",
    description: "Спорт, музыка и обычная жизнь",
    url: socials.tiktok,
  },
  {
    key: "tiktok2",
    name: "TikTok 02",
    handle: "@achimari31",
    description: "Шутки и короткие моменты",
    url: socials.tiktok2,
  },
  {
    key: "youtube",
    name: "YouTube",
    handle: "@akadiykleshnerukov",
    description: "Записи и другие видео",
    url: socials.youtube,
  },
  { key: "telegram", name: "Telegram", handle: "@achimari31", description: "Анонсы и новости", url: socials.telegram },
];

export interface CapabilityEntry {
  title: string;
  description: string;
  /** Главное на стримах — крупно; остальное — короткими строками. */
  major?: boolean;
}

export const capabilities: CapabilityEntry[] = [
  { title: "Игры", description: "Играю во всё подряд и читаю чат по ходу.", major: true },
  { title: "Музыка", description: "Иногда беру гитару — сыграть или спеть.", major: true },
  { title: "Стихи", description: "Иногда читаю свои и чужие." },
  { title: "Вера", description: "Важная часть моей жизни. Иногда говорим и об этом." },
  { title: "Бег", description: "Бегаю для себя. Полумарафон уже есть." },
];

export interface ScheduleEntry {
  day: string;
  time: string;
  /** Дни недели в нумерации Date#getDay: 0 — воскресенье. */
  weekdays: number[];
}

/** Обычные дни стримов. Точное время — в Telegram. */
export const schedule: ScheduleEntry[] = [
  { day: "Понедельник", time: "Вечером", weekdays: [1] },
  { day: "Среда", time: "Вечером", weekdays: [3] },
  { day: "Пятница", time: "Вечером", weekdays: [5] },
  { day: "Выходные", time: "Вечером", weekdays: [6, 0] },
];

export const scheduleTitle = "Обычно стримлю вечером";
export const scheduleNote = "Расписание иногда меняется. Точное время пишу в Telegram.";
