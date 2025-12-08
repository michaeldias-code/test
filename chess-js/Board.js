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

    notationToIndex(pos) {
        const files = "abcdefgh";
        const file = files.indexOf(pos[0].toLowerCase()); // coluna: a-h
        const rank = 8 - parseInt(pos[1]);               // linha: 1-8
        if (file < 0 || rank < 0 || rank > 7) return null; // checa validade
        return rank * 8 + file;
    }

    
    // ||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||
    // |||||||||||||||---------------- Testes simulados ----------------|||||||||||||||
    // ||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||
    
    getPiece(posNotation) {
        let posIndex = this.notationToIndex(posNotation);
        return this.board[posIndex];
    }

    setPiece(pos, piece) {
        this.board[pos] = piece;
    }

    printBoard() {
        //const display = this.board.map(p => p ? p.tipo : ".").reduce((acc, val, idx) => {
        //    acc += val + " ";
        //    if ((idx + 1) % 8 === 0) acc += "\n";
        //    return acc;
        //}, "");
        //console.log(display);
        console.log(""); // linha extra para separar
        for (let r = 0; r < 8; r++) {
            let row = "";
            for (let c = 0; c < 8; c++) {
                const p = this.board[r * 8 + c];
                row += p ? p.tipo : ".";
                row += " ";
            }
            console.log(row);
        }
        console.log(""); // linha extra para separar
    }
    
    
    testCommand(command, args) {
        switch (command) {
            case "enpassant":
                // Simula uma captura en passant
                // Retorna sempre o que esperamos em teste manual
                return {
                    legal: true,
                    captured: this.enPassantTarget !== null ? this.enPassantTarget : null,
                    from: args.from,
                    to: args.to
                };
            default:
                return { error: "Comando não reconhecido" };
        }
    }
}





