// MoveValidator.js (corrigido e compatível com sua estrutura original)
// Objetivo: manter a API/estrutura do seu arquivo, mas corrigir bugs
// - roque curto e longo
// - en passant (funcional)
// - movimentos básicos (todas as peças)
// - checagens de xeque / xeque-mate
// - simulação de movimento segura (wouldNotLeaveKingInCheck)
// - sem dependências externas

export class MoveValidator {
    constructor(boardArray) {
        // boardArray deve ser um array de 64 entradas, cada uma null ou um objeto:
        // { tipo: 'peao'|'torre'|'bispo'|'cavalo'|'rainha'|'rei', cor: 'brancas'|'pretas', hasMoved: boolean }
        this.board = boardArray;
        // En passant target: índice (0..63) onde um peão pode ser capturado en passant neste turno.
        // null quando não existe.
        this.enPassantTarget = null;
        // Armazena o último movimento realizado no formato { from, to, piece }
        this.lastMove = null;

        console.log("MoveValidator carregado!");
    }

    // ---------------------------------------
    // Helpers de posição
    // ---------------------------------------
    isValidPosition(pos) { return Number.isInteger(pos) && pos >= 0 && pos < 64; }
    row(pos) { return Math.floor(pos / 8); }
    col(pos) { return pos % 8; }
    sameRow(a, b) { return this.row(a) === this.row(b); }
    sameCol(a, b) { return this.col(a) === this.col(b); }

    // Converte file/rank ("a1") para índice (0..63) e vice-versa
    // Útil apenas para interoperação; o motor usa índices
    algebraicToIndex(sq) {
        if (!sq || sq.length !== 2) return null;
        const file = sq.charCodeAt(0) - 'a'.charCodeAt(0);
        const rank = parseInt(sq[1], 10) - 1; // rank 1 = row 0 (bottom)
        if (file < 0 || file > 7 || rank < 0 || rank > 7) return null;
        // Observação: aqui mapeamos a1 -> índice 56 se considerarmos row0 = top.
        // Para evitar confusão usamos convenção: índice = (7 - rank) * 8 + file
        return (7 - rank) * 8 + file;
    }
    indexToAlgebraic(idx) {
        if (!this.isValidPosition(idx)) return null;
        const r = this.row(idx);
        const c = this.col(idx);
        const rank = 8 - r;
        const file = String.fromCharCode('a'.charCodeAt(0) + c);
        return `${file}${rank}`;
    }

    // ---------------------------------------
    // Checa se um passo de movimento deslizante cruza a borda (para rooks/bishops/queens)
    // start: posição anterior; next: posição atual; offset: diferencial (p - (p-offset) = offset)
    // ---------------------------------------
    slidingStepOk(start, next, offset) {
        const sr = this.row(start);
        const sc = this.col(start);
        const nr = this.row(next);
        const nc = this.col(next);

        switch (offset) {
            case -1: return nr === sr && nc === sc - 1; // esquerda
            case 1:  return nr === sr && nc === sc + 1; // direita
            case -8: return nc === sc && nr === sr - 1; // cima (menor índice)
            case 8:  return nc === sc && nr === sr + 1; // baixo (maior índice)
            case -9: return (nr === sr - 1) && (nc === sc - 1); // diag cima-esquerda
            case -7: return (nr === sr - 1) && (nc === sc + 1); // diag cima-direita
            case 7:  return (nr === sr + 1) && (nc === sc - 1); // diag baixo-esquerda
            case 9:  return (nr === sr + 1) && (nc === sc + 1); // diag baixo-direita
            default: return false;
        }
    }

    // ---------------------------------------
    // Movimentos deslizantes gerais para torre/bispo/rainha
    // directions: array de offsets, ex: [-1,1,-8,8]
    // ---------------------------------------
    getSlidingMoves(pos, directions) {
        const moves = [];
        const piece = this.board[pos];
        if (!piece) return moves;

        for (let d of directions) {
            let p = pos + d;
            while (this.isValidPosition(p) && this.slidingStepOk(p - d, p, d)) {
                const target = this.board[p];
                if (!target) {
                    moves.push(p);
                } else {
                    if (target.cor !== piece.cor) moves.push(p);
                    break;
                }
                p += d;
            }
        }

        return moves;
    }

