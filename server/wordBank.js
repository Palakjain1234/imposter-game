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

// ─── Hints — one per pair (same index as wordBank[topic][N]) ─────────────────
// Format: placeholder hints the user can bulk-replace with real clues later.
// Each hint describes the CATEGORY context, not the specific word — it helps
// the imposter blend in without giving away the majority word.
export const wordHints = {
  sports: [
    "Sports clue · #0",   // Basketball / Football
    "Sports clue · #1",   // Tennis / Badminton
    "Sports clue · #2",   // Swimming / Diving
    "Sports clue · #3",   // Cricket / Baseball
    "Sports clue · #4",   // Boxing / Wrestling
    "Sports clue · #5",   // Golf / Archery
    "Sports clue · #6",   // Volleyball / Handball
    "Sports clue · #7",   // Skiing / Snowboarding
    "Sports clue · #8",   // Cycling / Skateboarding
    "Sports clue · #9",   // Rugby / American Football
    "Sports clue · #10",  // Chess / Carrom
    "Sports clue · #11",  // Table Tennis / Squash
    "Sports clue · #12",  // Hockey / Lacrosse
    "Sports clue · #13",  // Marathon / Triathlon
    "Sports clue · #14",  // Gymnastics / Figure Skating
    "Sports clue · #15",  // Surfing / Windsurfing
    "Sports clue · #16",  // Bowling / Billiards
    "Sports clue · #17",  // Fencing / Judo
    "Sports clue · #18",  // Rowing / Kayaking
    "Sports clue · #19",  // Sailing / Yachting
    "Sports clue · #20",  // Darts / Snooker
    "Sports clue · #21",  // Weightlifting / Powerlifting
    "Sports clue · #22",  // Trampoline / Parkour
    "Sports clue · #23",  // Curling / Ice Hockey
    "Sports clue · #24",  // Polo / Equestrian
  ],
  food: [
    "Food clue · #0",
    "Food clue · #1",
    "Food clue · #2",
    "Food clue · #3",
    "Food clue · #4",
    "Food clue · #5",
    "Food clue · #6",
    "Food clue · #7",
    "Food clue · #8",
    "Food clue · #9",
    "Food clue · #10",
    "Food clue · #11",
    "Food clue · #12",
    "Food clue · #13",
    "Food clue · #14",
    "Food clue · #15",
    "Food clue · #16",
    "Food clue · #17",
    "Food clue · #18",
    "Food clue · #19",
    "Food clue · #20",
    "Food clue · #21",
    "Food clue · #22",
    "Food clue · #23",
    "Food clue · #24",
  ],
  animals: [
    "Animals clue · #0",
    "Animals clue · #1",
    "Animals clue · #2",
    "Animals clue · #3",
    "Animals clue · #4",
    "Animals clue · #5",
    "Animals clue · #6",
    "Animals clue · #7",
    "Animals clue · #8",
    "Animals clue · #9",
    "Animals clue · #10",
    "Animals clue · #11",
    "Animals clue · #12",
    "Animals clue · #13",
    "Animals clue · #14",
    "Animals clue · #15",
    "Animals clue · #16",
    "Animals clue · #17",
    "Animals clue · #18",
    "Animals clue · #19",
    "Animals clue · #20",
    "Animals clue · #21",
    "Animals clue · #22",
    "Animals clue · #23",
    "Animals clue · #24",
  ],
  movies_tv: [
    "Movies & TV clue · #0",
    "Movies & TV clue · #1",
    "Movies & TV clue · #2",
    "Movies & TV clue · #3",
    "Movies & TV clue · #4",
    "Movies & TV clue · #5",
    "Movies & TV clue · #6",
    "Movies & TV clue · #7",
    "Movies & TV clue · #8",
    "Movies & TV clue · #9",
    "Movies & TV clue · #10",
    "Movies & TV clue · #11",
    "Movies & TV clue · #12",
    "Movies & TV clue · #13",
    "Movies & TV clue · #14",
    "Movies & TV clue · #15",
    "Movies & TV clue · #16",
    "Movies & TV clue · #17",
    "Movies & TV clue · #18",
    "Movies & TV clue · #19",
    "Movies & TV clue · #20",
    "Movies & TV clue · #21",
    "Movies & TV clue · #22",
    "Movies & TV clue · #23",
    "Movies & TV clue · #24",
  ],
  professions: [
    "Professions clue · #0",
    "Professions clue · #1",
    "Professions clue · #2",
    "Professions clue · #3",
    "Professions clue · #4",
    "Professions clue · #5",
    "Professions clue · #6",
    "Professions clue · #7",
    "Professions clue · #8",
    "Professions clue · #9",
    "Professions clue · #10",
    "Professions clue · #11",
    "Professions clue · #12",
    "Professions clue · #13",
    "Professions clue · #14",
    "Professions clue · #15",
    "Professions clue · #16",
    "Professions clue · #17",
    "Professions clue · #18",
    "Professions clue · #19",
    "Professions clue · #20",
    "Professions clue · #21",
    "Professions clue · #22",
    "Professions clue · #23",
    "Professions clue · #24",
  ],
  nature: [
    "Nature clue · #0",
    "Nature clue · #1",
    "Nature clue · #2",
    "Nature clue · #3",
    "Nature clue · #4",
    "Nature clue · #5",
    "Nature clue · #6",
    "Nature clue · #7",
    "Nature clue · #8",
    "Nature clue · #9",
    "Nature clue · #10",
    "Nature clue · #11",
    "Nature clue · #12",
    "Nature clue · #13",
    "Nature clue · #14",
    "Nature clue · #15",
    "Nature clue · #16",
    "Nature clue · #17",
    "Nature clue · #18",
    "Nature clue · #19",
    "Nature clue · #20",
    "Nature clue · #21",
    "Nature clue · #22",
    "Nature clue · #23",
    "Nature clue · #24",
  ],
  technology: [
    "Technology clue · #0",
    "Technology clue · #1",
    "Technology clue · #2",
    "Technology clue · #3",
    "Technology clue · #4",
    "Technology clue · #5",
    "Technology clue · #6",
    "Technology clue · #7",
    "Technology clue · #8",
    "Technology clue · #9",
    "Technology clue · #10",
    "Technology clue · #11",
    "Technology clue · #12",
    "Technology clue · #13",
    "Technology clue · #14",
    "Technology clue · #15",
    "Technology clue · #16",
    "Technology clue · #17",
    "Technology clue · #18",
    "Technology clue · #19",
    "Technology clue · #20",
    "Technology clue · #21",
    "Technology clue · #22",
    "Technology clue · #23",
    "Technology clue · #24",
  ],
  space: [
    "Space clue · #0",
    "Space clue · #1",
    "Space clue · #2",
    "Space clue · #3",
    "Space clue · #4",
    "Space clue · #5",
    "Space clue · #6",
    "Space clue · #7",
    "Space clue · #8",
    "Space clue · #9",
    "Space clue · #10",
    "Space clue · #11",
    "Space clue · #12",
    "Space clue · #13",
    "Space clue · #14",
    "Space clue · #15",
    "Space clue · #16",
    "Space clue · #17",
    "Space clue · #18",
    "Space clue · #19",
    "Space clue · #20",
    "Space clue · #21",
    "Space clue · #22",
    "Space clue · #23",
    "Space clue · #24",
  ],
};

// Returns the hint string for a given topic + pair index (null if not found).
export function getHint(topic, pairIndex) {
  return wordHints[topic]?.[pairIndex] ?? null;
}

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
  // Return pairIndex so caller can look up hints
  return { majorityWord, imposterWord, pairIndex: idx };
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
