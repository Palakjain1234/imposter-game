// Curated topic -> word pair banks.
// Each pair is [majorityWord, imposterWord] — related but distinct enough
// that the imposter's clue won't obviously mismatch, but not so close
// that voting becomes impossible.
export const wordBank = {
  sports: [
    ["Basketball", "Football"],
    ["Basketball", "Volleyball"],
    ["Tennis", "Badminton"],
    ["Swimming", "Diving"],
    ["Cricket", "Baseball"],
    ["Boxing", "Wrestling"],
    ["Cycling", "Skateboarding"],
    ["Golf", "Croquet"],
  ],
  food: [
    ["Pizza", "Burger"],
    ["Biryani", "Pulao"],
    ["Coffee", "Tea"],
    ["Ice Cream", "Frozen Yogurt"],
    ["Pasta", "Noodles"],
    ["Samosa", "Spring Roll"],
    ["Croissant", "Bagel"],
    ["Sushi", "Sashimi"],
  ],
  animals: [
    ["Lion", "Tiger"],
    ["Dog", "Wolf"],
    ["Dolphin", "Shark"],
    ["Eagle", "Hawk"],
    ["Horse", "Zebra"],
    ["Rabbit", "Hare"],
    ["Crocodile", "Alligator"],
    ["Penguin", "Puffin"],
  ],
  movies_tv: [
    ["Comedy", "Sitcom"],
    ["Thriller", "Horror"],
    ["Documentary", "Biopic"],
    ["Cartoon", "Anime"],
    ["Sequel", "Remake"],
    ["Streaming", "Cable"],
    ["Director", "Producer"],
  ],
  professions: [
    ["Doctor", "Nurse"],
    ["Teacher", "Professor"],
    ["Pilot", "Astronaut"],
    ["Chef", "Baker"],
    ["Police Officer", "Detective"],
    ["Architect", "Engineer"],
    ["Journalist", "Reporter"],
    ["Lawyer", "Judge"],
  ],
  nature: [
    ["Mountain", "Volcano"],
    ["River", "Lake"],
    ["Forest", "Jungle"],
    ["Desert", "Savanna"],
    ["Ocean", "Sea"],
    ["Cave", "Cavern"],
    ["Waterfall", "Rapids"],
    ["Glacier", "Iceberg"],
  ],
  technology: [
    ["Laptop", "Tablet"],
    ["Wi-Fi", "Bluetooth"],
    ["App", "Software"],
    ["Robot", "Drone"],
    ["Password", "PIN"],
    ["Podcast", "Audiobook"],
    ["Streaming", "Downloading"],
    ["Keyboard", "Touchscreen"],
  ],
  party: [
    ["Birthday", "Anniversary"],
    ["DJ", "Live Band"],
    ["Karaoke", "Open Mic"],
    ["Costume", "Uniform"],
    ["Confetti", "Streamers"],
    ["Cocktail", "Mocktail"],
    ["Photo Booth", "Selfie"],
    ["Dance Floor", "Stage"],
  ],
};

export function pickRandomPair(topic) {
  const pairs = wordBank[topic];
  if (!pairs || pairs.length === 0) return null;
  const [majorityWord, imposterWord] = pairs[Math.floor(Math.random() * pairs.length)];
  return { majorityWord, imposterWord };
}

export function topicList() {
  return Object.keys(wordBank);
}

// Pick a topic from a list at random, then pick a word pair from it.
export function pickRandomPairFromTopics(topics) {
  if (!topics || topics.length === 0) return null;
  const topic = topics[Math.floor(Math.random() * topics.length)];
  const pair  = pickRandomPair(topic);
  return pair ? { ...pair, topic } : null;
}
