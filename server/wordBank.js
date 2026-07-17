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
  ],
  food: [
    ["Pizza", "Burger"],
    ["Biryani", "Pulao"],
    ["Coffee", "Tea"],
    ["Ice Cream", "Frozen Yogurt"],
    ["Pasta", "Noodles"],
    ["Samosa", "Spring Roll"],
  ],
  animals: [
    ["Lion", "Tiger"],
    ["Dog", "Wolf"],
    ["Dolphin", "Shark"],
    ["Eagle", "Hawk"],
    ["Horse", "Zebra"],
    ["Rabbit", "Hare"],
  ],
  movies_tv: [
    ["Comedy", "Sitcom"],
    ["Thriller", "Horror"],
    ["Documentary", "Biopic"],
    ["Cartoon", "Anime"],
  ],
  professions: [
    ["Doctor", "Nurse"],
    ["Teacher", "Professor"],
    ["Pilot", "Astronaut"],
    ["Chef", "Baker"],
    ["Police Officer", "Detective"],
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
