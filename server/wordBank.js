// Curated topic -> word pair banks.
// Each pair is [majorityWord, imposterWord] — related but distinct enough
// that the imposter's clue won't obviously mismatch, but not so close
// that voting becomes impossible.
// 8 categories × 25 pairs = 200 total.

export const wordBank = {
  sports: [
    ["Basketball", "Football"],
    ["Tennis", "Badminton"],
    ["Swimming", "Diving"],
    ["Cricket", "Baseball"],
    ["Boxing", "Wrestling"],
    ["Golf", "Archery"],
    ["Volleyball", "Handball"],
    ["Skiing", "Snowboarding"],
    ["Cycling", "Skateboarding"],
    ["Rugby", "American Football"],
    ["Chess", "Carrom"],
    ["Table Tennis", "Squash"],
    ["Hockey", "Lacrosse"],
    ["Marathon", "Triathlon"],
    ["Gymnastics", "Figure Skating"],
    ["Surfing", "Windsurfing"],
    ["Bowling", "Billiards"],
    ["Fencing", "Judo"],
    ["Rowing", "Kayaking"],
    ["Sailing", "Yachting"],
    ["Darts", "Snooker"],
    ["Weightlifting", "Powerlifting"],
    ["Trampoline", "Parkour"],
    ["Curling", "Ice Hockey"],
    ["Polo", "Equestrian"],
  ],
  food: [
    ["Pizza", "Burger"],
    ["Biryani", "Pulao"],
    ["Coffee", "Tea"],
    ["Ice Cream", "Frozen Yogurt"],
    ["Pasta", "Noodles"],
    ["Samosa", "Spring Roll"],
    ["Cake", "Pastry"],
    ["Momos", "Dumplings"],
    ["Sushi", "Sashimi"],
    ["Pancake", "Waffle"],
    ["Sandwich", "Wrap"],
    ["Popcorn", "Nachos"],
    ["Milkshake", "Smoothie"],
    ["Curry", "Stew"],
    ["Donut", "Bagel"],
    ["Taco", "Burrito"],
    ["Soup", "Broth"],
    ["Cupcake", "Muffin"],
    ["Cheese", "Paneer"],
    ["Bread", "Naan"],
    ["Chocolate", "Fudge"],
    ["Pickle", "Chutney"],
    ["Omelette", "Frittata"],
    ["Kebab", "Satay"],
    ["Lassi", "Yogurt Drink"],
  ],
  animals: [
    ["Lion", "Tiger"],
    ["Dog", "Wolf"],
    ["Dolphin", "Shark"],
    ["Eagle", "Hawk"],
    ["Horse", "Zebra"],
    ["Rabbit", "Hare"],
    ["Crocodile", "Alligator"],
    ["Owl", "Falcon"],
    ["Elephant", "Rhino"],
    ["Cat", "Leopard"],
    ["Frog", "Toad"],
    ["Turtle", "Tortoise"],
    ["Bee", "Wasp"],
    ["Penguin", "Puffin"],
    ["Camel", "Llama"],
    ["Deer", "Antelope"],
    ["Monkey", "Chimpanzee"],
    ["Goat", "Sheep"],
    ["Duck", "Goose"],
    ["Squirrel", "Chipmunk"],
    ["Peacock", "Pheasant"],
    ["Snake", "Lizard"],
    ["Butterfly", "Moth"],
    ["Whale", "Orca"],
    ["Parrot", "Cockatoo"],
  ],
  movies_tv: [
    ["Comedy", "Sitcom"],
    ["Thriller", "Horror"],
    ["Documentary", "Biopic"],
    ["Cartoon", "Anime"],
    ["Drama", "Soap Opera"],
    ["Action", "Adventure"],
    ["Musical", "Dance Film"],
    ["Mystery", "Crime Show"],
    ["Fantasy", "Sci-Fi"],
    ["Reality Show", "Game Show"],
    ["Romance", "Rom-Com"],
    ["War Film", "Historical Film"],
    ["Talk Show", "Podcast"],
    ["Sequel", "Spin-off"],
    ["Trailer", "Teaser"],
    ["Blockbuster", "Indie Film"],
    ["Villain", "Antagonist"],
    ["Superhero", "Vigilante"],
    ["Screenplay", "Script"],
    ["Director", "Producer"],
    ["Subtitle", "Dubbing"],
    ["Premiere", "Screening"],
    ["Franchise", "Series"],
    ["Cameo", "Guest Appearance"],
    ["Soundtrack", "Score"],
  ],
  professions: [
    ["Doctor", "Nurse"],
    ["Teacher", "Professor"],
    ["Pilot", "Astronaut"],
    ["Chef", "Baker"],
    ["Police Officer", "Detective"],
    ["Lawyer", "Judge"],
    ["Engineer", "Architect"],
    ["Photographer", "Videographer"],
    ["Farmer", "Gardener"],
    ["Electrician", "Plumber"],
    ["Journalist", "Editor"],
    ["Scientist", "Researcher"],
    ["Dentist", "Surgeon"],
    ["Firefighter", "Paramedic"],
    ["Musician", "Composer"],
    ["Actor", "Director"],
    ["Painter", "Sculptor"],
    ["Accountant", "Banker"],
    ["Salesperson", "Marketer"],
    ["Waiter", "Bartender"],
    ["Tailor", "Designer"],
    ["Librarian", "Curator"],
    ["Mechanic", "Technician"],
    ["Barber", "Hairstylist"],
    ["Coach", "Trainer"],
  ],
  nature: [
    ["Forest", "Jungle"],
    ["Mountain", "Hill"],
    ["River", "Stream"],
    ["Desert", "Dune"],
    ["Volcano", "Geyser"],
    ["Lake", "Pond"],
    ["Waterfall", "Rapids"],
    ["Beach", "Coastline"],
    ["Island", "Peninsula"],
    ["Cave", "Canyon"],
    ["Meadow", "Valley"],
    ["Glacier", "Iceberg"],
    ["Storm", "Hurricane"],
    ["Rainbow", "Sunset"],
    ["Cliff", "Ridge"],
    ["Swamp", "Marsh"],
    ["Reef", "Lagoon"],
    ["Prairie", "Grassland"],
    ["Tundra", "Steppe"],
    ["Fjord", "Bay"],
    ["Oasis", "Spring"],
    ["Avalanche", "Landslide"],
    ["Monsoon", "Drizzle"],
    ["Eclipse", "Aurora"],
    ["Delta", "Estuary"],
  ],
  technology: [
    ["Smartphone", "Tablet"],
    ["Laptop", "Desktop"],
    ["Headphones", "Earbuds"],
    ["Camera", "Camcorder"],
    ["Drone", "Helicopter Toy"],
    ["Smartwatch", "Fitness Band"],
    ["Router", "Modem"],
    ["Keyboard", "Mouse"],
    ["Printer", "Scanner"],
    ["Speaker", "Soundbar"],
    ["Charger", "Power Bank"],
    ["Monitor", "Projector"],
    ["Console", "Controller"],
    ["VR Headset", "3D Glasses"],
    ["Microphone", "Amplifier"],
    ["App", "Software"],
    ["Website", "Blog"],
    ["Password", "PIN"],
    ["Cloud Storage", "Hard Drive"],
    ["Wi-Fi", "Bluetooth"],
    ["Robot", "AI Assistant"],
    ["Chip", "Processor"],
    ["Battery", "Solar Panel"],
    ["Firewall", "Antivirus"],
    ["QR Code", "Barcode"],
  ],
  space: [
    ["Planet", "Moon"],
    ["Astronaut", "Cosmonaut"],
    ["Rocket", "Satellite"],
    ["Star", "Comet"],
    ["Galaxy", "Nebula"],
    ["Telescope", "Binoculars"],
    ["Meteor", "Asteroid"],
    ["Spacecraft", "Space Station"],
    ["Black Hole", "Wormhole"],
    ["Sun", "Supernova"],
    ["Orbit", "Rotation"],
    ["Alien", "UFO"],
    ["Mars", "Jupiter"],
    ["Constellation", "Zodiac"],
    ["Spacesuit", "Helmet"],
    ["Gravity", "Magnetism"],
    ["Milky Way", "Andromeda"],
    ["Solar Eclipse", "Lunar Eclipse"],
    ["Space Shuttle", "Capsule"],
    ["Meteorite", "Fireball"],
    ["Cosmic Ray", "Radiation"],
    ["Light Year", "Parsec"],
    ["Mission Control", "Launch Pad"],
    ["Rover", "Lander"],
    ["Big Bang", "Expansion"],
  ],
};

