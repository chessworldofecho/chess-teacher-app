"use client";

import { useState, useMemo, useRef } from "react";
import dynamic from "next/dynamic";
import { Chess, Square } from "chess.js";

const Chessboard = dynamic(
  () => import("react-chessboard").then((mod) => mod.Chessboard),
  { ssr: false }
);

type Difficulty =
  | "beginner"
  | "easy"
  | "intermediate"
  | "hard"
  | "expert"
  | "master"
  | "god";
type GamePhase = "setup" | "playing";

const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  beginner: "Beginner (~100)",
  easy: "Easy (~600)",
  intermediate: "Intermediate (~1400)",
  hard: "Hard (~2000)",
  expert: "Expert (~2800)",
  master: "Master (~3600)",
  god: "God Mode (~5000)",
};

export default function ChessBoard() {
  const [game, setGame] = useState(new Chess());
  const [fen, setFen] = useState(game.fen());
  const [orientation, setOrientation] = useState<"white" | "black">("white");
  const [mode, setMode] = useState<"practice" | "computer">("computer");
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [isThinking, setIsThinking] = useState(false);
  const [playerColor, setPlayerColor] = useState<"white" | "black">("white");
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [optionSquares, setOptionSquares] = useState<Record<string, any>>({});
  const [phase, setPhase] = useState<GamePhase>("setup");

  const audioCtxRef = useRef<AudioContext | null>(null);

  function getAudioCtx() {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
    }
    return audioCtxRef.current;
  }

  // Short click / select sound
  function playClickSound() {
    try {
      const ctx = getAudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "square";
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.04);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.05);
    } catch {}
  }

  // Move sound
  function playMoveSound(isCapture = false) {
    try {
      const ctx = getAudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (isCapture) {
        osc.frequency.setValueAtTime(180, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.12);
        gain.gain.setValueAtTime(0.28, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.15);
      } else {
        osc.type = "sine";
        osc.frequency.setValueAtTime(420, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(280, ctx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.18, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.1);
      }
    } catch {}
  }

  // Check sound (urgent)
  function playCheckSound() {
    try {
      const ctx = getAudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(520, ctx.currentTime);
      osc.frequency.setValueAtTime(780, ctx.currentTime + 0.08);
      osc.frequency.setValueAtTime(520, ctx.currentTime + 0.16);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.25);
    } catch {}
  }

  // Checkmate sound (dramatic)
  function playCheckmateSound() {
    try {
      const ctx = getAudioCtx();
      // Two-tone triumphant / final sound
      [0, 0.18, 0.36].forEach((delay, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = i === 2 ? "sawtooth" : "square";
        const freqs = [330, 440, 660];
        osc.frequency.setValueAtTime(freqs[i], ctx.currentTime + delay);
        gain.gain.setValueAtTime(0.22, ctx.currentTime + delay);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + delay + 0.35);
        osc.start(ctx.currentTime + delay);
        osc.stop(ctx.currentTime + delay + 0.4);
      });
    } catch {}
  }

  function vibrate(pattern: number | number[]) {
    try {
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate(pattern);
      }
    } catch {}
  }

  function getMoveOptions(square: Square) {
    const moves = game.moves({ square, verbose: true });

    if (moves.length === 0) {
      setOptionSquares({});
      return false;
    }

    const newSquares: Record<string, any> = {};

    newSquares[square] = {
      background:
        "radial-gradient(circle, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.15) 40%, transparent 50%)",
    };

    moves.forEach((move) => {
      const isCapture = !!move.captured;
      newSquares[move.to] = {
        background: isCapture
          ? "radial-gradient(circle, transparent 55%, rgba(220, 38, 38, 0.5) 55%)"
          : "radial-gradient(circle, rgba(0,0,0,0.2) 25%, transparent 25%)",
        borderRadius: "50%",
      };
    });

    setOptionSquares(newSquares);
    return true;
  }

  function onSquareClick(square: Square) {
    if (phase !== "playing" || isThinking || game.isGameOver()) return;

    // Click feedback
    playClickSound();
    vibrate(12);

    if (selectedSquare) {
      if (selectedSquare === square) {
        setSelectedSquare(null);
        setOptionSquares({});
        return;
      }

      const moveSuccessful = tryMove(selectedSquare, square);

      if (moveSuccessful) {
        setSelectedSquare(null);
        setOptionSquares({});
        return;
      }

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
      result = gameCopy.move({ from, to, promotion: "q" });
    } catch {
      return false;
    }

    if (!result) return false;

    // Feedback
    playMoveSound(!!result.captured);
    vibrate(result.captured ? [30, 40, 30] : 25);

    // Special feedback for check / checkmate
    if (gameCopy.isCheckmate()) {
      playCheckmateSound();
      vibrate([80, 60, 80, 60, 120]);
    } else if (gameCopy.isCheck()) {
      playCheckSound();
      vibrate([40, 30, 40]);
    }

    setGame(gameCopy);
    setFen(gameCopy.fen());

    if (mode === "computer" && !gameCopy.isGameOver()) {
      makeComputerMove(gameCopy.fen());
    }

    return true;
  }

  function onPieceDrop(sourceSquare: string, targetSquare: string) {
    if (phase !== "playing" || isThinking) return false;

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

    const thinkTime =
      difficulty === "god"
        ? 900 + Math.random() * 700
        : difficulty === "master" || difficulty === "expert"
        ? 650 + Math.random() * 500
        : 400 + Math.random() * 500;

    setTimeout(() => {
      const tempGame = new Chess(currentFen);
      const moves = tempGame.moves({ verbose: true });

      if (moves.length === 0) {
        setIsThinking(false);
        return;
      }

      let chosen = moves[Math.floor(Math.random() * moves.length)];

      const captures = moves.filter((m) => m.captured);
      const checks = moves.filter((m) => m.san.includes("+"));
      const checkmates = moves.filter((m) => m.san.includes("#"));

      if (checkmates.length > 0) {
        chosen = checkmates[Math.floor(Math.random() * checkmates.length)];
      } else if (difficulty === "god" || difficulty === "master") {
        if (checks.length > 0 && Math.random() > 0.25) {
          chosen = checks[Math.floor(Math.random() * checks.length)];
        } else if (captures.length > 0 && Math.random() > 0.2) {
          chosen = captures[Math.floor(Math.random() * captures.length)];
        }
      } else if (difficulty === "expert" || difficulty === "hard") {
        if (checks.length > 0 && Math.random() > 0.4) {
          chosen = checks[Math.floor(Math.random() * checks.length)];
        } else if (captures.length > 0 && Math.random() > 0.35) {
          chosen = captures[Math.floor(Math.random() * captures.length)];
        }
      } else if (difficulty === "intermediate") {
        if (captures.length > 0 && Math.random() > 0.5) {
          chosen = captures[Math.floor(Math.random() * captures.length)];
        }
      }

      const gameCopy = new Chess(currentFen);
      const result = gameCopy.move(chosen);

      playMoveSound(!!result?.captured);
      vibrate(result?.captured ? [30, 40, 30] : 20);

      if (gameCopy.isCheckmate()) {
        playCheckmateSound();
        vibrate([80, 60, 80, 60, 120]);
      } else if (gameCopy.isCheck()) {
        playCheckSound();
        vibrate([40, 30, 40]);
      }

      setGame(gameCopy);
      setFen(gameCopy.fen());
      setIsThinking(false);
    }, thinkTime);
  }

  function startGame(color: "white" | "black", gameMode: "practice" | "computer") {
    setMode(gameMode);
    setPlayerColor(color);
    setOrientation(color);
    const newGame = new Chess();
    setGame(newGame);
    setFen(newGame.fen());
    setIsThinking(false);
    setSelectedSquare(null);
    setOptionSquares({});
    setPhase("playing");

    if (gameMode === "computer" && color === "black") {
      setTimeout(() => makeComputerMove(newGame.fen()), 500);
    }
  }

  function resetToSetup() {
    setPhase("setup");
    setGame(new Chess());
    setFen(new Chess().fen());
    setIsThinking(false);
    setSelectedSquare(null);
    setOptionSquares({});
  }

  function flipBoard() {
    setOrientation((o) => (o === "white" ? "black" : "white"));
  }

  const customSquareStyles = useMemo(() => {
    return { ...optionSquares };
  }, [optionSquares]);

  // ========== SETUP SCREEN ==========
  if (phase === "setup") {
    return (
      <div className="max-w-md mx-auto">
        <h2 className="text-2xl font-bold mb-6 text-center">Start a Game</h2>

        <div className="mb-8">
          <p className="text-sm text-neutral-400 mb-3">Choose mode</p>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setMode("computer")}
              className={`p-4 rounded-2xl border transition active:scale-95 ${
                mode === "computer"
                  ? "bg-emerald-600/20 border-emerald-500 text-white"
                  : "bg-neutral-900 border-neutral-700 text-neutral-300"
              }`}
            >
              <div className="text-2xl mb-1">🤖</div>
              <div className="font-medium">vs Bot</div>
            </button>
            <button
              onClick={() => setMode("practice")}
              className={`p-4 rounded-2xl border transition active:scale-95 ${
                mode === "practice"
                  ? "bg-emerald-600/20 border-emerald-500 text-white"
                  : "bg-neutral-900 border-neutral-700 text-neutral-300"
              }`}
            >
              <div className="text-2xl mb-1">🧘</div>
              <div className="font-medium">Practice</div>
            </button>
          </div>
        </div>

        <div className="mb-8">
          <p className="text-sm text-neutral-400 mb-3">Play as</p>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setPlayerColor("white")}
              className={`p-4 rounded-2xl border transition active:scale-95 ${
                playerColor === "white"
                  ? "bg-white text-black border-white"
                  : "bg-neutral-900 border-neutral-700 text-neutral-300"
              }`}
            >
              ♔ White
            </button>
            <button
              onClick={() => setPlayerColor("black")}
              className={`p-4 rounded-2xl border transition active:scale-95 ${
                playerColor === "black"
                  ? "bg-neutral-200 text-black border-neutral-200"
                  : "bg-neutral-900 border-neutral-700 text-neutral-300"
              }`}
            >
              ♚ Black
            </button>
          </div>
        </div>

        {mode === "computer" && (
          <div className="mb-8">
            <p className="text-sm text-neutral-400 mb-3">Difficulty</p>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(DIFFICULTY_LABELS) as Difficulty[]).map((level) => (
                <button
                  key={level}
                  onClick={() => setDifficulty(level)}
                  className={`px-3 py-2 text-sm rounded-xl transition active:scale-95 ${
                    difficulty === level
                      ? "bg-blue-600 text-white"
                      : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
                  }`}
                >
                  {DIFFICULTY_LABELS[level]}
                </button>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={() => startGame(playerColor, mode)}
          className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 rounded-2xl font-semibold text-lg transition active:scale-[0.98] shadow-lg shadow-emerald-900/30"
        >
          Start Game
        </button>
      </div>
    );
  }

  // ========== PLAYING SCREEN ==========
  return (
    <div className="w-full">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-2 px-1">
        <div className="text-sm text-neutral-400">
          {mode === "computer" ? (
            <>
              vs Bot • {DIFFICULTY_LABELS[difficulty]}
            </>
          ) : (
            "Practice Mode"
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={flipBoard}
            className="px-3 py-1.5 text-sm bg-neutral-800 hover:bg-neutral-700 rounded-lg transition active:scale-95"
          >
            Flip
          </button>
          <button
            onClick={resetToSetup}
            className="px-3 py-1.5 text-sm bg-neutral-800 hover:bg-neutral-700 rounded-lg transition active:scale-95"
          >
            New Game
          </button>
        </div>
      </div>

      {/* BIG BOARD - almost full width */}
      <div className="relative w-full mx-auto" style={{ maxWidth: "min(100%, 760px)" }}>
        <div className="rounded-2xl p-1 bg-gradient-to-br from-neutral-600 via-neutral-800 to-neutral-900 shadow-[0_0_60px_rgba(0,0,0,0.7)]">
          <div className="rounded-xl overflow-hidden border border-neutral-500/30">
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
              animationDuration={180}
            />
          </div>
        </div>

        {/* Grand Check / Checkmate overlay */}
        {game.isCheckmate() && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
            <div className="bg-red-600/95 text-white px-8 py-5 rounded-2xl shadow-2xl border-2 border-red-400 animate-pulse text-center max-w-[90%]">
              <div className="text-4xl md:text-5xl font-black tracking-wide">CHECKMATE</div>
              <div className="text-sm md:text-base mt-1 opacity-90 font-medium">
                {game.turn() === "w" ? "Black" : "White"} wins!
              </div>
            </div>
          </div>
        )}

        {game.isCheck() && !game.isCheckmate() && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
            <div className="bg-orange-500 text-white px-5 py-1.5 rounded-full shadow-lg font-bold text-sm tracking-wider border border-orange-300 animate-pulse">
              CHECK!
            </div>
          </div>
        )}
      </div>

      {/* Status text under board */}
      <div className="mt-4 text-center text-sm space-y-1">
        {isThinking && (
          <p className="text-blue-400 font-medium animate-pulse">
            Bot is thinking...
          </p>
        )}
        {game.isDraw() && !game.isCheckmate() && (
          <p className="text-yellow-400 font-medium text-base">Draw!</p>
        )}
        {!game.isGameOver() && !isThinking && (
          <p className="text-neutral-400">
            {game.turn() === "w" ? "White" : "Black"} to move
            {mode === "computer" && (
              <span className="text-neutral-500">
                {" "}
                •{" "}
                {(game.turn() === "w" && playerColor === "white") ||
                (game.turn() === "b" && playerColor === "black")
                  ? "Your turn"
                  : "Bot"}
              </span>
            )}
          </p>
        )}
      </div>
    </div>
  );
}
