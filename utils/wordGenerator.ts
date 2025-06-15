// Common English words for the game
const words = [
  // Short words (3-4 letters)
  'ace', 'art', 'ash', 'awe', 'axe', 'bay', 'bee', 'bud', 'cog', 'coy',
  'dew', 'dig', 'dip', 'ebb', 'elf', 'elk', 'elm', 'eon', 'era', 'eve',
  'fad', 'fin', 'fir', 'fix', 'fog', 'fox', 'fry', 'fun', 'fur', 'gap',
  'gem', 'gin', 'gum', 'hue', 'ice', 'imp', 'ink', 'ion', 'ivy', 'jab',
  'jam', 'jar', 'jaw', 'jet', 'jig', 'jot', 'joy', 'jug', 'keg', 'key',
  'kin', 'kit', 'lab', 'lag', 'lap', 'law', 'lay', 'lid', 'lip', 'log',
  'lux', 'map', 'mix', 'nap', 'net', 'nod', 'oak', 'odd', 'oil', 'orb',
  'ore', 'owl', 'paw', 'peg', 'pen', 'pep', 'pet', 'pie', 'pin', 'pit',
  'pod', 'pop', 'pry', 'pug', 'pun', 'pup', 'rag', 'ram', 'rap', 'ray',
  'rib', 'rim', 'rip', 'rob', 'rod', 'rot', 'row', 'rub', 'rug', 'rum',
  'rye', 'sap', 'saw', 'sea', 'set', 'sew', 'shy', 'sip', 'ski', 'sky',
  'sly', 'sob', 'soy', 'spa', 'spy', 'sum', 'sun', 'tab', 'tag', 'tan',
  'tap', 'tar', 'tax', 'tea', 'tie', 'tin', 'tip', 'toe', 'top', 'tug',
  'van', 'vat', 'vex', 'vie', 'vim', 'vow', 'wad', 'wag', 'war', 'wax',
  'web', 'wed', 'wee', 'wig', 'win', 'wit', 'woe', 'wok', 'yak', 'yam',
  'yap', 'yaw', 'yen', 'yew', 'zip', 'zoo',

  // Medium words (5-6 letters)
  'abyss', 'acute', 'agile', 'amber', 'amble', 'ample', 'angel', 'anvil', 'aorta', 'apron',
  'arbor', 'ardor', 'arena', 'aroma', 'arrow', 'aspen', 'atoll', 'avert', 'azure', 'bacon',
  'badge', 'bagel', 'balmy', 'banjo', 'barge', 'baron', 'basil', 'batch', 'bayou', 'beach',
  'bison', 'blaze', 'bliss', 'bloom', 'bluff', 'blunt', 'boost', 'braid', 'brisk', 'broil',
  'brook', 'broth', 'brute', 'budge', 'bulge', 'bumpy', 'bunch', 'burst', 'cabin', 'cadet',
  'camel', 'canal', 'candy', 'caper', 'cargo', 'carol', 'carve', 'cedar', 'cello', 'champ',
  'charm', 'chase', 'check', 'chess', 'chief', 'chime', 'cider', 'cigar', 'civic', 'clamp',
  'clasp', 'clave', 'cleft', 'cliff', 'climb', 'cling', 'cloud', 'clove', 'coast', 'cobra',
  'cocoa', 'comet', 'coral', 'coven', 'craft', 'cramp', 'crank', 'crate', 'crest', 'crick',
  'crisp', 'croft', 'crust', 'crypt', 'cubic', 'cumin', 'curio', 'curly', 'curry', 'cycle',
  'daisy', 'dance', 'denim', 'depth', 'derby', 'diner', 'dingo', 'dirge', 'disco', 'ditch',
  'diver', 'dizzy', 'dodge', 'dogma', 'dough', 'dowry', 'drake', 'drawl', 'dream', 'drift',
  'drill', 'drink', 'drive', 'drone', 'druid', 'drums', 'duchy', 'dully', 'dusky', 'dusty',
  'dwarf', 'dwell', 'eagle', 'earth', 'ebony', 'edict', 'elbow', 'elder', 'elect', 'elegy',
  'elfin', 'elite', 'email', 'embed', 'ember', 'empty', 'enact', 'endow', 'enjoy', 'ensue',
  'entry', 'envoy', 'epoch', 'equal', 'equip', 'erase', 'erode', 'error', 'erupt', 'essay',
  'ethic', 'ethos', 'evade', 'event', 'evoke', 'exact', 'exalt', 'excel', 'exert', 'exile',
  'exist', 'expel', 'extol', 'extra', 'exult', 'fable', 'facet', 'fairy', 'faith', 'fancy',
  'fatal', 'feast', 'fecal', 'feign', 'fella', 'felon', 'femur', 'fence', 'feral', 'ferry',
  'fetal', 'fetch', 'fever', 'fiber', 'field', 'fiery', 'fifth', 'filch', 'filet', 'filly',

  // Long words (7+ letters)
  'abandon', 'abashed', 'abolish', 'abscond', 'absence', 'absolve', 'absorb', 'abstain', 'abstract', 'abstruse',
  'abundant', 'accolade', 'acclaim', 'acerbic', 'achieve', 'acoustic', 'acquaint', 'acquire', 'acrobat', 'acronym',
  'acumen', 'adamant', 'adaptive', 'addendum', 'adhesive', 'adjacent', 'adjunct', 'admiral', 'admirer', 'admonish',
  'adorable', 'adrenal', 'advance', 'adverse', 'advocate', 'aerobic', 'aerosol', 'affable', 'affirm', 'affluent',
  'aggravate', 'agitate', 'agonize', 'agreeable', 'ailment', 'alabaster', 'alchemy', 'alcohol', 'alcove', 'algebra',
  'algorithm', 'alienate', 'alimony', 'alkaline', 'allegory', 'allergic', 'alliance', 'allocate', 'alluring', 'almanac',
  'alphabet', 'altitude', 'altruism', 'amalgam', 'amaranth', 'amateur', 'ambiance', 'ambition', 'ambulance', 'amethyst',
  'amnesty', 'amorphous', 'amplify', 'analgesic', 'analogue', 'analysis', 'anarchy', 'anatomy', 'ancestor', 'anchovy',
  'anecdote', 'aneurysm', 'animosity', 'annotate', 'announce', 'annuity', 'anomaly', 'anonymous', 'antacid', 'antenna',
  'antidote', 'antigen', 'antique', 'antonym', 'anxiety', 'apathetic', 'aperture', 'apologize', 'apostle', 'apparatus',
  'apparent', 'appetite', 'applaud', 'appoint', 'appraise', 'approach', 'approval', 'aquarium', 'aquatic', 'aqueduct',
  'arbitrary', 'arboreal', 'arcane', 'archaic', 'archetype', 'architect', 'archive', 'arduous', 'argonaut', 'argument',
  'armament', 'aromatic', 'arraign', 'arrange', 'arrears', 'arrival', 'arrogant', 'arterial', 'artifact', 'artisan',
  'artistic', 'ascend', 'ascetic', 'asphalt', 'aspirin', 'assemble', 'assertive', 'assessment', 'asteroid', 'asthma',
  'astound', 'astrology', 'astronomy', 'athletic', 'atmosphere', 'atrophy', 'attentive', 'attitude', 'attribute', 'auction',
  'audacious', 'audience', 'augment', 'auspicious', 'austere', 'authentic', 'automate', 'autonomy', 'autopsy', 'auxiliary',
  'avalanche', 'avenge', 'aversion', 'aviation', 'avocado', 'avoidance', 'awaken', 'awesome', 'awkward', 'axiom',
  'babble', 'bachelor', 'backbone', 'bacteria', 'baffle', 'balance', 'balcony', 'ballad', 'ballast', 'balloon',
  'ballroom', 'bamboo', 'bandage', 'bandit', 'banish', 'banquet', 'baptism', 'barbecue', 'bargain', 'baroque',
  'barricade', 'barrier', 'bassoon', 'battery', 'bayonet', 'bazaar', 'beatify', 'beautiful', 'beckon', 'bedlam',
  'beggar', 'beguile', 'behavior', 'belated', 'believe', 'bellicose', 'belligerent', 'beneficial', 'benevolent', 'benign',
  'bereave', 'berserk', 'bestial', 'bewilder', 'bicycle', 'bifocal', 'bilingual', 'billionaire', 'binocular', 'biology',
  'biosphere', 'birthday', 'biscuit', 'bizarre', 'blanket', 'blatant', 'blazing', 'bleach', 'blemish', 'blender',
  'blithe', 'bloated', 'blockade', 'blossom', 'blueprint', 'blunder', 'blurry', 'boastful', 'bodyguard', 'bohemian',
  'boisterous', 'bolster', 'bombard', 'bonanza', 'bookworm', 'boredom', 'botanical', 'boulder', 'boundary', 'bourbon',
  'boutique', 'bovine', 'bracket', 'bramble', 'bravado', 'brewery', 'bribery', 'brigade', 'brilliant', 'brimstone',
  'broccoli', 'brochure', 'broker', 'bronchial', 'bronze', 'bruise', 'brunette', 'brusque', 'bubble', 'buffalo',
  'bulwark', 'bungle', 'buoyant', 'burden', 'burgeon', 'burlap', 'burnish', 'burrow', 'bustle', 'butterfly',
  'buttress', 'buzzard', 'byline', 'byproduct', 'bystander', 'cabaret', 'cabinet', 'cacophony', 'cadence', 'caffeine',
  'calculate', 'calendar', 'caliber', 'calliope', 'callous', 'calorie', 'calypso', 'camouflage', 'campaign', 'canary',
  'candid', 'cannibal', 'cannon', 'canopy', 'cantata', 'canvas', 'capable', 'capacity', 'capillary', 'capital',
  'capsule', 'caption', 'captivate', 'caravan', 'cardiac', 'cardinal', 'carefree', 'careful', 'caricature', 'carnival',
  'carousel', 'cascade', 'cashew', 'cassette', 'casual', 'catalyst', 'catapult', 'cataract', 'catchy', 'category',
  'cathedral', 'caustic', 'caution', 'cavalry', 'caviar', 'cavity', 'celebrate', 'celery', 'celestial', 'celibate',
  'cemetery', 'censure', 'centaur', 'century', 'ceramic', 'cerebral', 'certain', 'certify', 'chagrin', 'challenge',
  'chamber', 'champion', 'channel', 'chaotic', 'chapter', 'character', 'charade', 'charcoal', 'charisma', 'charity',
  'charlatan', 'charter', 'chastise', 'chatter', 'cheerful', 'chemical', 'cherish', 'cherub', 'chicken', 'chieftain',
  'chimera', 'chivalry', 'chocolate', 'choleric', 'chopstick', 'chronic', 'chronicle', 'chrysalis', 'chuckle', 'cinnamon',
  'cipher', 'circuit', 'circular', 'circulate', 'circus', 'citizen', 'citrus', 'clarify', 'clarity', 'classical',
  'classify', 'cleanse', 'climate', 'clinical', 'cloister', 'closure', 'cluster', 'coalesce', 'coalition', 'coastal',
  'cobalt', 'coconut', 'coerce', 'cognac', 'cognitive', 'coherent', 'cohesion', 'coincide', 'collapse', 'collate',
  'colleague', 'collect', 'collision', 'colonial', 'colorful', 'colossal', 'comatose', 'combine', 'combustion', 'comedy',
  'comfort', 'command', 'commence', 'commend', 'comment', 'commerce', 'committee', 'commodity', 'common', 'commune',
  'compact', 'company', 'compare', 'compass', 'compel', 'compete', 'compile', 'complain', 'complete', 'complex',
  'comply', 'compose', 'compound', 'compress', 'comprise', 'compute', 'concave', 'conceal', 'concede', 'concept',
  'concern', 'concert', 'concise', 'conclude', 'concrete', 'condemn', 'condense', 'condition', 'conduct', 'confess',
  'confide', 'confine', 'confirm', 'conflict', 'conform', 'confound', 'confront', 'confuse', 'congeal', 'congenial',
  'congest', 'congress', 'conjure', 'connect', 'conquer', 'conquest', 'conscience', 'conscious', 'consensus', 'consent',
  'conserve', 'consider', 'console', 'consonant', 'conspire', 'constant', 'constrain', 'construct', 'consult', 'consume',
  'contact', 'contain', 'contempt', 'contend', 'content', 'contest', 'context', 'contort', 'contour', 'contract',
  'contrast', 'contribute', 'contrive', 'control', 'convene', 'converge', 'converse', 'convert', 'convey', 'convince',
  'convulse', 'cooperate', 'coordinate', 'cordial', 'corduroy', 'cormorant', 'cornea', 'coroner', 'corporate', 'corridor',
  'corrosive', 'corrupt', 'corsage', 'cortex', 'cosmic', 'costume', 'cottage', 'council', 'counsel', 'counter',
  'countess', 'country', 'courage', 'courier', 'covenant', 'coverage', 'covert', 'covetous', 'cowboy', 'coyote',
  'crackle', 'cradle', 'crafty', 'cranberry', 'craven', 'crayon', 'creation', 'credible', 'credit', 'crescent',
  'crevice', 'crimson', 'cripple', 'critical', 'critique', 'crocodile', 'crochet', 'croquet', 'crossroad', 'crucial',
  'crucible', 'crucifix', 'crucify', 'crumble', 'crusade', 'crystal', 'culinary', 'culminate', 'culpable', 'culprit',
  'cultivate', 'cultural', 'cunning', 'curator', 'curious', 'current', 'curtail', 'curtain', 'cushion', 'custard',
  'custody', 'custom', 'cutlery', 'cyclone', 'cylinder', 'cymbal', 'cynical', 'cypress', 'daffodil', 'dainty',
  'damage', 'dampen', 'dappled', 'daredevil', 'darling', 'dashboard', 'dazzle', 'deacon', 'deadline', 'deadly',
  'deafening', 'debacle', 'debate', 'debonair', 'debris', 'debunk', 'decade', 'decadent', 'decay', 'deceive',
  'decent', 'decipher', 'decision', 'decisive', 'declare', 'decline', 'decode', 'decompose', 'decorate', 'decrease',
  'decree', 'dedicate', 'deduct', 'defame', 'default', 'defeat', 'defect', 'defend', 'defer', 'defiant',
  'deficient', 'define', 'deflate', 'deform', 'defraud', 'defrost', 'deftly', 'defunct', 'degrade', 'degree',
  'dehydrate', 'deify', 'deject', 'delicate', 'delicious', 'delight', 'deliver', 'delude', 'deluge', 'deluxe',
  'demand', 'demise', 'democracy', 'demolish', 'demon', 'demonstrate', 'demote', 'demure', 'denizen', 'denounce',
  'dentist', 'denude', 'deny', 'depart', 'depend', 'depict', 'deplete', 'deplore', 'deploy', 'deport',
  'depose', 'deposit', 'depot', 'deprave', 'deprecate', 'depress', 'deprive', 'deputy', 'derail', 'deride',
  'derive', 'descend', 'describe', 'desert', 'design', 'desire', 'desktop', 'despair', 'desperate', 'despise',
  'despite', 'dessert', 'destiny', 'destroy', 'detach', 'detail', 'detect', 'deter', 'detest', 'detonate',
  'detour', 'develop', 'deviate', 'device', 'devious', 'devoid', 'devote', 'devour', 'dexterity', 'diabolic',
  'diagnose', 'diagonal', 'diagram', 'dialect', 'dialogue', 'diameter', 'diamond', 'diaper', 'diaphragm', 'diatribe',
  'dictate', 'dictator', 'differ', 'difficult', 'diffuse', 'digest', 'digital', 'dignity', 'digress', 'diligent',
  'dilute', 'diminish', 'dimple', 'dinghy', 'diploma', 'diplomat', 'direct', 'disable', 'disagree', 'disappear',
  'disarm', 'disaster', 'disavow', 'disband', 'discard', 'discern', 'discharge', 'disciple', 'disclose', 'discord',
  'discount', 'discover', 'discrete', 'discuss', 'disease', 'disgrace', 'disguise', 'disgust', 'dismal', 'dismiss',
  'disobey', 'disorder', 'disparity', 'dispatch', 'dispel', 'dispense', 'displace', 'display', 'dispose', 'dispute',
  'disrupt', 'dissect', 'dissent', 'dissolve', 'distance', 'distant', 'distill', 'distinct', 'distort', 'distract',
  'distress', 'district', 'disturb', 'diverge', 'diverse', 'divert', 'divest', 'divide', 'divine', 'divorce',
  'divulge', 'dizzying', 'docile', 'docket', 'doctor', 'doctrine', 'document', 'doleful', 'dolphin', 'domain',
  'domestic', 'dominant', 'dominate', 'donate', 'donkey', 'dormant', 'dosage', 'double', 'doughnut', 'dowager',
  'downfall', 'downpour', 'downtown', 'dragon', 'drainage', 'dramatic', 'drapery', 'drastic', 'draught', 'dreadful',
  'dreary', 'drenched', 'dresser', 'drifter', 'drizzle', 'droopy', 'droplet', 'drudgery', 'drummer', 'drunken',
  'dubious', 'duchess', 'duckling', 'duffel', 'dugout', 'dulcet', 'dulcimer', 'dumpling', 'dungeon', 'durable',
  'duration', 'duress', 'during', 'dwindle', 'dynamic', 'dynasty', 'dyslexia'
];

/**
 * Generate a random word from the word list
 */
export const getRandomWord = (): string => {
  const randomIndex = Math.floor(Math.random() * words.length);
  return words[randomIndex];
};

/**
 * Generate a random color in hex format
 */
export const getRandomColor = (): string => {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
};

/**
 * Generate a random position along the edge of the canvas
 */
export const getRandomPositionOnEdge = (width: number, height: number): [number, number] => {
  const edge = Math.floor(Math.random() * 4); // 0: top, 1: right, 2: bottom, 3: left

  switch (edge) {
    case 0: // top
      return [Math.random() * width, 0];
    case 1: // right
      return [width, Math.random() * height];
    case 2: // bottom
      return [Math.random() * width, height];
    case 3: // left
      return [0, Math.random() * height];
    default:
      return [0, 0];
  }
};

/**
 * Generate a random velocity within a range
 */
export const getRandomVelocity = (min: number, max: number): number => {
  return min + Math.random() * (max - min);
};