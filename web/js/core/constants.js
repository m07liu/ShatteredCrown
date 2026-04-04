export const BOARD_SIZE = 8;

export const Team = { WHITE: "White", BLACK: "Black" };

export const PieceType = {
  PAWN:   "Pawn",
  ROOK:   "Rook",
  KNIGHT: "Knight",
  BISHOP: "Bishop",
  QUEEN:  "Queen",
  KING:   "King",
};

export const SYMBOLS = {
  [Team.WHITE]: {
    [PieceType.KING]:   "♔",
    [PieceType.QUEEN]:  "♕",
    [PieceType.ROOK]:   "♖",
    [PieceType.BISHOP]: "♗",
    [PieceType.KNIGHT]: "♘",
    [PieceType.PAWN]:   "♙",
  },
  [Team.BLACK]: {
    [PieceType.KING]:   "♚",
    [PieceType.QUEEN]:  "♛",
    [PieceType.ROOK]:   "♜",
    [PieceType.BISHOP]: "♝",
    [PieceType.KNIGHT]: "♞",
    [PieceType.PAWN]:   "♟",
  },
};
