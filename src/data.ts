import { ShopItem, Achievement } from './types';

export const SHOP_ITEMS: ShopItem[] = [
  { id: 'crown', name: 'Şampiyon Tacı', emoji: '👑', cost: 15, type: 'hat', description: 'Hakiki bir lider için altın taç!' },
  { id: 'glasses', name: 'Havalı Gözlük', emoji: '🕶️', cost: 8, type: 'glasses', description: 'Aşırı derece karizma kazandırır.' },
  { id: 'sheriff', name: 'Şerif Şapkası', emoji: '🤠', cost: 12, type: 'hat', description: 'Kasabanın yeni kanun koruyucusu!' },
  { id: 'wizard', name: 'Sihirbaz Şapkası', emoji: '🎩', cost: 20, type: 'hat', description: 'Rakipleri büyülemek isteyenlere.' },
  { id: 'pink_bow', name: 'Sevimli Fiyonk', emoji: '🎀', cost: 5, type: 'badge', description: 'Ekstra tatlılık katmak isteyenlere.' },
  { id: 'headphones', name: 'Oyuncu Kulaklığı', emoji: '🎧', cost: 18, type: 'glasses', description: 'Yüksek kaliteli ses ve odaklanma.' },
  { id: 'horn', name: 'Tekboynuz Boynuzu', emoji: '🦄', cost: 22, type: 'hat', description: 'Efsanevi mitolojik bir güç.' },
  { id: 'ninja', name: 'Siyah Ninja Maskesi', emoji: '🥷', cost: 25, type: 'mask', description: 'Görünmez ol, sessizce oyna!' },
  { id: 'angel', name: 'Melek Halesi', emoji: '😇', cost: 30, type: 'hat', description: 'Altın renkli saf melek parıltısı.' }
];

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'balloon_wins_5',
    name: 'Balon Şampiyonu',
    description: 'Balon şişirme oyununda 5 kez zafer kazan.',
    badgeEmoji: '🎈🏆',
    category: 'balloon'
  },
  {
    id: 'perfect_memory',
    name: 'Kusursuz Akıl',
    description: 'Hafıza kartı elinde en az 2 eşleşme bulurken 0 hata (mismatch) yap.',
    badgeEmoji: '🧠💯',
    category: 'memory'
  },
  {
    id: 'speed_demon_220',
    name: 'Işık Hızı',
    description: 'Reaksiyon oyununda ganimeti 250ms altı sürede kap.',
    badgeEmoji: '⚡🚀',
    category: 'reaction'
  },
  {
    id: 'streak_3',
    name: 'Sadık Oyuncu',
    description: 'Günlük girişte en az 3 günlük bir seri (streak) yakala.',
    badgeEmoji: '🔥📆',
    category: 'streak'
  },
  {
    id: 'coin_lord_100',
    name: 'Zenginlik Simgesi',
    description: 'Toplamda 100 altın coine (küresek birikim) ulaş.',
    badgeEmoji: '💎💰',
    category: 'rich'
  },
  {
    id: 'collector_3',
    name: 'Moda İkonu',
    description: 'Kostüm Mağazasında en az 3 aksesuar aç.',
    badgeEmoji: '👑🕶️',
    category: 'shop'
  }
];

export const AVATARS = [
  { name: 'Ateş Topu', emoji: '🔥', description: 'Hızlı ve yakıcı!' },
  { name: 'Su Damlası', emoji: '💧', description: 'Sakin ama dalgalı!' },
  { name: 'Rüzgar Gülü', emoji: '🌀', description: 'Tahmin edilemez esinti!' },
  { name: 'Yıldırım', emoji: '⚡', description: 'Göz açıp kapayıncaya kadar!' },
  { name: 'Orman Şamanı', emoji: '🌿', description: 'Doğanın öfkesi!' },
  { name: 'Altın Taç', emoji: '👑', description: 'Asil bir şampiyon!' },
  { name: 'Demir Kalkan', emoji: '🛡️', description: 'Yıkılmaz savunma!' },
  { name: 'Uzay Roketi', emoji: '🚀', description: 'Sınırların ötesinde!' }
];
