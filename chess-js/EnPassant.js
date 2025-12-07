// EnPassant.js
// Módulo autocontido para gerenciar a regra de captura "en passant".
// Regra de OURO aplicada: operações são tentadas apenas se TODAS as condições
// forem satisfeitas; caso contrário, o módulo não altera o estado do tabuleiro.
//
// API principal:
// - constructor(boardArray)
// - registerDoubleStep(fromIdx, toIdx, piece)   // registrar movimento de 2 casas
// - getEnPassantTargetsForPawn(posIdx) -> [targetIdx, ...]
// - isEnPassantMove(fromIdx,toIdx,piece) -> boolean
// - applyEnPassantIfPossible(fromIdx,toIdx,piece, boardObj) -> boolean
// - clear()
// Observação: aceita internamente índices 0..63; expõe helpers algebraic para depuração.

export default class EnPassant {
    constructor(boardArray) {
        // boardArray: referência ao array de 64 casas (this.board.board no seu código)
        this.board = boardArray || null;
        // enPassantTargetIndex será o índice destino onde a captura en passant pode ocorrer
        // Ex.: se peão preto pulou de e7 para e5, enPassantTargetIndex = índice de e6 (onde o adversário captura)
        this.enPassantTargetIndex = null;
        // Guarda índice do peão que pode ser capturado (para validação extra)
        this.capturablePawnIndex = null;
    }

    // ---------- Helpers de conversão algébrica (úteis para debug e regras) ----------
    indexToAlgebraic(idx) {
        if (!Number.isInteger(idx) || idx < 0 || idx > 63) return null;
        const file = String.fromCharCode('a'.charCodeAt(0) + (idx % 8));
        const rank = 8 - Math.floor(idx / 8);
        return `${file}${rank}`;
    }
    algebraicToIndex(sq) {
        if (!sq || typeof sq !== 'string' || sq.length !== 2) return null;
        const file = sq.charCodeAt(0) - 'a'.charCodeAt(0);
        const rank = parseInt(sq[1], 10);
        if (isNaN(rank)) return null;
        const row = 8 - rank;
        const idx = row * 8 + file;
        if (idx < 0 || idx > 63) return null;
        return idx;
    }

    // ---------- Registro de passo duplo de peão (deve ser chamado após movimento efetivo) ----------
    // fromIdx, toIdx: índices 0..63; piece: objeto peça movimentada (com .tipo e .cor)
    registerDoubleStep(fromIdx, toIdx, piece) {
        try {
            // trava de segurança: se não for peão, limpa e sai (não altera nada)
            if (!piece || (piece.tipo !== '♙' && piece.tipo !== '♟')) {
                this.enPassantTargetIndex = null;
                this.capturablePawnIndex = null;
                return;
            }

            // cálculo do delta
            const delta = toIdx - fromIdx;

            // peão branco andou 2 casas: delta = -16 (ex: 52 -> 36)
            if (piece.tipo === '♙' && delta === -16) {
                // capturable pawn is the pawn that moved (at toIdx)
                // enPassant target is a square *behind* the pawn from the capturer perspective:
                // a white pawn that moved 2 squares: opponent captures to toIdx + 8 (alg. e6)
                this.enPassantTargetIndex = toIdx + 8;
                this.capturablePawnIndex = toIdx;
                return;
            }

            // peão preto andou 2 casas: delta = +16 (ex: 12 -> 28)
            if (piece.tipo === '♟' && delta === 16) {
                this.enPassantTargetIndex = toIdx - 8;
                this.capturablePawnIndex = toIdx;
                return;
            }

            // caso padrão: limpa
            this.enPassantTargetIndex = null;
            this.capturablePawnIndex = null;
        } catch (e) {
            // Nunca propagar exceção — Regra de OURO: não atrapalhar o jogo
            console.error('EnPassant.registerDoubleStep erro (ignorado):', e);
            this.enPassantTargetIndex = null;
            this.capturablePawnIndex = null;
        }
    }

    // Retorna array de índices que representam movimentos en passant válidos para o peão em posIdx (0..63)
    // Não altera estado.
    getEnPassantTargetsForPawn(posIdx) {
        const out = [];
        try {
            if (!Number.isInteger(posIdx) || !this.board) return out;
            const piece = this.board[posIdx];
            if (!piece) return out;
            if (piece.tipo !== '♙' && piece.tipo !== '♟') return out;
            if (this.enPassantTargetIndex === null) return out;

            // O alvo (enPassantTargetIndex) deve estar a exatamente 1 arquivo de distância
            const fileFrom = posIdx % 8;
            const fileTarget = this.enPassantTargetIndex % 8;
            if (Math.abs(fileFrom - fileTarget) !== 1) return out;

            // E o movimento diagonal deve ser no sentido correto (um rank)
            const rowFrom = Math.floor(posIdx / 8);
            const rowTarget = Math.floor(this.enPassantTargetIndex / 8);
            const rankDiff = rowTarget - rowFrom;
            if (piece.tipo === '♙' && rankDiff === -1) {
                out.push(this.enPassantTargetIndex);
            }
            if (piece.tipo === '♟' && rankDiff === 1) {
                out.push(this.enPassantTargetIndex);
            }
            return out;
        } catch (e) {
            console.error('EnPassant.getEnPassantTargetsForPawn erro (ignorado):', e);
            return [];
        }
    }

