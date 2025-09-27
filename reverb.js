let deck = [];
let hand = [];
let queue = [];
let turns = 0;
let completions = 0;
let reverseUsed = false;
let reverseMode = false;

const topItems = ["1","2","3","4","5","6","7"];
const bottomItems = ["1","2","3","4","5","6","7","1-4","4-7","w","d","n"];

// Build the full 84-card deck
function buildDeck() {
  let cards = [];
  topItems.forEach(top => {
    bottomItems.forEach(bottom => {
      cards.push({
        top,
        bottom,
        img: `images/${top} ${bottom}.png`
      });
    });
  });
  return shuffle(cards);
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function startGame() {
  deck = buildDeck();
  hand = deck.splice(0, 7);
  queue = [deck.pop(), deck.pop()];
  turns = 0;
  completions = 0;
  reverseUsed = false;
  reverseMode = false;
  render();
}

function drawCard() {
  if (deck.length > 0) {
    hand.push(deck.pop());
    render();
  }
}

function playCard(index) {
  let card = hand[index];
  if (!canPlay(card)) return;
  hand.splice(index, 1);
  queue.push(card);
  if (queue.length > 2) queue.shift();

  // Completion check
  if (hand.length === 0) {
    completions++;
    hand = deck.splice(0, 7);
  }

  // Check for reverb chaining (double-match)
  if (!reverseMode && isDoubleMatch(card)) {
    render();
    return; // allow player to immediately play again
  }

  // In reverse mode: end turn if match to next-to-last, continue only if non-matching both
  if (reverseMode) {
    if (matches(card, queue[queue.length - 2])) {
      turns++;
    } else {
      render();
      return; // can keep playing if nothing matched
    }
  } else {
    turns++;
  }

  render();
}

function canPlay(card) {
  const last = queue[queue.length - 1];
  if (!reverseMode) {
    return matches(card, last);
  } else {
    return !matches(card, last);
  }
}

function matches(card, other) {
  if (!other) return false;
  return matchItem(card.top, other.top) || matchItem(card.top, other.bottom) ||
         matchItem(card.bottom, other.top) || matchItem(card.bottom, other.bottom);
}

function matchItem(a, b) {
  if (a === "n" || b === "n") return false;
  if (a === "w" || b === "w") return true;
  if (a === b) return true;
  if (a.includes("-")) return rangeMatch(a, b);
  if (b.includes("-")) return rangeMatch(b, a);
  return false;
}

function rangeMatch(range, value) {
  if (isNaN(value)) return false;
  let [min, max] = range.split("-").map(Number);
  let num = Number(value);
  return num >= min && num <= max;
}

function isDoubleMatch(card) {
  if (queue.length < 2) return false;
  const last = queue[queue.length - 2];
  const currentLast = queue[queue.length - 1];

  const topMatchesLast = matches({top: card.top, bottom: card.top}, currentLast);
  const bottomMatchesLast = matches({top: card.bottom, bottom: card.bottom}, currentLast);
  const topMatchesPrev = matches({top: card.top, bottom: card.top}, last);
  const bottomMatchesPrev = matches({top: card.bottom, bottom: card.bottom}, last);

  // one item must match current last, the other must match previous
  return (topMatchesLast && bottomMatchesPrev) || (bottomMatchesLast && topMatchesPrev);
}

function useReverse() {
  if (!reverseUsed) {
    reverseUsed = true;
    reverseMode = true;
  }
}

function render() {
  document.getElementById("hand").innerHTML = hand
    .map((c, i) => `<img src="${c.img}" class="card" onclick="playCard(${i})">`)
    .join("");
  document.getElementById("queue").innerHTML = queue
    .map(c => `<img src="${c.img}" class="card">`)
    .join("");
  document.getElementById("turns").innerText = turns;
  document.getElementById("completions").innerText = completions;
  document.getElementById("deckCount").innerText = deck.length;
}

window.onload = startGame;