// ─── Per-topic used-pair tracking ─────────────────────────────────────────────
// usedIndexes is a Map<topic, Set<number>> stored on the room object.
// Once all indexes in a topic are exhausted, the set resets so pairs can repeat.

export function pickPairNoRepeat(topic, usedIndexes) {
  const pairs = wordBank[topic];
  if (!pairs || pairs.length === 0) return null;

  if (!usedIndexes.has(topic)) usedIndexes.set(topic, new Set());
  const used = usedIndexes.get(topic);

  // Reset when all pairs in this topic have been used
  if (used.size >= pairs.length) used.clear();

  // Pick a random index not yet used
  let idx;
  do {
    idx = Math.floor(Math.random() * pairs.length);
  } while (used.has(idx));

  used.add(idx);
  const [majorityWord, imposterWord] = pairs[idx];
  return { majorityWord, imposterWord };
}

// Legacy helper (still used for any code that doesn't pass usedIndexes)
export function pickRandomPair(topic) {
  return pickPairNoRepeat(topic, new Map());
}

export function topicList() {
  return Object.keys(wordBank);
}

export function pickRandomPairFromTopics(topics) {
  if (!topics || topics.length === 0) return null;
  const topic = topics[Math.floor(Math.random() * topics.length)];
  const pair  = pickRandomPair(topic);
  return pair ? { ...pair, topic } : null;
}