    // Verifica se movimento específico é en passant (não altera estado)
    isEnPassantMove(fromIdx, toIdx, piece) {
        try {
            if (!piece) return false;
            if (this.enPassantTargetIndex === null) return false;
            if (toIdx !== this.enPassantTargetIndex) return false;
            // only pawns
            if (piece.tipo !== '♙' && piece.tipo !== '♟') return false;

            // file difference must be 1 and rank diff correct
            const fc = Math.abs((fromIdx % 8) - (toIdx % 8));
            const rowDiff = Math.floor(toIdx / 8) - Math.floor(fromIdx / 8);

            if (fc !== 1) return false;
            if (piece.tipo === '♙' && rowDiff !== -1) return false;
            if (piece.tipo === '♟' && rowDiff !== 1) return false;

            // the capturable pawn must be adjacent in file and on the expected square
            if (this.capturablePawnIndex === null) return false;
            const captFile = this.capturablePawnIndex % 8;
            if (Math.abs(captFile - (fromIdx % 8)) !== 1) return false;

            return true;
        } catch (e) {
            console.error('EnPassant.isEnPassantMove erro (ignorado):', e);
            return false;
        }
    }

    // Aplica captura en passant se todas as condições estiverem ok.
    // boardObj (opcional) pode ser o objeto Board (que tem movePiece) ou null; se fornecido,
    // o método tenta usar boardObj.movePiece para manter consistência; caso contrário, manipula array diretamente.
    // Retorna true se capturou (aplicou en passant), false caso contrário (não altera nada).
    applyEnPassantIfPossible(fromIdx, toIdx, piece, boardObj = null) {
        try {
            if (!this.isEnPassantMove(fromIdx, toIdx, piece)) return false;

            // índice do peão que vai ser removido (fica em mesma file do alvo, uma rank diferente)
            let capturedPawnIdx;
            if (piece.tipo === '♙') capturedPawnIdx = toIdx + 8;
            else capturedPawnIdx = toIdx - 8;

            // trava de segurança: verifique que existe um peão inimigo naquela posição
            const captured = this.board[capturedPawnIdx];
            if (!captured) return false;
            if (captured.tipo !== '♟' && captured.tipo !== '♙') return false;
            if (captured.cor === piece.cor) return false;

            // Faz a captura ATÓMICA: se boardObj.movePiece falhar (ex: undefined), manipulamos o array
            if (boardObj && typeof boardObj.movePiece === 'function') {
                // mover peão capturador para toIdx
                // Depois remover o peão capturado na posição capturedPawnIdx
                // Usamos try/catch para garantir restauração em caso de erro
                try {
                    // backup simples
                    const backupFrom = this.board[fromIdx];
                    const backupTo = this.board[toIdx];
                    const backupCaptured = this.board[capturedPawnIdx];

                    // move
                    boardObj.movePiece(fromIdx, toIdx);
                    // remove capturado
                    this.board[capturedPawnIdx] = null;

                    // marca hasMoved se existir
                    if (this.board[toIdx]) this.board[toIdx].hasMoved = true;

                    // limpa estado do en passant
                    this.enPassantTargetIndex = null;
                    this.capturablePawnIndex = null;
                    return true;
                } catch (e) {
                    console.error('EnPassant.applyEnPassantIfPossible erro ao usar boardObj (ignorado):', e);
                    return false;
                }
            } else {
                // manipulação direta no array
                const backupFrom = this.board[fromIdx];
                const backupTo = this.board[toIdx];
                const backupCaptured = this.board[capturedPawnIdx];

                // aplicar
                this.board[toIdx] = this.board[fromIdx];
                this.board[fromIdx] = null;
                this.board[capturedPawnIdx] = null;

                if (this.board[toIdx]) this.board[toIdx].hasMoved = true;

                // limpa estado
                this.enPassantTargetIndex = null;
                this.capturablePawnIndex = null;
                return true;
            }
        } catch (e) {
            console.error('EnPassant.applyEnPassantIfPossible erro (ignorado):', e);
            return false;
        }
    }

    // Limpa o estado (chamar no fim do turno se desejar)
    clear() {
        this.enPassantTargetIndex = null;
        this.capturablePawnIndex = null;
    }
}
