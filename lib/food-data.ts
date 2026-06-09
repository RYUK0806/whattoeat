export type Mood = "hungry" | "lazy" | "spicy" | "healthy";
export type Budget = "100-200" | "200-400" | "400+";
export type Preference = "veg" | "non-veg" | "vegan";

export interface FoodItem {
  name: string;
  emoji: string;
  oneLiner: string;
  moods: Mood[];
  budgets: Budget[];
  preferences: Preference[];
}

export const foodData: FoodItem[] = [
  // VEG + VEGAN items
  {
    name: "Masala Dosa",
    emoji: "🫓",
    oneLiner: "South India's answer to the burrito, and honestly it wins.",
    moods: ["hungry", "lazy"],
    budgets: ["100-200"],
    preferences: ["veg", "vegan"],
  },
  {
    name: "Chole Bhature",
    emoji: "🍞",
    oneLiner: "Comfort food so good it could fix a Monday.",
    moods: ["hungry"],
    budgets: ["100-200", "200-400"],
    preferences: ["veg", "vegan"],
  },
  {
    name: "Pav Bhaji",
    emoji: "🫙",
    oneLiner: "Mumbai street food that slaps at every time of day.",
    moods: ["hungry", "lazy"],
    budgets: ["100-200"],
    preferences: ["veg"],
  },
  {
    name: "Paneer Butter Masala",
    emoji: "🧀",
    oneLiner: "Paneer in a buttery hug — restaurant-level therapy.",
    moods: ["hungry"],
    budgets: ["200-400", "400+"],
    preferences: ["veg"],
  },
  {
    name: "Veggie Burger",
    emoji: "🍔",
    oneLiner: "Plants never tasted this rebellious.",
    moods: ["lazy", "healthy"],
    budgets: ["100-200", "200-400"],
    preferences: ["veg", "vegan"],
  },
  {
    name: "Idli Sambar",
    emoji: "🥣",
    oneLiner: "Soft, wholesome, and your stomach will thank you.",
    moods: ["lazy", "healthy"],
    budgets: ["100-200"],
    preferences: ["veg", "vegan"],
  },
  {
    name: "Poha",
    emoji: "🍚",
    oneLiner: "Light as a cloud but hits different when hungry.",
    moods: ["lazy", "healthy"],
    budgets: ["100-200"],
    preferences: ["veg", "vegan"],
  },
  {
    name: "Aloo Paratha",
    emoji: "🫓",
    oneLiner: "Carbs + butter = peak happiness mathematics.",
    moods: ["hungry", "lazy"],
    budgets: ["100-200"],
    preferences: ["veg"],
  },
  {
    name: "Veg Biryani",
    emoji: "🍛",
    oneLiner: "Fragrant rice that makes you feel like royalty.",
    moods: ["hungry"],
    budgets: ["200-400", "400+"],
    preferences: ["veg", "vegan"],
  },
  {
    name: "Palak Paneer",
    emoji: "🥬",
    oneLiner: "Popeye was onto something — spinach never tasted this rich.",
    moods: ["healthy"],
    budgets: ["200-400", "400+"],
    preferences: ["veg"],
  },
  {
    name: "Greek Salad Bowl",
    emoji: "🥗",
    oneLiner: "Eating healthy never looked this aesthetic.",
    moods: ["healthy"],
    budgets: ["200-400", "400+"],
    preferences: ["veg", "vegan"],
  },
  {
    name: "Fruit Bowl",
    emoji: "🍑",
    oneLiner: "Nature's candy in a bowl — no guilt, all gain.",
    moods: ["healthy"],
    budgets: ["100-200"],
    preferences: ["veg", "vegan"],
  },
  {
    name: "Sprouts Chaat",
    emoji: "🌱",
    oneLiner: "Tiny health bombs that hit like a snack.",
    moods: ["healthy"],
    budgets: ["100-200"],
    preferences: ["veg", "vegan"],
  },
  {
    name: "Avocado Toast",
    emoji: "🥑",
    oneLiner: "Basic? Maybe. Delicious? Absolutely.",
    moods: ["healthy", "lazy"],
    budgets: ["200-400"],
    preferences: ["veg", "vegan"],
  },
  {
    name: "Veg Schezwan Noodles",
    emoji: "🍜",
    oneLiner: "Your mouth will be on fire and you'll love every second.",
    moods: ["spicy", "lazy"],
    budgets: ["100-200", "200-400"],
    preferences: ["veg", "vegan"],
  },
  {
    name: "Paneer Chilli",
    emoji: "🌶️",
    oneLiner: "Spicy, tangy, and dangerously addictive.",
    moods: ["spicy"],
    budgets: ["200-400", "400+"],
    preferences: ["veg"],
  },
  {
    name: "Mirchi Bajji",
    emoji: "🌶️",
    oneLiner: "Deep-fried spice grenades — you've been warned.",
    moods: ["spicy"],
    budgets: ["100-200"],
    preferences: ["veg", "vegan"],
  },
  {
    name: "Masala Maggi",
    emoji: "🍝",
    oneLiner: "2-minute wonder that fixed a million bad days.",
    moods: ["lazy"],
    budgets: ["100-200"],
    preferences: ["veg"],
  },
  {
    name: "Upma",
    emoji: "🫕",
    oneLiner: "Underrated breakfast MVP — respect the semolina.",
    moods: ["lazy", "healthy"],
    budgets: ["100-200"],
    preferences: ["veg", "vegan"],
  },
  {
    name: "Dal Makhani",
    emoji: "🫘",
    oneLiner: "Slow-cooked love in a bowl — grandma would approve.",
    moods: ["hungry", "healthy"],
    budgets: ["200-400", "400+"],
    preferences: ["veg"],
  },
  {
    name: "Quinoa Buddha Bowl",
    emoji: "🥙",
    oneLiner: "Eat like you have a Peloton even if you don't.",
    moods: ["healthy"],
    budgets: ["400+"],
    preferences: ["veg", "vegan"],
  },
  // NON-VEG items
  {
    name: "Chicken Biryani",
    emoji: "🍗",
    oneLiner: "The dish that ends all food debates.",
    moods: ["hungry"],
    budgets: ["200-400", "400+"],
    preferences: ["non-veg"],
  },
  {
    name: "Butter Chicken",
    emoji: "🍲",
    oneLiner: "Rich, creamy, and basically a warm hug on a plate.",
    moods: ["hungry"],
    budgets: ["200-400", "400+"],
    preferences: ["non-veg"],
  },
  {
    name: "Egg Bhurji",
    emoji: "🍳",
    oneLiner: "Scrambled eggs' spicy desi cousin who travels.",
    moods: ["lazy", "hungry"],
    budgets: ["100-200"],
    preferences: ["non-veg"],
  },
  {
    name: "Chicken Roll",
    emoji: "🌯",
    oneLiner: "Street food that hits different at 2 PM.",
    moods: ["lazy", "hungry"],
    budgets: ["100-200", "200-400"],
    preferences: ["non-veg"],
  },
  {
    name: "Fish Tacos",
    emoji: "🌮",
    oneLiner: "Beach vibes in every bite — no passport needed.",
    moods: ["hungry"],
    budgets: ["200-400", "400+"],
    preferences: ["non-veg"],
  },
  {
    name: "Chicken Tikka",
    emoji: "🍢",
    oneLiner: "Grilled, smoky, slightly charred — perfection.",
    moods: ["hungry", "healthy"],
    budgets: ["200-400", "400+"],
    preferences: ["non-veg"],
  },
  {
    name: "Spicy Chicken Wings",
    emoji: "🍗",
    oneLiner: "Messy fingers, zero regrets.",
    moods: ["spicy"],
    budgets: ["200-400", "400+"],
    preferences: ["non-veg"],
  },
  {
    name: "Mutton Keema Pav",
    emoji: "🥩",
    oneLiner: "Spiced mince + soft pav = street food nirvana.",
    moods: ["spicy", "hungry"],
    budgets: ["200-400"],
    preferences: ["non-veg"],
  },
  {
    name: "Grilled Chicken Salad",
    emoji: "🥗",
    oneLiner: "Eating clean never felt this satisfying.",
    moods: ["healthy"],
    budgets: ["200-400", "400+"],
    preferences: ["non-veg"],
  },
  {
    name: "Egg Fried Rice",
    emoji: "🍳",
    oneLiner: "Last-resort meal that somehow always slaps.",
    moods: ["lazy"],
    budgets: ["100-200", "200-400"],
    preferences: ["non-veg"],
  },
  {
    name: "Prawn Curry",
    emoji: "🦐",
    oneLiner: "Coastal vibes so strong you'll hear waves.",
    moods: ["hungry"],
    budgets: ["400+"],
    preferences: ["non-veg"],
  },
  {
    name: "Spicy Andhra Chicken",
    emoji: "🌶️",
    oneLiner: "Legendary heat that legends are made of.",
    moods: ["spicy"],
    budgets: ["200-400", "400+"],
    preferences: ["non-veg"],
  },
  {
    name: "Keema Maggi",
    emoji: "🍝",
    oneLiner: "2-minute noodles leveled up for meat lovers.",
    moods: ["lazy", "spicy"],
    budgets: ["100-200"],
    preferences: ["non-veg"],
  },
];

export function getSuggestions(
  mood: Mood,
  budget: Budget,
  preference: Preference
): FoodItem[] {
  const filtered = foodData.filter(
    (item) =>
      item.moods.includes(mood) &&
      item.budgets.includes(budget) &&
      item.preferences.includes(preference)
  );

  // Shuffle and pick 3
  const shuffled = [...filtered].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 3);
}
