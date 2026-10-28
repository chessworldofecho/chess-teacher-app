"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Chess } from "chess.js";

const Chessboard = dynamic(
  () => import("react-chessboard").then((mod) => mod.Chessboard),
  { ssr: false }
);

type Difficulty = "beginner" | "easy" | "intermediate" | "hard" | "master";

const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  beginner: "Beginner (~800)",
  easy: "Easy (~1200)",
  intermediate: "Intermediate (~1600)",
  hard: "Hard (~2000)",
  master: "Master (~2500+)",
};

export default function ChessBoard() {
  const [game, setGame] = useState(new Chess());
  const [fen, setFen] = useState(game.fen());
  const [orientation, setOrientation] = useState<"white" | "black">("white");
  const [mode, setMode] = useState<"practice" | "computer">("practice");
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [isThinking, setIsThinking] = useState(false);
  const [playerColor, setPlayerColor] = useState<"white" | "black">("white");

  function makeAMove(move: { from: string; to: string; promotion?: string }) {
    const gameCopy = new Chess(game.fen());
    try {
      const result = gameCopy.move(move);
      if (result) {
        setGame(gameCopy);
        setFen(gameCopy.fen());
        return true;
      }
    } catch {
      return false;
    }
    return false;
  }

  // Simple free bot (picks a random legal move)
  // Later we will replace this with real Stockfish WASM
  function makeComputerMove(currentFen: string) {
    setIsThinking(true);

    setTimeout(() => {
      const tempGame = new Chess(currentFen);
      const moves = tempGame.moves({ verbose: true });

      if (moves.length === 0) {
        setIsThinking(false);
        return;
      }

      // Very basic difficulty: higher levels prefer captures / checks a bit more
      let chosen = moves[Math.floor(Math.random() * moves.length)];

      if (difficulty === "hard" || difficulty === "master") {
        const captures = moves.filter((m) => m.captured);
        const checks = moves.filter((m) => m.san.includes("+"));
        if (checks.length > 0 && Math.random() > 0.4) {
          chosen = checks[Math.floor(Math.random() * checks.length)];
        } else if (captures.length > 0 && Math.random() > 0.3) {
          chosen = captures[Math.floor(Math.random() * captures.length)];
        }
      }

      const gameCopy = new Chess(currentFen);
      gameCopy.move(chosen);
      setGame(gameCopy);
      setFen(gameCopy.fen());
      setIsThinking(false);
    }, 600 + Math.random() * 800); // thinking delay
  }

  function handlePlayerMove(sourceSquare: string, targetSquare: string) {
    if (isThinking) return false;

    const isPlayerTurn =
      (playerColor === "white" && game.turn() === "w") ||
      (playerColor === "black" && game.turn() === "b");

    if (mode === "computer" && !isPlayerTurn) return false;

    const gameCopy = new Chess(game.fen());
    let result;
    try {
      result = gameCopy.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: "q",
      });
    } catch {
      return false;
    }

    if (!result) return false;

    setGame(gameCopy);
    setFen(gameCopy.fen());

    // Computer replies
    if (mode === "computer" && !gameCopy.isGameOver()) {
      makeComputerMove(gameCopy.fen());
    }

    return true;
  }

  function resetGame() {
    const newGame = new Chess();
    setGame(newGame);
    setFen(newGame.fen());
    setIsThinking(false);

    if (mode === "computer" && playerColor === "black") {
      setTimeout(() => makeComputerMove(newGame.fen()), 500);
    }
  }

  function flipBoard() {
    setOrientation((o) => (o === "white" ? "black" : "white"));
  }

  function startVsComputer(color: "white" | "black") {
    setMode("computer");
    setPlayerColor(color);
    setOrientation(color);
    const newGame = new Chess();
    setGame(newGame);
    setFen(newGame.fen());
    setIsThinking(false);

    if (color === "black") {
      setTimeout(() => makeComputerMove(newGame.fen()), 600);
    }
  }

  return (
    <div className="chessboard-container">
      <div className="mb-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            {mode === "practice" ? "Practice Board" : "Play vs Bot"}
          </h2>
          <div className="flex gap-2">
            <button
              onClick={flipBoard}
              className="px-3 py-1.5 text-sm bg-neutral-800 hover:bg-neutral-700 rounded-lg transition"
            >
              Flip
            </button>
            <button
              onClick={resetGame}
              className="px-3 py-1.5 text-sm bg-neutral-800 hover:bg-neutral-700 rounded-lg transition"
            >
              Reset
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => {
              setMode("practice");
              resetGame();
            }}
            className={`px-4 py-1.5 text-sm rounded-lg transition ${
              mode === "practice"
                ? "bg-emerald-600 text-white"
                : "bg-neutral-800 hover:bg-neutral-700"
            }`}
          >
            Free Practice
          </button>
          <button
            onClick={() => startVsComputer("white")}
            className={`px-4 py-1.5 text-sm rounded-lg transition ${
              mode === "computer" && playerColor === "white"
                ? "bg-emerald-600 text-white"
                : "bg-neutral-800 hover:bg-neutral-700"
            }`}
          >
            Play as White
          </button>
          <button
            onClick={() => startVsComputer("black")}
            className={`px-4 py-1.5 text-sm rounded-lg transition ${
              mode === "computer" && playerColor === "black"
                ? "bg-emerald-600 text-white"
                : "bg-neutral-800 hover:bg-neutral-700"
            }`}
          >
            Play as Black
          </button>
        </div>

        {mode === "computer" && (
          <div className="flex flex-wrap gap-2">
            {(Object.keys(DIFFICULTY_LABELS) as Difficulty[]).map((level) => (
              <button
                key={level}
                onClick={() => setDifficulty(level)}
                className={`px-3 py-1 text-xs rounded-full transition ${
                  difficulty === level
                    ? "bg-blue-600 text-white"
                    : "bg-neutral-800 hover:bg-neutral-700"
                }`}
              >
                {DIFFICULTY_LABELS[level]}
              </button>
            ))}
          </div>
        )}
      </div>

      <Chessboard
        position={fen}
        onPieceDrop={handlePlayerMove}
        boardOrientation={orientation}
        customBoardStyle={{
          borderRadius: "8px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
        }}
        customDarkSquareStyle={{ backgroundColor: "#b58863" }}
        customLightSquareStyle={{ backgroundColor: "#f0d9b5" }}
        arePiecesDraggable={!isThinking && !game.isGameOver()}
      />

      <div className="mt-4 text-sm text-neutral-400 space-y-1">
        {isThinking && (
          <p className="text-blue-400 font-medium animate-pulse">
            Bot is thinking...
          </p>
        )}
        {game.isCheckmate() && (
          <p className="text-red-400 font-medium">Checkmate! Game over.</p>
        )}
        {game.isDraw() && <p className="text-yellow-400 font-medium">Draw!</p>}
        {game.isCheck() && !game.isCheckmate() && (
          <p className="text-orange-400 font-medium">Check!</p>
        )}
        {!game.isGameOver() && !isThinking && (
          <p>
            Turn:{" "}
            <span className="text-white">
              {game.turn() === "w" ? "White" : "Black"}
            </span>
          </p>
        )}
      </div>
    </div>
  );
}
