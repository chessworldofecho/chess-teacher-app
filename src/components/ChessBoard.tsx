"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Chess } from "chess.js";

// Dynamically import Chessboard with SSR disabled (required for Vercel/Next.js)
const Chessboard = dynamic(
  () => import("react-chessboard").then((mod) => mod.Chessboard),
  { ssr: false }
);

export default function ChessBoard() {
  const [game, setGame] = useState(new Chess());
  const [fen, setFen] = useState(game.fen());
  const [orientation, setOrientation] = useState<"white" | "black">("white");

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

  function onDrop(sourceSquare: string, targetSquare: string) {
    const move = makeAMove({
      from: sourceSquare,
      to: targetSquare,
      promotion: "q", // always promote to queen for simplicity
    });

    // Illegal move
    if (!move) return false;
    return true;
  }

  function resetGame() {
    const newGame = new Chess();
    setGame(newGame);
    setFen(newGame.fen());
  }

  function flipBoard() {
    setOrientation((o) => (o === "white" ? "black" : "white"));
  }

  return (
    <div className="chessboard-container">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Practice Board</h2>
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

      <Chessboard
        position={fen}
        onPieceDrop={onDrop}
        boardOrientation={orientation}
        customBoardStyle={{
          borderRadius: "8px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
        }}
        customDarkSquareStyle={{ backgroundColor: "#b58863" }}
        customLightSquareStyle={{ backgroundColor: "#f0d9b5" }}
      />

      <div className="mt-4 text-sm text-neutral-400">
        {game.isCheckmate() && <p className="text-red-400 font-medium">Checkmate!</p>}
        {game.isDraw() && <p className="text-yellow-400 font-medium">Draw</p>}
        {game.isCheck() && !game.isCheckmate() && (
          <p className="text-orange-400 font-medium">Check!</p>
        )}
        {!game.isGameOver() && (
          <p>
            Turn: <span className="text-white">{game.turn() === "w" ? "White" : "Black"}</span>
          </p>
        )}
      </div>
    </div>
  );
}
