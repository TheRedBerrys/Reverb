# Reverb

_The card-shedding game of matching both past and present_

## TLDR

Each card has two items. You may play any card from your hand if either of the items on the card match either of the items on the last card.

If the other item on your card also matches the next-to-last card, you can keep playing. 

The game ends when your "Completions" counter hits 3. Your score is the number in your "Turns" counter. Try to beat your lowest score!

## On Your Turn

1. Draw (optional/if stuck): Take 1 card from the draw pile.
2. Play: Place a card matching at least one item on the last card in the queue.
3. Reverb: If the other item also matches the second-to-last card, immediately play again.
   * Keep chaining as long as you can.
   * Each play shifts the queue forward (last → second-to-last). The card you just played becomes the new last card.
4. If you play your last card, the "Completions" counter goes up.
   * If your card matches both the last card and the next-to-last card, you draw seven new cards and your turn continues.
   * If not, your turn ends and 
5. Your turn ends and the "Turns" counter goes up when one of the following happens:
   * You play a card that matches the last card, but not the next-to-last card
   * You have no card that matches the last card
   * You decide not to play any more cards

# Matching

Each card has two items. You can play any card if either item matches either item on the last card played.

Numbers match themselves (but not other numbers)
  

Ranges (1-4 and 4-7) match numbers they contain but not other ranges.


Draw matches another draw (and wild), but not numbers or ranges. When you play a draw card, each player (except you) draws one card from the draw pile into their hand.


Wild matches any number, range, or draw


Null matches nothing, including another null or a wild
