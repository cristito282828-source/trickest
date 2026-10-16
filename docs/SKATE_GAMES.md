# Game of Skate

## Scope

The dashboard Game of Skate flow supports an in-person game between two skaters and a third user acting as judge. The judge records each attempt, assigns any letters, and publishes the official result. Players can rate only the judge.

## Game flow

1. A signed-in skater enables map visibility and searches for a different opponent and judge from active users whose saved location is within 100 meters of the challenger. Any eligible user can be the judge.
2. The opponent and judge accept or decline. Declining cancels the game.
3. After both accept, all three participants check in near the challenger's currently shared location. Each must be within 100 meters, have GPS accuracy of 100 meters or better, and check in within the same 15-minute window.
4. Only the assigned judge can record trick attempts, landed/missed results, optional letters, and notes.
5. Once a player receives all five letters, the game awaits the judge's report. The judge may also end a game early by publishing a report after at least one recorded turn.
6. The judge selects the winner and provides the official report. Only then does the result count toward the Game of Skate leaderboard.
7. Each of the two players may submit one 1-to-5 rating of the judge, optionally with a comment. Players do not rate one another.

## Persistence and ranking

- `SkateGame` stores the players, judge, optional legacy spot, acceptance state, letters, winner/loser, report, and lifecycle timestamps. New games use the challenger's shared location as their meeting reference and do not persist its coordinates in the game.
- `SkateGameTurn` stores each attempt and judge decision.
- `SkateGameCheckIn` stores the user's check-in time and GPS accuracy, but never the latitude or longitude sent by the browser.
- `SkateGameRating` stores a player's rating of the assigned judge; the game API exposes the judge's aggregate score, not another player's rating comment.
- The dashboard leaderboard's Game of Skate tab orders completed, judge-reported games by wins, then fewer losses, then existing challenge points. Cancelled and unreported games are excluded.

## Current safeguards and limits

- The server verifies that only game participants can view a game, only the invited opponent/judge can accept, only the judge can record turns or report, and only players can rate the judge.
- Only active users with complete profiles can be selected. The players and judge must be three distinct users.
- Candidate search requires map visibility (`showOnMap`) for both the challenger and candidates, and filters by distance server-side. Only approximate distance is returned; other users' coordinates are never sent to the client.
- The challenger must keep location sharing enabled through check-in. The server checks each participant's live GPS against the challenger's currently shared location. Check-in coordinates are not persisted; the check-in time and accuracy are.
- A user may create at most three simultaneously open games as challenger.
- Trick names are limited to 80 characters; judge notes to 500; reports to 3,000; rating comments to 500.
- GPS proximity is a convenience check, not proof against spoofed device locations.

## Migration

The additive Prisma migrations are `20261016_z_add_skate_games` and `20261016_zz_make_skate_game_spot_optional`. Apply pending migrations with `npx prisma migrate deploy` against the intended database, then regenerate Prisma Client if needed.
