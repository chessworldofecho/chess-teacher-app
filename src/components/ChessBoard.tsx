"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { Chess, Square } from "chess.js";

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
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [optionSquares, setOptionSquares] = useState<Record<string, any>>({});

  // Get legal moves for a square
  function getMoveOptions(square: Square) {
    const moves = game.moves({
      square,
      verbose: true,
    });

    if (moves.length === 0) {
      setOptionSquares({});
      return false;
    }

    const newSquares: Record<string, any> = {};

    // Highlight the selected piece
    newSquares[square] = {
      background:
        "radial-gradient(circle, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.15) 40%, transparent 50%)",
    };

    moves.forEach((move) => {
      const isCapture = move.captured;

      newSquares[move.to] = {
        background: isCapture
          ? "radial-gradient(circle, transparent 55%, rgba(220, 38, 38, 0.45) 55%)"
          : "radial-gradient(circle, rgba(0,0,0,0.18) 25%, transparent 25%)",
        borderRadius: "50%",
      };
    });

    setOptionSquares(newSquares);
    return true;
  }

  function onSquareClick(square: Square) {
    if (isThinking || game.isGameOver()) return;

    // If we already selected a piece, try to move
    if (selectedSquare) {
      // Clicked the same square again → deselect
      if (selectedSquare === square) {
        setSelectedSquare(null);
        setOptionSquares({});
        return;
      }

      // Try to make the move
      const moveSuccessful = tryMove(selectedSquare, square);

      if (moveSuccessful) {
        setSelectedSquare(null);
        setOptionSquares({});
        return;
      }

      // If move failed, check if user clicked another of their pieces
      const piece = game.get(square);
      if (piece && piece.color === game.turn()) {
        setSelectedSquare(square);
        getMoveOptions(square);
      } else {
        setSelectedSquare(null);
        setOptionSquares({});
      }
      return;
    }

    // No piece selected yet – select if it's the player's piece
    const piece = game.get(square);
    if (!piece) return;

    const isPlayerTurn =
      mode === "practice" ||
      (playerColor === "white" && game.turn() === "w") ||
      (playerColor === "black" && game.turn() === "b");

    if (!isPlayerTurn) return;
    if (piece.color !== game.turn()) return;

    setSelectedSquare(square);
    getMoveOptions(square);
  }

  function tryMove(from: string, to: string) {
    const gameCopy = new Chess(game.fen());
    let result;

    try {
      result = gameCopy.move({
        from,
        to,
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

  // Also keep drag & drop working
  function onPieceDrop(sourceSquare: string, targetSquare: string) {
    if (isThinking) return false;

    const isPlayerTurn =
      mode === "practice" ||
      (playerColor === "white" && game.turn() === "w") ||
      (playerColor === "black" && game.turn() === "b");

    if (mode === "computer" && !isPlayerTurn) return false;

    const success = tryMove(sourceSquare, targetSquare);
    if (success) {
      setSelectedSquare(null);
      setOptionSquares({});
    }
    return success;
  }

  function makeComputerMove(currentFen: string) {
    setIsThinking(true);

    setTimeout(() => {
      const tempGame = new Chess(currentFen);
      const moves = tempGame.moves({ verbose: true });

      if (moves.length === 0) {
        setIsThinking(false);
        return;
      }

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
    }, 500 + Math.random() * 700);
  }

  function resetGame() {
    const newGame = new Chess();
    setGame(newGame);
    setFen(newGame.fen());
    setIsThinking(false);
    setSelectedSquare(null);
    setOptionSquares({});

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
    setSelectedSquare(null);
    setOptionSquares({});

    if (color === "black") {
      setTimeout(() => makeComputerMove(newGame.fen()), 600);
    }
  }

  // Combine highlight styles
  const customSquareStyles = useMemo(() => {
    return { ...optionSquares };
  }, [optionSquares]);

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
              className="px-3 py-1.5 text-sm bg-neutral-800 hover:bg-neutral-700 rounded-lg transition active:scale-95"
            >
              Flip
            </button>
            <button
              onClick={resetGame}
              className="px-3 py-1.5 text-sm bg-neutral-800 hover:bg-neutral-700 rounded-lg transition active:scale-95"
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
            className={`px-4 py-1.5 text-sm rounded-lg transition active:scale-95 ${
              mode === "practice"
                ? "bg-emerald-600 text-white"
                : "bg-neutral-800 hover:bg-neutral-700"
            }`}
          >
            Free Practice
          </button>
          <button
            onClick={() => startVsComputer("white")}
            className={`px-4 py-1.5 text-sm rounded-lg transition active:scale-95 ${
              mode === "computer" && playerColor === "white"
                ? "bg-emerald-600 text-white"
                : "bg-neutral-800 hover:bg-neutral-700"
            }`}
          >
            Play as White
          </button>
          <button
            onClick={() => startVsComputer("black")}
            className={`px-4 py-1.5 text-sm rounded-lg transition active:scale-95 ${
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
                className={`px-3 py-1 text-xs rounded-full transition active:scale-95 ${
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

      {/* Luxurious board container */}
      <div className="relative rounded-2xl p-1.5 bg-gradient-to-br from-neutral-700 via-neutral-800 to-neutral-900 shadow-[0_0_40px_rgba(0,0,0,0.5)]">
        <div className="rounded-xl overflow-hidden border border-neutral-600/40">
          <Chessboard
            position={fen}
            onSquareClick={onSquareClick}
            onPieceDrop={onPieceDrop}
            boardOrientation={orientation}
            customSquareStyles={customSquareStyles}
            customBoardStyle={{
              borderRadius: "0px",
            }}
            customDarkSquareStyle={{
              backgroundColor: "#769656",
            }}
            customLightSquareStyle={{
              backgroundColor: "#eeeed2",
            }}
            arePiecesDraggable={!isThinking && !game.isGameOver()}
            animationDuration={200}
          />
        </div>
      </div>

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
