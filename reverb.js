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
  const firstCard = deck.pop();
  const secondCard = deck.pop();
  queue = [firstCard, secondCard];

  // Check for draw effects on initial queue cards
  checkDrawEffect(firstCard);
  checkDrawEffect(secondCard);

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

function checkDrawEffect(card) {
  // Check if card has "d" (draw) - add next card from deck to player's hand
  if (card.top === "d" || card.bottom === "d") {
    if (deck.length > 0) {
      const drawnCard = deck.pop();
      hand.push(drawnCard);
      console.log("Draw card in queue! Added card to hand:", drawnCard.top, drawnCard.bottom);
    }
  }
}


function playCard(index) {
  let card = hand[index];
  if (!canPlay(card)) {
    animateInvalidCard(index);
    return;
  }
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

  // Check if this is a draw card (has "d")
  const isDrawCard = card.top === "d" || card.bottom === "d";
  console.log("isDrawCard:", isDrawCard);

  // Animate the played card, then continue with game logic after animation
  animatePlayedCard(isDouble, () => {

    // Handle draw card effect first if it's a draw card
    if (isDrawCard && deck.length > 0) {
      const drawnCard = deck.pop();
      queue.push(drawnCard);
      console.log("Draw card played! Added card to queue:", drawnCard.top, drawnCard.bottom);

      // Re-render to show the drawn card in the queue
      render();

      // Check if the draw card was a double-match to decide turn continuation
      if (isDouble) {
        console.log("Draw card was double-match, continuing turn");
        return; // Allow player to continue playing
      } else {
        console.log("Draw card was not double-match, ending turn");
        turns++;

        // Draw another card to the queue for the normal turn ending
        if (deck.length > 0) {
          const secondDrawnCard = deck.pop();
          queue.push(secondDrawnCard);
          console.log("Turn ending: drew second card to queue:", secondDrawnCard.top, secondDrawnCard.bottom);
          checkDrawEffect(secondDrawnCard);
        }

        completeTurnWithCardRemoval();
        return;
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
          checkDrawEffect(drawnCard);
        }
        completeTurnWithCardRemoval();
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
        checkDrawEffect(drawnCard);
      }
      completeTurnWithCardRemoval();
    }
  });
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

function updateCounterWithAnimation(elementId, newValue) {
  const element = document.getElementById(elementId);
  const oldValue = parseInt(element.innerText) || 0;

  if (newValue > oldValue) {
    // Add sunburst animation class
    element.classList.add('sunburst');

    // Remove the class after animation completes
    setTimeout(() => {
      element.classList.remove('sunburst');
    }, 800);
  }

  element.innerText = newValue;
}

function animatePlayedCard(isDoubleMatch, callback) {
  // Render first to show the played card
  render();

  // Wait a bit for the render to complete, then find and animate the last played card
  setTimeout(() => {
    const playedCards = document.querySelectorAll('#playedQueue img');
    if (playedCards.length > 0) {
      const lastCard = playedCards[playedCards.length - 1];

      if (isDoubleMatch) {
        lastCard.classList.add('greenSunburst');
        setTimeout(() => {
          lastCard.classList.remove('greenSunburst');
          if (callback) callback();
        }, 400);
      } else {
        // Apply the yellow sunburst for the normal play
        lastCard.classList.add('yellowSunburst');
        setTimeout(() => {
          lastCard.classList.remove('yellowSunburst');
          if (callback) callback();
        }, 300);
      }
    } else {
      // If no card found, call callback immediately
      if (callback) callback();
    }
  }, 50);
}

function animateInvalidCard(cardIndex) {
  // Find the card in the hand and animate it
  const handCards = document.querySelectorAll('#hand img');
  if (handCards[cardIndex]) {
    const invalidCard = handCards[cardIndex];

    invalidCard.classList.add('redSunburst');
    setTimeout(() => {
      invalidCard.classList.remove('redSunburst');
    }, 400);
  }
}

function animateOldCardsRemoval(callback) {
  // Only animate if there are more than 2 cards in the queue
  if (queue.length <= 2) {
    if (callback) callback();
    return;
  }

  const playedCards = document.querySelectorAll('#playedQueue img');
  const cardsToRemove = playedCards.length - 2; // Keep last 2 cards

  if (cardsToRemove <= 0) {
    if (callback) callback();
    return;
  }

  let animationsCompleted = 0;

  // Animate the old cards (all except the last 2)
  for (let i = 0; i < cardsToRemove; i++) {
    const card = playedCards[i];
    if (card) {
      card.classList.add('yellowSunburst');
      setTimeout(() => {
        card.classList.add('fadeOut');
        setTimeout(() => {
          animationsCompleted++;
          if (animationsCompleted === cardsToRemove) {
            // Remove old cards from the queue array and re-render
            queue = queue.slice(-2); // Keep only last 2 cards
            render();
            if (callback) callback();
          }
        }, 300); // Fade out duration
      }, 300); // Yellow sunburst duration
    } else {
      animationsCompleted++;
      if (animationsCompleted === cardsToRemove) {
        queue = queue.slice(-2);
        render();
        if (callback) callback();
      }
    }
  }
}

function renderWithoutTurnsUpdate() {
  document.getElementById("hand").innerHTML = hand
    .map((c, i) => `<img src="${c.img}" class="card" onclick="playCard(${i})">`)
    .join("");

  // Update played queue to show all cards
  document.getElementById("playedQueue").innerHTML = queue
    .map(c => `<img src="${c.img}" class="card">`)
    .join("");

  // Don't update turns counter - that will be done separately with animation
  updateCounterWithAnimation("comps", completions);
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

function completeTurnWithCardRemoval() {
  // First render to show the new card that was drawn to the queue (without updating turns counter)
  renderWithoutTurnsUpdate();

  // Wait for render to complete, then animate the turns counter
  setTimeout(() => {
    updateCounterWithAnimation("turns", turns);

    // Then animate removal of old cards after the counter animation starts
    setTimeout(() => {
      animateOldCardsRemoval(() => {
        // Final render after card removal is complete (though it should be handled in animateOldCardsRemoval)
      });
    }, 200); // Small delay to let the turns counter animation start
  }, 50); // Small delay to ensure render is complete
}

function render() {
  document.getElementById("hand").innerHTML = hand
    .map((c, i) => `<img src="${c.img}" class="card" onclick="playCard(${i})">`)
    .join("");

  // Update played queue to show all cards
  document.getElementById("playedQueue").innerHTML = queue
    .map(c => `<img src="${c.img}" class="card">`)
    .join("");

  updateCounterWithAnimation("turns", turns);
  updateCounterWithAnimation("comps", completions);
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
    checkDrawEffect(drawnCard);
  }

  console.log("turns after:", turns);
  completeTurnWithCardRemoval();
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