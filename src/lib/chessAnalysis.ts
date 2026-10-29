import { Chess, Move, Square } from "chess.js";

const PIECE_VALUE: Record<string, number> = {
  p: 1,
  n: 3,
  b: 3,
  r: 5,
  q: 9,
  k: 0,
};

function materialScore(game: Chess, color: "w" | "b"): number {
  let score = 0;
  const board = game.board();
  for (const row of board) {
    for (const sq of row) {
      if (!sq) continue;
      const v = PIECE_VALUE[sq.type] || 0;
      score += sq.color === color ? v : -v;
    }
  }
  return score;
}

/** Is this piece hanging (attacked and not adequately defended / higher value)? */
function isHanging(game: Chess, square: Square, color: "w" | "b"): boolean {
  const piece = game.get(square);
  if (!piece || piece.color !== color) return false;

  const attackers = game.attackers(square, color === "w" ? "b" : "w");
  if (attackers.length === 0) return false;

  const defenders = game.attackers(square, color);
  const pieceVal = PIECE_VALUE[piece.type] || 0;

  // Simple: hanging if attacked and either undefended or piece is more valuable than cheapest attacker
  if (defenders.length === 0) return true;

  // Approximate: if more attackers than defenders and piece is valuable
  if (attackers.length > defenders.length && pieceVal >= 3) return true;

  return false;
}

function scoreMove(game: Chess, move: Move): number {
  let score = 0;

  if (move.san.includes("#")) score += 10000;
  else if (move.san.includes("+")) score += 50;

  if (move.captured) {
    score += (PIECE_VALUE[move.captured] || 0) * 10;
  }

  // Prefer central destination
  const file = move.to.charCodeAt(0) - 97; // 0-7
  const rank = parseInt(move.to[1], 10) - 1;
  const centrality = 3.5 - Math.abs(file - 3.5) + (3.5 - Math.abs(rank - 3.5));
  score += centrality;

  // Prefer developing knights/bishops early
  if (move.piece === "n" || move.piece === "b") score += 2;

  // Slight penalty for moving king early (except castle)
  if (move.piece === "k" && !move.san.includes("O")) score -= 5;

  // Prefer castling
  if (move.san.includes("O")) score += 30;

  return score;
}

function findBestMove(game: Chess): { san: string; score: number } | null {
  const moves = game.moves({ verbose: true });
  if (moves.length === 0) return null;

  let best = moves[0];
  let bestScore = -Infinity;

  for (const m of moves) {
    const s = scoreMove(game, m);
    // Quick safety: reject moves that hang a high-value piece immediately
    const g2 = new Chess(game.fen());
    g2.move(m);
    const dest = m.to as Square;
    const piece = g2.get(dest);
    if (piece && isHanging(g2, dest, piece.color) && (PIECE_VALUE[piece.type] || 0) >= 3) {
      // still allow if it was a big capture
      if (!(m.captured && (PIECE_VALUE[m.captured] || 0) >= (PIECE_VALUE[piece.type] || 0))) {
        continue;
      }
    }
    if (s > bestScore) {
      bestScore = s;
      best = m;
    }
  }

  return { san: best.san, score: bestScore };
}

export type AnalysisResult = {
  title: string;
  body: string;
  tone: "good" | "ok" | "bad" | "info";
};

/**
 * Analyze the last move and current position.
 * beforeFen = position before the move, afterGame = position after.
 */
export function analyzeLastMove(
  beforeFen: string,
  afterGame: Chess,
  lastSan: string,
  moverColor: "w" | "b"
): AnalysisResult {
  const before = new Chess(beforeFen);
  const after = afterGame;

  const matBefore = materialScore(before, moverColor);
  const matAfter = materialScore(after, moverColor);
  const matDelta = matAfter - matBefore;

  // Best move that was available before this move
  const bestBefore = findBestMove(before);

  // Best move now for the side to move
  const sideToMove = after.turn();
  const bestNow = findBestMove(after);

  const lines: string[] = [];
  let tone: AnalysisResult["tone"] = "ok";
  let title = "Move played";

  // Checkmate / check
  if (after.isCheckmate()) {
    title = "Checkmate!";
    tone = "good";
    lines.push(`${lastSan} ends the game. Excellent finish.`);
    return { title, body: lines.join(" "), tone };
  }

  if (after.isCheck()) {
    lines.push(`${lastSan} gives check.`);
  }

  // Material change feedback
  if (matDelta >= 3) {
    title = "Strong move";
    tone = "good";
    lines.push(`You gained material (+${matDelta}).`);
  } else if (matDelta <= -3) {
    title = "Costly move";
    tone = "bad";
    lines.push(`You lost material (${matDelta}).`);
  }

  // Did we miss a clearly better move?
  if (bestBefore && bestBefore.san !== lastSan) {
    const playedScore = (() => {
      const moves = before.moves({ verbose: true });
      const m = moves.find((x) => x.san === lastSan);
      return m ? scoreMove(before, m) : 0;
    })();

    if (bestBefore.score >= playedScore + 40) {
      if (tone !== "bad") {
        title = "Better available";
        tone = "ok";
      }
      lines.push(
        `A stronger idea was ${bestBefore.san}. Consider that next time.`
      );
    } else if (bestBefore.score >= playedScore + 15 && tone === "ok") {
      lines.push(`Interesting alternative: ${bestBefore.san}.`);
    }
  }

  // Hanging pieces after the move for the mover
  const board = after.board();
  const hanging: string[] = [];
  for (let r = 0; r < 8; r++) {
    for (let f = 0; f < 8; f++) {
      const p = board[r][f];
      if (!p || p.color !== moverColor) continue;
      const sq = (String.fromCharCode(97 + f) + (8 - r)) as Square;
      if (isHanging(after, sq, moverColor) && (PIECE_VALUE[p.type] || 0) >= 3) {
        hanging.push(`${p.type.toUpperCase()} on ${sq}`);
      }
    }
  }
  if (hanging.length > 0) {
    title = "Watch out";
    tone = "bad";
    lines.push(`Hanging piece(s): ${hanging.join(", ")}. Protect or move them.`);
  }

  // Suggestion for the current side to move
  if (bestNow && !after.isGameOver()) {
    const who = sideToMove === "w" ? "White" : "Black";
    lines.push(`Best idea for ${who} now: ${bestNow.san}.`);
  }

  if (lines.length === 0) {
    title = "Solid";
    tone = "good";
    lines.push(`${lastSan} looks fine. Keep developing and controlling the center.`);
  }

  return { title, body: lines.join(" "), tone };
}

export function analyzeCurrentPosition(game: Chess): AnalysisResult {
  if (game.isCheckmate()) {
    return {
      title: "Game over",
      body: "Checkmate. Review the last few moves to see where the defense broke.",
      tone: "info",
    };
  }
  if (game.isDraw()) {
    return {
      title: "Draw",
      body: "The game is drawn. Look for ways to create imbalances next time.",
      tone: "info",
    };
  }

  const best = findBestMove(game);
  const who = game.turn() === "w" ? "White" : "Black";
  const tips: string[] = [];

  if (game.isCheck()) {
    tips.push(`${who} is in check — resolve it first.`);
  }

  if (best) {
    tips.push(`Suggested move: ${best.san}.`);
  }

  const mat = materialScore(game, "w");
  if (Math.abs(mat) >= 3) {
    tips.push(
      mat > 0
        ? `White is up ~${mat} points of material.`
        : `Black is up ~${-mat} points of material.`
    );
  }

  return {
    title: "Position",
    body: tips.join(" ") || "Keep improving your pieces and king safety.",
    tone: "info",
  };
}
