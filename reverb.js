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

  // Completion check
  if (hand.length === 0) {
    completions++;
    hand = deck.splice(0, 7);
  }

  // Check for reverb chaining (double-match)
  const isDouble = isDoubleMatch(card);
  console.log("isDoubleMatch:", isDouble, "reverseMode:", reverseMode);
  if (!reverseMode && isDouble) {
    console.log("Double match - allowing immediate play");
    render();
    return; // allow player to immediately play again
  }

  // In reverse mode: end turn if match to next-to-last, continue only if non-matching both
  if (reverseMode) {
    console.log("In reverse mode");
    if (queue.length >= 2 && matches(card, queue[queue.length - 2])) {
      console.log("Reverse mode: match to next-to-last, ending turn");
      turns++;

      // Draw a card from the deck to the played queue
      if (deck.length > 0) {
        const drawnCard = deck.pop();
        queue.push(drawnCard);
        console.log("Drew card to played queue:", drawnCard.top, drawnCard.bottom);
      }
    } else {
      console.log("Reverse mode: no match, continuing");
      render();
      return; // can keep playing if nothing matched
    }
  } else {
    console.log("Normal mode: ending turn, turns before:", turns);
    turns++;
    console.log("turns after increment:", turns);

    // Draw a card from the deck to the played queue
    if (deck.length > 0) {
      const drawnCard = deck.pop();
      queue.push(drawnCard);
      console.log("Drew card to played queue:", drawnCard.top, drawnCard.bottom);
    }
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

  console.log("Checking isDoubleMatch:");
  console.log("Card:", card.top, card.bottom);
  console.log("Previous card:", last.top, last.bottom);
  console.log("Current last card:", currentLast.top, currentLast.bottom);

  // Check if card's top matches ONLY currentLast and bottom matches ONLY last
  const topMatchesOnlyLast = (matchItem(card.top, currentLast.top) || matchItem(card.top, currentLast.bottom)) &&
                            !(matchItem(card.top, last.top) || matchItem(card.top, last.bottom));
  const bottomMatchesOnlyPrev = (matchItem(card.bottom, last.top) || matchItem(card.bottom, last.bottom)) &&
                               !(matchItem(card.bottom, currentLast.top) || matchItem(card.bottom, currentLast.bottom));

  // Check if card's bottom matches ONLY currentLast and top matches ONLY last
  const bottomMatchesOnlyLast = (matchItem(card.bottom, currentLast.top) || matchItem(card.bottom, currentLast.bottom)) &&
                               !(matchItem(card.bottom, last.top) || matchItem(card.bottom, last.bottom));
  const topMatchesOnlyPrev = (matchItem(card.top, last.top) || matchItem(card.top, last.bottom)) &&
                            !(matchItem(card.top, currentLast.top) || matchItem(card.top, currentLast.bottom));

  console.log("topMatchesOnlyLast:", topMatchesOnlyLast);
  console.log("bottomMatchesOnlyPrev:", bottomMatchesOnlyPrev);
  console.log("bottomMatchesOnlyLast:", bottomMatchesOnlyLast);
  console.log("topMatchesOnlyPrev:", topMatchesOnlyPrev);

  const result = (topMatchesOnlyLast && bottomMatchesOnlyPrev) || (bottomMatchesOnlyLast && topMatchesOnlyPrev);
  console.log("isDoubleMatch result:", result);

  // one item must match current last EXCLUSIVELY, the other must match previous EXCLUSIVELY
  return result;
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

  // Update played queue to show all cards
  document.getElementById("playedQueue").innerHTML = queue
    .map(c => `<img src="${c.img}" class="card" style="width:125px;height:175px">`)
    .join("");

  document.getElementById("turns").innerText = turns;
  document.getElementById("comps").innerText = completions;
  document.getElementById("drawCount").innerText = deck.length;
}

function endTurn() {
  console.log("endTurn called, turns before:", turns);
  turns++;

  // Draw a card from the deck to the played queue
  if (deck.length > 0) {
    const drawnCard = deck.pop();
    queue.push(drawnCard);
    console.log("Drew card to played queue:", drawnCard.top, drawnCard.bottom);
  }

  console.log("turns after:", turns);
  render();
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
  console.log("DOMContentLoaded fired");
  const endBtn = document.getElementById('endBtn');
  console.log("endBtn element:", endBtn);
  if (endBtn) {
    endBtn.addEventListener('click', endTurn);
    console.log("endTurn event listener added");
  }
  document.getElementById('drawBtn').addEventListener('click', drawCard);
  document.getElementById('reverseBtn').addEventListener('click', useReverse);
});

window.onload = startGame;