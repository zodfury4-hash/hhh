// Small deterministic profanity blocklist for generated slug moderation
const PROFANITY_BLOCKLIST = new Set([
  'badword',
  'anal',
  'anus',
  'arse',
  'ass',
  'ballsack',
  'bastard',
  'bitch',
  'biatch',
  'bloody',
  'blowjob',
  'bollock',
  'boner',
  'boob',
  'bugger',
  'bum',
  'butt',
  'clit',
  'cock',
  'coon',
  'crap',
  'cunt',
  'damn',
  'dick',
  'dildo',
  'dyke',
  'fag',
  'faggot',
  'feck',
  'fellate',
  'fellatio',
  'felching',
  'fuck',
  'fudgepacker',
  'flange',
  'goddamn',
  'hell',
  'homo',
  'jerk',
  'jizz',
  'knobend',
  'labia',
  'muff',
  'nigger',
  'nigga',
  'penis',
  'piss',
  'poop',
  'prick',
  'pube',
  'pussy',
  'queer',
  'scrotum',
  'sex',
  'shit',
  'shite',
  'slut',
  'smegma',
  'spunk',
  'tit',
  'tosser',
  'turd',
  'twat',
  'vagina',
  'wank',
  'whore'
]);

function containsProfanity(text = '') {
  if (!text || typeof text !== 'string') return false;
  const normalized = text.toLowerCase().replace(/[^a-z0-9]/g, '');
  for (const word of PROFANITY_BLOCKLIST) {
    if (normalized.includes(word)) return true;
  }
  return false;
}

module.exports = {
  PROFANITY_BLOCKLIST,
  containsProfanity
};