    // ---------------------------------------
    // En Passant: auxiliares e gerenciamento
    // Nota: armazenamos apenas um enPassantTarget por vez (o que é suficiente por regras)
    // ---------------------------------------
    // Atualiza enPassantTarget após um movimento realizado.
    // from, to: índices; piece: objeto
    updateEnPassant(from, to, piece) {
        this.enPassantTarget = null;
        // Apenas peões podem gerar en passant
        if (!piece || piece.tipo !== 'peao') return;

        // Determinar se o peão andou 2 casas neste movimento
        const delta = to - from;
        if (piece.cor === 'brancas' && delta === -16) {
            // peão branco andou duas casas (ex: de linha 6 para 4)
            // a casa capturável fica uma file abaixo do destino
            this.enPassantTarget = to + 8; // índice do peão capturável pela captura en passant
        } else if (piece.cor === 'pretas' && delta === 16) {
            this.enPassantTarget = to - 8;
        }
    }

    // Verifica se movimento (from->to) é uma captura en passant válida
    isEnPassantCapture(from, to, piece) {
        if (!piece || piece.tipo !== 'peao') return false;
        if (this.enPassantTarget === null) return false;
        // Uma captura en passant acontece quando o destino é exatamente a casa alvo
        // e o movimento é diagonal de 1 arquivo e 1 rank no sentido do peão
        const fr = this.row(from);
        const fc = this.col(from);
        const tr = this.row(to);
        const tc = this.col(to);

        const rankDiff = tr - fr;
        const fileDiff = Math.abs(tc - fc);

        // Para brancas, rankDiff deve ser -1; para pretas +1
        if (fileDiff !== 1) return false;
        if (piece.cor === 'brancas' && rankDiff === -1 && to === this.enPassantTarget) return true;
        if (piece.cor === 'pretas' && rankDiff === 1 && to === this.enPassantTarget) return true;
        return false;
    }

    // Quando executamos um movimento no simulador, se for en passant precisamos remover o peão capturado
    executeMoveOnBoard(from, to) {
        const piece = this.board[from];
        const captured = this.board[to];

        // en passant: quando a casa to está vazia mas é captura en passant => remover o peão atrás/à frente
        if (piece && piece.tipo === 'peao' && !captured && this.isEnPassantCapture(from, to, piece)) {
            // o peão capturado está uma file (8 índices) atrás do destino para brancas ou à frente para pretas
            const capturedIndex = piece.cor === 'brancas' ? to + 8 : to - 8;
            const capturedPiece = this.board[capturedIndex];
            this.board[capturedIndex] = null;
        }

        // mover a peça
        this.board[to] = this.board[from];
        this.board[from] = null;
    }

