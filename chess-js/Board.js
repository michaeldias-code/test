import { Piece } from './Piece.js';

export class Board {
    constructor() {
        console.log("Board construído!");

        this.board = Array(64).fill(null);
        this.setupPieces();
    }

    setupPieces() {
        console.log("Board: posicionando peças...");

        // ---------------------------
        // Peões pretos (linha 2)
        // ---------------------------
        for (let i = 8; i < 16; i++)
            this.board[i] = new Piece("♟", "pretas");

        // ---------------------------
        // Peões brancos (linha 7)
        // ---------------------------
        for (let i = 48; i < 56; i++)
            this.board[i] = new Piece("♙", "brancas");

        // ---------------------------
        // Torres
        // ---------------------------
        this.board[0]  = new Piece("♜", "pretas");
        this.board[7]  = new Piece("♜", "pretas");
        this.board[56] = new Piece("♖", "brancas");
        this.board[63] = new Piece("♖", "brancas");

        // ---------------------------
        // Cavalos
        // ---------------------------
        this.board[1]  = new Piece("♞", "pretas");
        this.board[6]  = new Piece("♞", "pretas");
        this.board[57] = new Piece("♘", "brancas");
        this.board[62] = new Piece("♘", "brancas");

        // ---------------------------
        // Bispos
        // ---------------------------
        this.board[2]  = new Piece("♝", "pretas");
        this.board[5]  = new Piece("♝", "pretas");
        this.board[58] = new Piece("♗", "brancas");
        this.board[61] = new Piece("♗", "brancas");

        // ---------------------------
        // Rainhas
        // ---------------------------
        this.board[3]  = new Piece("♛", "pretas");
        this.board[59] = new Piece("♕", "brancas");

        // ---------------------------
        // Reis
        // ---------------------------
        this.board[4]  = new Piece("♚", "pretas");
        this.board[60] = new Piece("♔", "brancas");

        console.log("Board pronto!");
    }

    // Reseta o tabuleiro para a posição inicial
    resetBoard() {
        console.log("Resetando tabuleiro...");
        this.board = Array(64).fill(null);
        this.setupPieces();
    }

    movePiece(from, to) {
        this.board[to] = this.board[from];
        this.board[from] = null;
    }
}
