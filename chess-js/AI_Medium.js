// AI_Medium.js
// Estratégia "Medium": Heurística gulosa com noções de perigo e posicionamento.
// Regras: Prioriza Xeque-Mate > Capturas (Melhores > Piores) > Segurança > Centro.

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

        // Bônus posicional para casas centrais (e4, d4, e5, d5 e adjacentes)
        // Índices do array 0-63
        this.centerSquares = [27, 28, 35, 36]; 
    }

    makeMove(color) {
        console.log("🤖 AI Medium Pensando...");
        const enemyColor = color === "brancas" ? "pretas" : "brancas";

        // 1) Coletar todos os movimentos legais
        let myMoves = this.getAllMovesForColor(color);
        if (myMoves.length === 0) return null;

        // 2) Tentar Xeque-Mate IMEDIATO (Instinto Assassino)
        const mateMove = myMoves.find(m => this.isCheckmateMove(m, enemyColor));
        if (mateMove) {
            console.log("💀 Xeque-mate encontrado!");
            return this.executeMove(mateMove);
        }

        // 3) Filtrar movimentos repetitivos inúteis
        // Remove movimentos que voltam para a casa anterior sem motivo (exceto capturas ou sair de ataque)
        myMoves = myMoves.filter(m => !this.isBadRepeat(m, enemyColor));
        if (myMoves.length === 0) {
            // Se filtrou tudo, recupera os originais para não travar
            myMoves = this.getAllMovesForColor(color);
        }

        // 4) Lógica de Captura (REGRA: Se existe captura, DEVE capturar)
        const captureMoves = myMoves.filter(m => m.capturedPiece !== null);
        
        if (captureMoves.length > 0) {
            // Ordena as capturas da "Melhor" para a "Pior"
            // Critério: (Valor da Vítima) - (Risco de perder minha peça)
            captureMoves.sort((a, b) => {
                return this.evaluateCapture(b, enemyColor) - this.evaluateCapture(a, enemyColor);
            });

            // Pega a melhor captura disponível
            // (Mesmo que seja ruim, a regra diz que se há captura, a IA faz)
            const bestCapture = captureMoves[0];
            return this.executeMove(bestCapture);
        }

        // 5) Movimentos Seguros (Não atacados) com Bônus Posicional
        // Filtra movimentos que não colocam a peça sob ataque imediato
        const safeMoves = myMoves.filter(m => !this.wouldBeAttackedAfterMove(m, enemyColor));

        if (safeMoves.length > 0) {
            // Escolhe o movimento que dá maior controle de centro ou avança peões
            // Adiciona aleatoriedade leve para não ficar robótico demais
            safeMoves.sort((a, b) => {
                const scoreA = this.evaluatePositionalScore(a) + Math.random() * 5;
                const scoreB = this.evaluatePositionalScore(b) + Math.random() * 5;
                return scoreB - scoreA;
            });
            return this.executeMove(safeMoves[0]);
        }

        // 6) Fallback: Se tudo é perigoso, escolhe o "Menos Pior"
        // (Tenta salvar a peça mais valiosa ou perder a menos valiosa)
        const sortedByRisk = myMoves.sort((a, b) => {
            return this.valueOfPiece(a.piece) - this.valueOfPiece(b.piece);
        });
        
        return this.executeMove(sortedByRisk[0]);
    }

    /* ---------------- Heurísticas e Avaliações ---------------- */

    // Avalia o ganho líquido de uma captura
    evaluateCapture(move, enemyColor) {
        const victimValue = this.valueOfPiece(move.capturedPiece);
        const myPieceValue = this.valueOfPiece(move.piece);
        
        // Simula se minha peça será capturada de volta
        const isSuicide = this.wouldBeAttackedAfterMove(move, enemyColor);

        if (isSuicide) {
            // Se eu capturo e morro, o lucro é (Vítima - Eu)
            return victimValue - myPieceValue;
        }
        // Se eu capturo e fico seguro, o lucro é total
        return victimValue;
    }

    // Avalia posicionamento (Centro vale mais)
    evaluatePositionalScore(move) {
        let score = 0;
        // Bônus por ir para o centro
        if (this.centerSquares.includes(move.to)) score += 5;
        // Bônus leve por avançar peão (promover jogo)
        if (move.piece.tipo === "♙" || move.piece.tipo === "♟") score += 2;
        return score;
    }

    // Verifica se é uma repetição ruim
    isBadRepeat(move, enemyColor) {
        if (!this.lastMove) return false;

        // Verifica se é o inverso do movimento anterior (A->B e agora B->A)
        const isReverse = (move.from === this.lastMove.to && move.to === this.lastMove.from);
        
        if (!isReverse) return false;

        // EXCEÇÕES: Permitir voltar se...
        if (move.capturedPiece) return false; // ...for para capturar
        if (this.willRemoveCheck(move)) return false; // ...for para salvar o Rei
        
        // ... ou se a casa atual (from) está sob ataque e voltar salva a peça
        const amIAttackedHere = this.isSquareAttacked(move.from, this.getAllMovesForColor(enemyColor));
        const willBeSafeThere = !this.wouldBeAttackedAfterMove(move, enemyColor);
        
        if (amIAttackedHere && willBeSafeThere) return false; // Fugir é permitido

        return true; // Caso contrário, proibir o "vai e vem"
    }

    /* ---------------- Simulações e Utilitários ---------------- */

    // Executa o movimento e registra para o histórico interno da IA
    executeMove(move) {
        this.applyMoveWithEPAndRegister(move);
        this.lastMove = { from: move.from, to: move.to };
        return move;
    }

    // Verifica se um movimento resulta em xeque-mate no inimigo
    isCheckmateMove(move, enemyColor) {
        let isMate = false;
        this.simulateMove(move, () => {
            // Se o inimigo não tem movimentos legais e o rei está em xeque
            const enemyLegalMoves = this.getAllMovesForColor(enemyColor); // Recurso caro, mas ok para Medium
            // Nota: getAllMovesForColor já verifica movimentos possíveis. 
            // Precisamos saber se o rei DELE está em xeque agora.
            if (this.validator.isKingInCheck(enemyColor) && enemyLegalMoves.length === 0) {
                isMate = true;
            }
        });
        return isMate;
    }

    // Simula se a peça seria atacada após o movimento
    wouldBeAttackedAfterMove(move, enemyColor) {
        let attacked = false;
        this.simulateMove(move, () => {
            const enemyMoves = this.getAllMovesForColor(enemyColor);
            attacked = enemyMoves.some(em => em.to === move.to);
        });
        return attacked;
    }

    // Simula o movimento no array (sem alterar a UI ou estado permanente)
    simulateMove(move, callback) {
        const originalTo = this.board.board[move.to];
        const originalFrom = this.board.board[move.from];
        
        // Aplica
        this.board.board[move.to] = originalFrom;
        this.board.board[move.from] = null;

        try {
            callback();
        } catch(e) { console.error(e); }

        // Reverte
        this.board.board[move.from] = originalFrom;
        this.board.board[move.to] = originalTo;
    }

    // Retorna todos os movimentos possíveis + metadados
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
                        capturedPiece: boardArr[dest] // null se vazio
                    });
                });
            }
        }
        return moves;
    }

    // Verifica se a casa está atacada (utilitário simples)
    isSquareAttacked(index, enemyMoves) {
        return enemyMoves.some(m => m.to === index);
    }

    // Verifica se o movimento tira o próprio rei de xeque (para lógica de repetição)
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

    // Função de aplicação real (herdada da sua versão anterior)
    applyMoveWithEPAndRegister(move) {
        const piece = this.board.board[move.from];
        let epCapturedPos = null;
        
        // Lógica En Passant
        if (this.enPassant?.isEnPassantMove) {
            epCapturedPos = this.enPassant.isEnPassantMove(move.from, move.to, piece);
        }

        // Executa no tabuleiro real
        if (epCapturedPos !== null) {
            this.board.movePiece(move.from, move.to, epCapturedPos);
        } else {
            this.board.movePiece(move.from, move.to);
        }

        // Registra Double Step para En Passant futuro
        if (this.enPassant?.registerDoubleStep) {
            this.enPassant.registerDoubleStep(move.from, move.to, piece);
        }
    }
}