    // ---------------------------------------
    // Movimentos "brutos" (raw) sem filtro de xeque
    // Retorna lista de índices possíveis
    // ---------------------------------------
    rawMoves(pos) {
        const piece = this.board[pos];
        if (!piece) return [];

        const moves = [];
        const r = this.row(pos);
        const c = this.col(pos);

        const add = (to) => {
            if (!this.isValidPosition(to)) return;
            const tgt = this.board[to];
            if (!tgt || tgt.cor !== piece.cor) moves.push(to);
        };

        switch (piece.tipo) {
            case 'peao': {
                // peões brancas movem para índices menores (r decresce), pretas para índices maiores
                if (piece.cor === 'brancas') {
                    // avanço 1
                    const one = pos - 8;
                    if (this.isValidPosition(one) && !this.board[one]) moves.push(one);
                    // avanço 2 (somente da posição inicial row 6)
                    const two = pos - 16;
                    if (r === 6 && this.isValidPosition(two) && !this.board[one] && !this.board[two]) moves.push(two);
                    // capturas
                    const capL = pos - 9;
                    const capR = pos - 7;
                    if (c > 0 && this.isValidPosition(capL) && this.board[capL] && this.board[capL].cor === 'pretas') moves.push(capL);
                    if (c < 7 && this.isValidPosition(capR) && this.board[capR] && this.board[capR].cor === 'pretas') moves.push(capR);
                    // en passant: se target corresponde a capL/capR e enPassantTarget é esse índice
                    if (c > 0 && this.isValidPosition(capL) && this.enPassantTarget === capL) moves.push(capL);
                    if (c < 7 && this.isValidPosition(capR) && this.enPassantTarget === capR) moves.push(capR);
                } else {
                    // pretas
                    const one = pos + 8;
                    if (this.isValidPosition(one) && !this.board[one]) moves.push(one);
                    const two = pos + 16;
                    if (r === 1 && this.isValidPosition(two) && !this.board[one] && !this.board[two]) moves.push(two);
                    const capL = pos + 7;
                    const capR = pos + 9;
                    if (c > 0 && this.isValidPosition(capL) && this.board[capL] && this.board[capL].cor === 'brancas') moves.push(capL);
                    if (c < 7 && this.isValidPosition(capR) && this.board[capR] && this.board[capR].cor === 'brancas') moves.push(capR);
                    if (c > 0 && this.isValidPosition(capL) && this.enPassantTarget === capL) moves.push(capL);
                    if (c < 7 && this.isValidPosition(capR) && this.enPassantTarget === capR) moves.push(capR);
                }
                break;
            }

            case 'torre':
                moves.push(...this.getSlidingMoves(pos, [-1,1,-8,8]));
                break;

            case 'bispo':
                moves.push(...this.getSlidingMoves(pos, [-9,-7,7,9]));
                break;

            case 'rainha':
                moves.push(...this.getSlidingMoves(pos, [-1,1,-8,8,-9,-7,7,9]));
                break;

            case 'cavalo': {
                const offs = [-17,-15,-10,-6,6,10,15,17];
                for (let off of offs) {
                    const to = pos + off;
                    if (!this.isValidPosition(to)) continue;
                    // Um salto do cavalo nunca atravessa a borda se a soma das diffs row+col == 3
                    if (Math.abs(this.row(to) - r) + Math.abs(this.col(to) - c) === 3) {
                        const tgt = this.board[to];
                        if (!tgt || tgt.cor !== piece.cor) moves.push(to);
                    }
                }
                break;
            }

            case 'rei': {
                const offs = [-9,-8,-7,-1,1,7,8,9];
                for (let off of offs) {
                    const to = pos + off;
                    if (!this.isValidPosition(to)) continue;
                    if (Math.abs(this.row(to) - r) <= 1 && Math.abs(this.col(to) - c) <= 1) {
                        const tgt = this.board[to];
                        if (!tgt || tgt.cor !== piece.cor) moves.push(to);
                    }
                }
                // castling NÃO é adicionado aqui (porque precisa de checar linhas atacadas)
                break;
            }

            default:
                // peça desconhecida -> nenhum movimento
                break;
        }

        return moves;
    }

    // ---------------------------------------
    // Verifica se o rei da cor está em cheque
    // ---------------------------------------
    isKingInCheck(color) {
        // Encontrar rei
        const kingPos = this.board.findIndex(p => p && p.tipo === 'rei' && p.cor === color);
        if (kingPos === -1) return false; // sem rei -> não consideramos como cheque aqui

        const enemyColor = color === 'brancas' ? 'pretas' : 'brancas';

        // Percorrer todas peças inimigas e checar se alguma ataca kingPos
        for (let i = 0; i < 64; i++) {
            const p = this.board[i];
            if (!p || p.cor !== enemyColor) continue;

            // Para eficiência, para peões usamos apenas squares de captura
            if (p.tipo === 'peao') {
                const r = this.row(i);
                const c = this.col(i);
                if (p.cor === 'brancas') {
                    const capL = i - 9; const capR = i - 7;
                    if (capL === kingPos || capR === kingPos) return true;
                } else {
                    const capL = i + 7; const capR = i + 9;
                    if (capL === kingPos || capR === kingPos) return true;
                }
            } else {
                const moves = this.rawMoves(i);
                if (moves.includes(kingPos)) return true;
            }
        }

        return false;
    }

