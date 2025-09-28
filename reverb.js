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

  // Check for reverb chaining (double-match) BEFORE draw card effect
  const isDouble = isDoubleMatch(card);
  console.log("isDoubleMatch:", isDouble, "reverseMode:", reverseMode);

  // Check if played card has "d" (draw) - add next card from deck to queue
  if (card.top === "d" || card.bottom === "d") {
    if (deck.length > 0) {
      const drawnCard = deck.pop();
      queue.push(drawnCard);
      console.log("Draw card played! Added card to queue:", drawnCard.top, drawnCard.bottom);
    }
  }

  if (reverseMode) {
    console.log("In reverse mode");
    if (!isDouble) {
      console.log("Reverse mode: matches found, ending turn");
      turns++;
      reverseMode = false; // Turn off reverse mode after turn ends

      // Draw a card from the deck to the played queue
      if (deck.length > 0) {
        const drawnCard = deck.pop();
        queue.push(drawnCard);
        console.log("Drew card to played queue:", drawnCard.top, drawnCard.bottom);
      }
    } else {
      console.log("Reverse mode: no matches, continuing");
      render();
      return; // can keep playing if nothing matched
    }
  } else if (isDouble) {
    console.log("Normal mode: double match - allowing immediate play");
    render();
    return; // allow player to immediately play again
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
  console.log(`rangeMatch("${range}", "${value}")`);
  if (isNaN(value)) {
    console.log(`  isNaN("${value}") = true, returning false`);
    return false;
  }
  let [min, max] = range.split("-").map(Number);
  let num = Number(value);
  console.log(`  range: ${min}-${max}, value: ${num}, result: ${num >= min && num <= max}`);
  return num >= min && num <= max;
}

function isDoubleMatch(card) {
  if (queue.length < 3) return false;
  const prevPrev = queue[queue.length - 3];
  const prev = queue[queue.length - 2];

  console.log("Checking isDoubleMatch:");
  console.log("Card:", card.top, card.bottom);
  console.log("Previous card:", prev.top, prev.bottom);
  console.log("Card before previous:", prevPrev.top, prevPrev.bottom);

  const topMatchesPrev = matchItem(card.top, prev.top) || matchItem(card.top, prev.bottom);
  const topMatchesPrevPrev = matchItem(card.top, prevPrev.top) || matchItem(card.top, prevPrev.bottom);
  const bottomMatchesPrev = matchItem(card.bottom, prev.top) || matchItem(card.bottom, prev.bottom);
  const bottomMatchesPrevPrev = matchItem(card.bottom, prevPrev.top) || matchItem(card.bottom, prevPrev.bottom);

  console.log("topMatchesPrev:", topMatchesPrev);
  console.log("topMatchesPrevPrev:", topMatchesPrevPrev);
  console.log("bottomMatchesPrev:", bottomMatchesPrev);
  console.log("bottomMatchesPrevPrev:", bottomMatchesPrevPrev);

  let result;
  if (reverseMode) {
    // In reverse mode, any match should end turn, so double-match should be false if ANY match exists
    result = !(topMatchesPrev || topMatchesPrevPrev || bottomMatchesPrev || bottomMatchesPrevPrev);
  } else {
    // Normal mode: double-match when one part matches one card and other part matches the other card
    result = (topMatchesPrev && bottomMatchesPrevPrev) || (bottomMatchesPrev && topMatchesPrevPrev);
  }

  console.log("isDoubleMatch result:", result);
  return result;
}

function useReverse() {
  if (!reverseUsed) {
    reverseUsed = true;
    reverseMode = true;
    render();
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

  // Update reverse button
  const reverseBtn = document.getElementById("reverseBtn");
  if (reverseMode) {
    reverseBtn.disabled = false;
    reverseBtn.className = "reverse";
    reverseBtn.innerText = "Reverse Mode Active";
  } else if (reverseUsed) {
    reverseBtn.disabled = true;
    reverseBtn.className = "secondary";
    reverseBtn.innerText = "Reverse Used";
  } else {
    reverseBtn.disabled = false;
    reverseBtn.className = "";
    reverseBtn.innerText = "Use Reverse (once)";
  }
}

function endTurn() {
  console.log("endTurn called, turns before:", turns);
  turns++;
  reverseMode = false; // Turn off reverse mode when turn ends

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