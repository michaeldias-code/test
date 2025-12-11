// AI_Medium.js
// Estratégia "Medium": Heurística gulosa com noções de perigo e posicionamento.
// Agora checa peças ameaçadas no próximo turno inimigo.

export class AI_Medium {
    constructor(board, validator, enPassant) {
        this.board = board;
        this.validator = validator;
        this.enPassant = enPassant;

        // Guarda o último movimento para evitar repetição tola
        this.lastMove = null;

        // Tabela de valores para trocas
        this.pieceValueBySymbol = {
            "♙": 10, "♟": 10,   // Peão
            "♘": 30, "♞": 30,   // Cavalo
            "♗": 30, "♝": 30,   // Bispo
            "♖": 50, "♜": 50,   // Torre
            "♕": 90, "♛": 90,   // Rainha
            "♔": 900, "♚": 900  // Rei
        };

        // Bônus posicional para casas centrais (e4, d4, e5, d5)
        this.centerSquares = [27, 28, 35, 36];
    }

    makeMove(color) {
        console.log("🤖 AI Medium Pensando...");
        const enemyColor = color === "brancas" ? "pretas" : "brancas";

        // 1) Coletar todos os movimentos legais
        let myMoves = this.getAllMovesForColor(color);
        if (myMoves.length === 0) return null;

        // 2) Verifica peças ameaçadas imediatamente
        const threatened = this.getThreatenedPieces(color, enemyColor);

        // 3) Filtrar movimentos repetitivos inúteis
        myMoves = myMoves.filter(m => !this.isBadRepeat(m, enemyColor));
        if (myMoves.length === 0) myMoves = this.getAllMovesForColor(color);

        // 4) Capturas seguras ou vantajosas
        const captureMoves = myMoves.filter(m => m.capturedPiece !== null)
            .filter(m => {
                const myPieceValue = this.valueOfPiece(m.piece);
                const victimValue = this.valueOfPiece(m.capturedPiece);
                // Só captura se não perder valor maior ou igual
                return (victimValue - myPieceValue) >= 0 && !this.wouldBeAttackedAfterMove(m, enemyColor);
            });

        if (captureMoves.length > 0) {
            captureMoves.sort((a, b) => {
                return this.evaluateCapture(b, enemyColor) - this.evaluateCapture(a, enemyColor);
            });
            return this.executeMove(captureMoves[0]);
        }

        // 5) Movimentos seguros: evita colocar ou deixar peças ameaçadas
        const safeMoves = myMoves.filter(m => {
            const willBeAttacked = this.wouldBeAttackedAfterMove(m, enemyColor);
            // Permite mover se proteger uma peça ameaçada ou não criar nova ameaça
            const savesThreatened = threatened.includes(m.from);
            return !willBeAttacked || savesThreatened;
        });

        if (safeMoves.length > 0) {
            safeMoves.sort((a, b) => {
                const scoreA = this.evaluatePositionalScore(a) + Math.random() * 5;
                const scoreB = this.evaluatePositionalScore(b) + Math.random() * 5;
                return scoreB - scoreA;
            });
            return this.executeMove(safeMoves[0]);
        }

        // 6) Fallback: Menos pior
        const sortedByRisk = myMoves.sort((a, b) => {
            return this.valueOfPiece(a.piece) - this.valueOfPiece(b.piece);
        });
        return this.executeMove(sortedByRisk[0]);
    }

    /* ---------------- Heurísticas e Avaliações ---------------- */

    evaluateCapture(move, enemyColor) {
        const victimValue = this.valueOfPiece(move.capturedPiece);
        const myPieceValue = this.valueOfPiece(move.piece);
        const isSuicide = this.wouldBeAttackedAfterMove(move, enemyColor);
        return isSuicide ? victimValue - myPieceValue : victimValue;
    }

    evaluatePositionalScore(move) {
        let score = 0;
        if (this.centerSquares.includes(move.to)) score += 5;
        if (move.piece.tipo === "♙" || move.piece.tipo === "♟") score += 2;
        return score;
    }

    isBadRepeat(move, enemyColor) {
        if (!this.lastMove) return false;
        const isReverse = (move.from === this.lastMove.to && move.to === this.lastMove.from);
        if (!isReverse) return false;
        if (move.capturedPiece) return false;
        if (this.willRemoveCheck(move)) return false;
        const amIAttackedHere = this.isSquareAttacked(move.from, this.getAllMovesForColor(enemyColor));
        const willBeSafeThere = !this.wouldBeAttackedAfterMove(move, enemyColor);
        if (amIAttackedHere && willBeSafeThere) return false;
        return true;
    }

    /* ---------------- Simulações e Utilitários ---------------- */

    executeMove(move) {
        this.applyMoveWithEPAndRegister(move);
        this.lastMove = { from: move.from, to: move.to };
        return move;
    }

    wouldBeAttackedAfterMove(move, enemyColor) {
        let attacked = false;
        this.simulateMove(move, () => {
            const enemyMoves = this.getAllMovesForColor(enemyColor);
            attacked = enemyMoves.some(em => em.to === move.to);
        });
        return attacked;
    }

    simulateMove(move, callback) {
        const originalTo = this.board.board[move.to];
        const originalFrom = this.board.board[move.from];
        this.board.board[move.to] = originalFrom;
        this.board.board[move.from] = null;
        try { callback(); } catch(e) { console.error(e); }
        this.board.board[move.from] = originalFrom;
        this.board.board[move.to] = originalTo;
    }

    getAllMovesForColor(color) {
        const moves = [];
        const boardArr = this.board.board;
        for (let i = 0; i < 64; i++) {
            const piece = boardArr[i];
            if (piece && piece.cor === color) {
                const possibleIndices = this.validator.getPossibleMoves(i);
                possibleIndices.forEach(dest => {
                    moves.push({
                        from: i,
                        to: dest,
                        piece: piece,
                        capturedPiece: boardArr[dest]
                    });
                });
            }
        }
        return moves;
    }

    isSquareAttacked(index, enemyMoves) {
        return enemyMoves.some(m => m.to === index);
    }

    willRemoveCheck(move) {
        let safe = false;
        const myColor = move.piece.cor;
        this.simulateMove(move, () => {
            safe = !this.validator.isKingInCheck(myColor);
        });
        return safe;
    }

    valueOfPiece(piece) {
        if (!piece) return 0;
        return this.pieceValueBySymbol[piece.tipo] || 1;
    }

    applyMoveWithEPAndRegister(move) {
        const piece = this.board.board[move.from];
        let epCapturedPos = null;
        if (this.enPassant?.isEnPassantMove) {
            epCapturedPos = this.enPassant.isEnPassantMove(move.from, move.to, piece);
        }
        if (epCapturedPos !== null) {
            this.board.movePiece(move.from, move.to, epCapturedPos);
        } else {
            this.board.movePiece(move.from, move.to);
        }
        if (this.enPassant?.registerDoubleStep) {
            this.enPassant.registerDoubleStep(move.from, move.to, piece);
        }
    }

    // ---------------- NOVO ----------------
    // Retorna índices das peças ameaçadas no próximo turno inimigo
    getThreatenedPieces(color, enemyColor) {
        const threatened = [];
        const myPieces = this.getAllMovesForColor(color).map(m => m.from);
        const enemyMoves = this.getAllMovesForColor(enemyColor);
        myPieces.forEach(pos => {
            if (enemyMoves.some(m => m.to === pos)) threatened.push(pos);
        });
        return threatened;
    }
}