    // ---------------------------------------
    // Simula um movimento e verifica se deixaria o rei em cheque
    // ---------------------------------------
    wouldNotLeaveKingInCheck(from, to) {
        const piece = this.board[from];
        if (!piece) return false;

        // backups
        const backupFrom = piece;
        const backupTo = this.board[to];
        const backupEnPassant = this.enPassantTarget;

        // Executa movimento simulando en passant
        if (piece.tipo === 'peao' && this.isEnPassantCapture(from, to, piece) && !backupTo) {
            // registrar peça capturada (remover)
            const capturedIndex = piece.cor === 'brancas' ? to + 8 : to - 8;
            var capturedBackup = this.board[capturedIndex];
            this.board[capturedIndex] = null;
        }

        // mover
        this.board[to] = this.board[from];
        this.board[from] = null;

        const safe = !this.isKingInCheck(piece.cor);

        // restaurar
        this.board[from] = backupFrom;
        this.board[to] = backupTo;
        if (typeof capturedBackup !== 'undefined') {
            const capturedIndex = piece.cor === 'brancas' ? to + 8 : to - 8;
            this.board[capturedIndex] = capturedBackup;
        }
        this.enPassantTarget = backupEnPassant;

        return safe;
    }

    // ---------------------------------------
    // Gera movimentos possíveis, aplicando filtros adicionais (roque, checar segurança do rei)
    // Retorna array de índices válidos
    // ---------------------------------------
    getPossibleMoves(pos) {
        const piece = this.board[pos];
        if (!piece) return [];

        // Primeiro pega moves brutos
        let moves = this.rawMoves(pos);
        const res = [];

        // Roque: somente para rei
        if (piece.tipo === 'rei') {
            const color = piece.cor;
            const rowIndex = color === 'brancas' ? 7 : 0; // linha do rei na posição inicial
            const kingIndex = rowIndex * 8 + 4;
            // permite roque somente se o rei estiver em sua coluna inicial
            if (pos === kingIndex && !piece.hasMoved && !this.isKingInCheck(color)) {
                // curto: torre na coluna 7
                const rookShort = this.board[rowIndex * 8 + 7];
                if (rookShort && rookShort.tipo === 'torre' && !rookShort.hasMoved) {
                    const via1 = rowIndex * 8 + 5;
                    const via2 = rowIndex * 8 + 6;
                    if (!this.board[via1] && !this.board[via2] && !this.isCellAttacked(via1, color) && !this.isCellAttacked(via2, color)) {
                        moves.push(via2);
                    }
                }
                // longo: torre na coluna 0
                const rookLong = this.board[rowIndex * 8 + 0];
                if (rookLong && rookLong.tipo === 'torre' && !rookLong.hasMoved) {
                    const via1 = rowIndex * 8 + 3;
                    const via2 = rowIndex * 8 + 2;
                    const via3 = rowIndex * 8 + 1;
                    if (!this.board[via1] && !this.board[via2] && !this.board[via3] && !this.isCellAttacked(via1, color) && !this.isCellAttacked(via2, color)) {
                        moves.push(via2);
                    }
                }
            }
        }

        // Filtrar movimentos que deixariam o rei em cheque
        for (let to of moves) {
            if (this.wouldNotLeaveKingInCheck(pos, to)) {
                res.push(to);
            }
        }

        return res;
    }

    // ---------------------------------------
    // Atualiza estado após um movimento REAL ser efetuado (chamado pelo controlador de jogo)
    // from, to: índices, piece: objeto antes de movimento
    // ---------------------------------------
    finalizeMove(from, to) {
        const piece = this.board[from];
        if (!piece) return;

        // atualiza lastMove com cópia leve
        this.lastMove = { from, to, piece: { ...piece } };

        // executa o movimento (lógica de en passant tratada no executeMoveOnBoard)
        this.executeMoveOnBoard(from, to);

        // marca hasMoved
        this.board[to].hasMoved = true;

        // atualiza enPassantTarget com base no movimento
        this.updateEnPassant(from, to, this.board[to]);
    }

