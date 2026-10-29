import { Chess, Move, Square } from "chess.js";

const PIECE_VALUE: Record<string, number> = {
  p: 1,
  n: 3,
  b: 3,
  r: 5,
  q: 9,
  k: 0,
};

const PIECE_NAME: Record<string, string> = {
  p: "pawn",
  n: "knight",
  b: "bishop",
  r: "rook",
  q: "queen",
  k: "king",
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

function isHanging(game: Chess, square: Square, color: "w" | "b"): boolean {
  const piece = game.get(square);
  if (!piece || piece.color !== color) return false;

  try {
    const attackers = game.attackers(square, color === "w" ? "b" : "w");
    if (!attackers || attackers.length === 0) return false;

    const defenders = game.attackers(square, color);
    const pieceVal = PIECE_VALUE[piece.type] || 0;

    if (!defenders || defenders.length === 0) return true;
    if (attackers.length > defenders.length && pieceVal >= 3) return true;
  } catch {
    return false;
  }

  return false;
}

function scoreMove(game: Chess, move: Move): number {
  let score = 0;

  if (move.san.includes("#")) score += 10000;
  else if (move.san.includes("+")) score += 50;

  if (move.captured) {
    score += (PIECE_VALUE[move.captured] || 0) * 10;
  }

  const file = move.to.charCodeAt(0) - 97;
  const rank = parseInt(move.to[1], 10) - 1;
  const centrality =
    3.5 - Math.abs(file - 3.5) + (3.5 - Math.abs(rank - 3.5));
  score += centrality;

  if (move.piece === "n" || move.piece === "b") score += 2;
  if (move.piece === "k" && !move.san.includes("O")) score -= 5;
  if (move.san.includes("O")) score += 30;

  // Bonus if capture is safe (not hanging after)
  if (move.captured) {
    const g2 = new Chess(game.fen());
    g2.move(move);
    if (!isHanging(g2, move.to as Square, move.color)) {
      score += 8;
    } else {
      score -= (PIECE_VALUE[move.piece] || 0) * 5;
    }
  }

  return score;
}

function findBestMove(
  game: Chess
): { move: Move; san: string; score: number } | null {
  const moves = game.moves({ verbose: true });
  if (moves.length === 0) return null;

  let best = moves[0];
  let bestScore = -Infinity;

  for (const m of moves) {
    const s = scoreMove(game, m);
    const g2 = new Chess(game.fen());
    g2.move(m);
    const dest = m.to as Square;
    const piece = g2.get(dest);
    if (
      piece &&
      isHanging(g2, dest, piece.color) &&
      (PIECE_VALUE[piece.type] || 0) >= 3
    ) {
      if (
        !(
          m.captured &&
          (PIECE_VALUE[m.captured] || 0) >= (PIECE_VALUE[piece.type] || 0)
        )
      ) {
        continue;
      }
    }
    if (s > bestScore) {
      bestScore = s;
      best = m;
    }
  }

  return { move: best, san: best.san, score: bestScore };
}

/** Explain why a specific move is strong */
function explainMoveWhy(game: Chess, move: Move): string[] {
  const reasons: string[] = [];
  const g2 = new Chess(game.fen());
  g2.move(move);

  if (move.san.includes("#")) {
    reasons.push("It delivers checkmate and ends the game.");
    return reasons;
  }

  if (move.captured) {
    const name = PIECE_NAME[move.captured] || "piece";
    const val = PIECE_VALUE[move.captured] || 0;
    reasons.push(
      `It captures the ${name} on ${move.to} (worth ~${val} point${val === 1 ? "" : "s"}).`
    );

    const safe = !isHanging(g2, move.to as Square, move.color);
    if (safe) {
      reasons.push("The capture looks safe — your piece is not hanging afterward.");
    } else {
      reasons.push(
        "Warning: after the capture your piece may be recaptured. Check the trade."
      );
    }
  }

  if (move.san.includes("+")) {
    reasons.push("It puts the enemy king in check, forcing a response.");
  }

  if (move.san.includes("O")) {
    reasons.push(
      "Castling improves king safety and connects your rooks — a key opening goal."
    );
  }

  if (!move.captured && (move.piece === "n" || move.piece === "b")) {
    reasons.push(
      `Developing the ${PIECE_NAME[move.piece]} brings more firepower into the game.`
    );
  }

  // Central control
  const file = move.to.charCodeAt(0) - 97;
  const rank = parseInt(move.to[1], 10) - 1;
  if (file >= 2 && file <= 5 && rank >= 2 && rank <= 5 && !move.captured) {
    reasons.push("It fights for central space, which helps control the board.");
  }

  if (reasons.length === 0) {
    reasons.push("It improves your position and keeps pressure on the opponent.");
  }

  return reasons;
}

/** What is the opponent threatening right now? */
function opponentThreats(game: Chess): string[] {
  const threats: string[] = [];
  const enemy = game.turn() === "w" ? "b" : "w";
  const you = game.turn();

  // Opponent just moved; side to move is you. Look at enemy threats against you.
  // Scan your pieces for hanging ones
  const board = game.board();
  for (let r = 0; r < 8; r++) {
    for (let f = 0; f < 8; f++) {
      const p = board[r][f];
      if (!p || p.color !== you) continue;
      const sq = (String.fromCharCode(97 + f) + (8 - r)) as Square;
      if (isHanging(game, sq, you)) {
        const name = PIECE_NAME[p.type] || "piece";
        threats.push(`Your ${name} on ${sq} is under attack and may be hanging.`);
      }
    }
  }

  // Checks available for the opponent (if it were their turn) — approximate by flipping
  // Simpler: if you are in check
  if (game.isCheck()) {
    threats.push("You are in check — you must deal with this immediately.");
  }

  // Enemy captures available conceptually: look at your valuable pieces attacked
  try {
    for (let r = 0; r < 8; r++) {
      for (let f = 0; f < 8; f++) {
        const p = board[r][f];
        if (!p || p.color !== you) continue;
        if ((PIECE_VALUE[p.type] || 0) < 3) continue;
        const sq = (String.fromCharCode(97 + f) + (8 - r)) as Square;
        const atk = game.attackers(sq, enemy);
        if (atk && atk.length > 0) {
          const def = game.attackers(sq, you);
          if (!def || def.length < atk.length) {
            const name = PIECE_NAME[p.type] || "piece";
            if (!threats.some((t) => t.includes(sq))) {
              threats.push(
                `Opponent is eyeing your ${name} on ${sq} — more attackers than defenders.`
              );
            }
          }
        }
      }
    }
  } catch {
    // ignore if attackers API unavailable
  }

  return threats.slice(0, 3); // keep it readable
}

function prosAndCons(game: Chess, move: Move): { pros: string[]; cons: string[] } {
  const pros: string[] = [];
  const cons: string[] = [];
  const g2 = new Chess(game.fen());
  g2.move(move);

  if (move.captured) {
    pros.push(`Wins material (${PIECE_NAME[move.captured] || "piece"}).`);
  }
  if (move.san.includes("+")) {
    pros.push("Gives check.");
  }
  if (move.san.includes("#")) {
    pros.push("Checkmate.");
  }
  if (move.san.includes("O")) {
    pros.push("King safety + rook activation.");
  }
  if (move.piece === "n" || move.piece === "b") {
    pros.push("Develops a minor piece.");
  }

  // Cons: hangs piece, early queen, etc.
  if (isHanging(g2, move.to as Square, move.color)) {
    const val = PIECE_VALUE[move.piece] || 0;
    if (val >= 3) {
      cons.push(`Your ${PIECE_NAME[move.piece]} may be recaptured.`);
    }
  }

  if (move.piece === "q" && game.moveNumber() <= 6 && !move.captured) {
    cons.push("Bringing the queen out early can let the opponent gain tempos by attacking it.");
  }

  if (move.piece === "k" && !move.san.includes("O") && game.moveNumber() <= 10) {
    cons.push("Moving the king early loses castling rights and weakens safety.");
  }

  if (pros.length === 0) pros.push("Improves coordination / space.");

  return { pros, cons };
}

export type AnalysisResult = {
  title: string;
  body: string;
  tone: "good" | "ok" | "bad" | "info";
};

function formatBlock(parts: string[]): string {
  return parts.filter(Boolean).join("\n\n");
}

export function analyzeLastMove(
  beforeFen: string,
  afterGame: Chess,
  lastSan: string,
  moverColor: "w" | "b"
): AnalysisResult {
  const before = new Chess(beforeFen);
  const after = afterGame;
  const moverName = moverColor === "w" ? "White" : "Black";
  const opponentName = moverColor === "w" ? "Black" : "White";

  const matBefore = materialScore(before, moverColor);
  const matAfter = materialScore(after, moverColor);
  const matDelta = matAfter - matBefore;

  const bestBefore = findBestMove(before);
  const bestNow = findBestMove(after);
  const sideToMove = after.turn();
  const sideName = sideToMove === "w" ? "White" : "Black";

  const sections: string[] = [];
  let tone: AnalysisResult["tone"] = "ok";
  let title = "Move analysis";

  // --- Last move summary ---
  if (after.isCheckmate()) {
    title = "Checkmate!";
    tone = "good";
    return {
      title,
      body: `${lastSan} is checkmate. ${moverName} wins. Great finishing move — the king had no safe square and no way to block or capture the attacker.`,
      tone,
    };
  }

  sections.push(`Last move: ${lastSan} (${moverName}).`);

  if (after.isCheck()) {
    sections.push(`${lastSan} gives check — ${opponentName} must respond.`);
  }

  if (matDelta >= 3) {
    title = "Strong move";
    tone = "good";
    sections.push(
      `Material: you gained about +${matDelta} points. That's a clear advantage.`
    );
  } else if (matDelta <= -3) {
    title = "Costly move";
    tone = "bad";
    sections.push(
      `Material: you lost about ${-matDelta} points. Look for safer ways to fight back.`
    );
  } else if (matDelta !== 0) {
    sections.push(
      matDelta > 0
        ? `Slight material gain (+${matDelta}).`
        : `Slight material loss (${matDelta}).`
    );
  }

  // Missed better move
  if (bestBefore && bestBefore.san !== lastSan) {
    const played = before.moves({ verbose: true }).find((m) => m.san === lastSan);
    const playedScore = played ? scoreMove(before, played) : 0;

    if (bestBefore.score >= playedScore + 25) {
      if (tone !== "bad") {
        title = "Better idea available";
        tone = "ok";
      }
      const why = explainMoveWhy(before, bestBefore.move);
      const { pros, cons } = prosAndCons(before, bestBefore.move);
      sections.push(
        `A stronger move was ${bestBefore.san}.\nWhy: ${why.join(" ")}`
      );
      sections.push(`Advantages: ${pros.join(" ")}`);
      if (cons.length) sections.push(`Trade-offs: ${cons.join(" ")}`);
    }
  } else if (bestBefore && bestBefore.san === lastSan) {
    title = "Good choice";
    tone = "good";
    const why = explainMoveWhy(before, bestBefore.move);
    sections.push(`Why this worked: ${why.join(" ")}`);
  }

  // Hanging pieces for the mover after their move
  const hanging: string[] = [];
  const board = after.board();
  for (let r = 0; r < 8; r++) {
    for (let f = 0; f < 8; f++) {
      const p = board[r][f];
      if (!p || p.color !== moverColor) continue;
      const sq = (String.fromCharCode(97 + f) + (8 - r)) as Square;
      if (isHanging(after, sq, moverColor) && (PIECE_VALUE[p.type] || 0) >= 3) {
        hanging.push(`${PIECE_NAME[p.type]} on ${sq}`);
      }
    }
  }
  if (hanging.length > 0) {
    title = "Danger";
    tone = "bad";
    sections.push(
      `Hanging piece(s): ${hanging.join(", ")}. Protect them or expect to lose material.`
    );
  }

  // Opponent threats now
  const threats = opponentThreats(after);
  if (threats.length > 0) {
    sections.push(`What ${opponentName} is doing / threats:\n• ${threats.join("\n• ")}`);
  }

  // Best move now with full explanation
  if (bestNow && !after.isGameOver()) {
    const why = explainMoveWhy(after, bestNow.move);
    const { pros, cons } = prosAndCons(after, bestNow.move);
    sections.push(
      `Best idea for ${sideName} now: ${bestNow.san}.\nWhy: ${why.join(" ")}\nAdvantages: ${pros.join(" ")}${cons.length ? `\nDisadvantages: ${cons.join(" ")}` : ""}`
    );
  }

  if (sections.length <= 1) {
    title = "Solid";
    tone = "good";
    sections.push(
      `${lastSan} is reasonable. Keep developing, castle when ready, and watch for loose pieces.`
    );
  }

  return { title, body: formatBlock(sections), tone };
}

export function analyzeCurrentPosition(game: Chess): AnalysisResult {
  if (game.isCheckmate()) {
    return {
      title: "Game over",
      body: "Checkmate. Replay the last few moves and ask: where did the defense fail? Was a piece left hanging? Was the king exposed?",
      tone: "info",
    };
  }
  if (game.isDraw()) {
    return {
      title: "Draw",
      body: "The game is drawn. Next time, try creating imbalances — attacks on the king, pawn breaks, or piece sacrifices for activity.",
      tone: "info",
    };
  }

  const best = findBestMove(game);
  const who = game.turn() === "w" ? "White" : "Black";
  const opponent = game.turn() === "w" ? "Black" : "White";
  const sections: string[] = [];

  if (game.isCheck()) {
    sections.push(`${who} is in check. You must get out of check before anything else.`);
  }

  const mat = materialScore(game, "w");
  if (Math.abs(mat) >= 3) {
    sections.push(
      mat > 0
        ? `Material: White is ahead by about ${mat} points.`
        : `Material: Black is ahead by about ${-mat} points.`
    );
  } else {
    sections.push("Material is roughly equal.");
  }

  const threats = opponentThreats(game);
  if (threats.length > 0) {
    sections.push(`Threats to watch:\n• ${threats.join("\n• ")}`);
  } else {
    sections.push(`No immediate hanging pieces detected for ${who}.`);
  }

  if (best) {
    const why = explainMoveWhy(game, best.move);
    const { pros, cons } = prosAndCons(game, best.move);
    sections.push(
      `Suggested move for ${who}: ${best.san}.\nWhy: ${why.join(" ")}\nAdvantages: ${pros.join(" ")}${cons.length ? `\nDisadvantages: ${cons.join(" ")}` : ""}`
    );
  }

  sections.push(
    `Tip: ${opponent} will try to punish loose pieces and uncastled kings. Stay solid.`
  );

  return {
    title: "Position overview",
    body: formatBlock(sections),
    tone: "info",
  };
}
