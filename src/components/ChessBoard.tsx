"use client";

import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { Chess } from "chess.js";

// Dynamically import Chessboard with SSR disabled
const Chessboard = dynamic(
  () => import("react-chessboard").then((mod) => mod.Chessboard),
  { ssr: false }
);

type Difficulty = "beginner" | "easy" | "intermediate" | "hard" | "master";

const DIFFICULTY_SETTINGS: Record<
  Difficulty,
  { label: string; skill: number; depth: number; elo: string }
> = {
  beginner: { label: "Beginner", skill: 3, depth: 5, elo: "~800" },
  easy: { label: "Easy", skill: 6, depth: 8, elo: "~1200" },
  intermediate: { label: "Intermediate", skill: 10, depth: 12, elo: "~1600" },
  hard: { label: "Hard", skill: 15, depth: 15, elo: "~2000" },
  master: { label: "Master", skill: 20, depth: 18, elo: "~2500+" },
};

export default function ChessBoard() {
  const [game, setGame] = useState(new Chess());
  const [fen, setFen] = useState(game.fen());
  const [orientation, setOrientation] = useState<"white" | "black">("white");
  const [mode, setMode] = useState<"practice" | "computer">("practice");
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [isThinking, setIsThinking] = useState(false);
  const [playerColor, setPlayerColor] = useState<"white" | "black">("white");
  const engineRef = useRef<Worker | null>(null);

  // Initialize Stockfish engine
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      // Create a worker for Stockfish
      const stockfish = new Worker(
        new URL("stockfish/src/stockfish-nnue-16.js", import.meta.url)
      );

      engineRef.current = stockfish;

      stockfish.onmessage = (event) => {
        const message = event.data;

        if (typeof message === "string" && message.startsWith("bestmove")) {
          const move = message.split(" ")[1];
          if (move && move !== "(none)") {
            makeComputerMove(move);
          }
          setIsThinking(false);
        }
      };

      // Set up the engine
      stockfish.postMessage("uci");
      stockfish.postMessage("setoption name Skill Level value 10");
    } catch (err) {
      console.error("Failed to load Stockfish:", err);
    }

    return () => {
      engineRef.current?.terminate();
    };
  }, []);

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

  function makeComputerMove(uciMove: string) {
    const from = uciMove.substring(0, 2);
    const to = uciMove.substring(2, 4);
    const promotion = uciMove.length > 4 ? uciMove[4] : undefined;

    makeAMove({ from, to, promotion });
  }

  function askComputerForMove(currentFen: string) {
    if (!engineRef.current || isThinking) return;

    setIsThinking(true);
    const settings = DIFFICULTY_SETTINGS[difficulty];

    engineRef.current.postMessage(`setoption name Skill Level value ${settings.skill}`);
    engineRef.current.postMessage(`position fen ${currentFen}`);
    engineRef.current.postMessage(`go depth ${settings.depth}`);
  }

  function onDrop(sourceSquare: string, targetSquare: string) {
    // Only allow moves when it's the player's turn
    const isPlayerTurn =
      (playerColor === "white" && game.turn() === "w") ||
      (playerColor === "black" && game.turn() === "b");

    if (mode === "computer" && !isPlayerTurn) return false;
    if (isThinking) return false;

    const move = makeAMove({
      from: sourceSquare,
      to: targetSquare,
      promotion: "q",
    });

    if (!move) return false;

    // If playing against computer, ask for a reply
    if (mode === "computer") {
      // Small delay so the board updates first
      setTimeout(() => {
        const newGame = new Chess(game.fen());
        // We need the updated fen after the move
        const updated = new Chess();
        // Re-create from current state after move
        askComputerForMove(
          // Use the latest fen after the human move
          // We'll get it properly below
          ""
        );
      }, 300);
    }

    return true;
  }

  // Better version of onDrop that works with state
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

    // Computer's turn
    if (mode === "computer" && !gameCopy.isGameOver()) {
      setTimeout(() => {
        askComputerForMove(gameCopy.fen());
      }, 400);
    }

    return true;
  }

  function resetGame() {
    const newGame = new Chess();
    setGame(newGame);
    setFen(newGame.fen());
    setIsThinking(false);

    // If player is black, computer (white) moves first
    if (mode === "computer" && playerColor === "black") {
      setTimeout(() => {
        askComputerForMove(newGame.fen());
      }, 500);
    }
  }

  function flipBoard() {
    setOrientation((o) => (o === "white" ? "black" : "white"));
  }

  function startVsComputer(color: "white" | "black") {
    setMode("computer");
    setPlayerColor(color);
    setOrientation(color);
    resetGame();
  }

  return (
    <div className="chessboard-container">
      {/* Mode & Difficulty Controls */}
      <div className="mb-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            {mode === "practice" ? "Practice Board" : "Play vs Computer"}
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

        {/* Mode Switch */}
        <div className="flex gap-2">
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

        {/* Difficulty selector (only in computer mode) */}
        {mode === "computer" && (
          <div className="flex flex-wrap gap-2">
            {(Object.keys(DIFFICULTY_SETTINGS) as Difficulty[]).map((level) => (
              <button
                key={level}
                onClick={() => setDifficulty(level)}
                className={`px-3 py-1 text-xs rounded-full transition ${
                  difficulty === level
                    ? "bg-blue-600 text-white"
                    : "bg-neutral-800 hover:bg-neutral-700"
                }`}
              >
                {DIFFICULTY_SETTINGS[level].label} ({
                  DIFFICULTY_SETTINGS[level].elo
                })
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
            Computer is thinking...
          </p>
        )}
        {game.isCheckmate() && (
          <p className="text-red-400 font-medium">Checkmate! Game over.</p>
        )}
        {game.isDraw() && (
          <p className="text-yellow-400 font-medium">Draw!</p>
        )}
        {game.isCheck() && !game.isCheckmate() && (
          <p className="text-orange-400 font-medium">Check!</p>
        )}
        {!game.isGameOver() && !isThinking && (
          <p>
            Turn:{" "}
            <span className="text-white">
              {game.turn() === "w" ? "White" : "Black"}
            </span>
            {mode === "computer" && (
              <span className="text-neutral-500">
                {" "}
                ({game.turn() === "w" && playerColor === "white"
                  ? "Your turn"
                  : game.turn() === "b" && playerColor === "black"
                  ? "Your turn"
                  : "Computer"})
              </span>
            )}
          </p>
        )}
      </div>
    </div>
  );
}