    // ---------------------------------------
    // Checa se a casa pos está atacada pela cor inimiga
    // ---------------------------------------
    isCellAttacked(pos, color) {
        const enemyColor = color === 'brancas' ? 'pretas' : 'brancas';
        for (let i = 0; i < 64; i++) {
            const p = this.board[i];
            if (!p || p.cor !== enemyColor) continue;
            // para peões, só considerar diagonais de captura
            if (p.tipo === 'peao') {
                const r = this.row(i);
                const c = this.col(i);
                if (p.cor === 'brancas') {
                    const capL = i - 9; const capR = i - 7;
                    if (capL === pos || capR === pos) return true;
                } else {
                    const capL = i + 7; const capR = i + 9;
                    if (capL === pos || capR === pos) return true;
                }
            } else {
                const moves = this.rawMoves(i);
                if (moves.includes(pos)) return true;
            }
        }
        return false;
    }

    // ---------------------------------------
    // Verifica checkmate
    // ---------------------------------------
    isCheckmate(color) {
        if (!this.isKingInCheck(color)) return false;
        for (let i = 0; i < 64; i++) {
            const p = this.board[i];
            if (p && p.cor === color) {
                const moves = this.getPossibleMoves(i);
                if (moves.length > 0) return false;
            }
        }
        return true;
    }

    // ---------------------------------------
    // Utilitário: tenta fazer roque no board (se chamado pelo jogador)
    // Retorna true se movido; false caso contrário
    // Nota: essa função altera diretamente o board, e não faz checagem adicional de validação
    // ---------------------------------------
    performCastling(color, side) {
        // side: 'short' ou 'long'
        const row = color === 'brancas' ? 7 : 0;
        const kingIndex = row * 8 + 4;
        const rookIndex = side === 'short' ? row * 8 + 7 : row * 8 + 0;
        const king = this.board[kingIndex];
        const rook = this.board[rookIndex];
        if (!king || !rook) return false;
        if (king.tipo !== 'rei' || rook.tipo !== 'torre') return false;
        if (king.hasMoved || rook.hasMoved) return false;

        if (side === 'short') {
            // move king to col 6, rook to col 5
            this.board[row*8 + 6] = king;
            this.board[row*8 + 5] = rook;
            this.board[kingIndex] = null;
            this.board[rookIndex] = null;
            this.board[row*8 + 6].hasMoved = true;
            this.board[row*8 + 5].hasMoved = true;
            return true;
        } else {
            // long
            this.board[row*8 + 2] = king;
            this.board[row*8 + 3] = rook;
            this.board[kingIndex] = null;
            this.board[rookIndex] = null;
            this.board[row*8 + 2].hasMoved = true;
            this.board[row*8 + 3].hasMoved = true;
            return true;
        }
    }

    // ---------------------------------------
    // Debug: imprime tabuleiro em ascii (útil durante desenvolvimento)
    // ---------------------------------------
    boardToString() {
        const lines = [];
        for (let r = 0; r < 8; r++) {
            const cols = [];
            for (let c = 0; c < 8; c++) {
                const idx = r*8 + c;
                const p = this.board[idx];
                if (!p) cols.push('.');
                else {
                    const ch = p.tipo === 'peao' ? 'p' : p.tipo[0];
                    cols.push((p.cor === 'brancas' ? ch.toUpperCase() : ch.toLowerCase()));
                }
            }
            lines.push(cols.join(' '));
        }
        return lines.join(' ');
    }

    // ---------------------------------------
    // Método auxiliar público para validar um movimento simples (sem executar)
    // move: { from, to }
    // Retorna { valid: boolean, reason?: string }
    // ---------------------------------------
    validateMoveObject(move) {
        const { from, to } = move;
        if (!this.isValidPosition(from) || !this.isValidPosition(to)) return { valid: false, reason: 'pos invalid' };
        const piece = this.board[from];
        if (!piece) return { valid: false, reason: 'no piece at from' };

        const possible = this.getPossibleMoves(from);
        if (!possible.includes(to)) {
            // pode ser tentativa de en passant legítima onde rawMoves incluiu o to, mas was filtered by wouldNotLeaveKingInCheck
            return { valid: false, reason: 'move not allowed' };
        }

        return { valid: true };
    }

}

