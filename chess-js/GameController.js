import { Board } from "./Board.js";
import { showPromotionModal } from "./promotionModal.js"; // certifique-se do nome

export class GameController {
    constructor(ui) {
        this.ui = ui;
        this.board = new Board();
        this.turno = "brancas";
        this.selected = null;

        this.ui.renderBoard(this.board.board);
        this.addListeners();
    }

    addListeners() {
        document.addEventListener("click", (ev) => {
            const cell = ev.target.closest(".cell");
            if (!cell) return;

            const index = parseInt(cell.dataset.index);
            this.onCellClick(index);
        });
    }

    onCellClick(index) {
        const peca = this.board.board[index];

        // 1️⃣ Selecionar peça
        if (!this.selected) {
            if (peca && peca.cor === this.turno) {
                this.selected = index;
                this.ui.highlight(index);
            }
            return;
        }

        // 2️⃣ Mover peça (mesma casa → desseleciona)
        if (this.selected === index) {
            this.selected = null;
            this.ui.clearHighlights();
            return;
        }

        // 3️⃣ Tenta mover
        this.makeMove(this.selected, index);
        this.selected = null;
        this.ui.clearHighlights();
    }

    makeMove(from, to) {
        const peca = this.board.board[from];
        if (!peca) return;

        // 👉 **Validação mínima**, você pode expandir depois
        if (this.board.board[to] && this.board.board[to].cor === peca.cor) {
            return; // não captura a própria peça
        }

        // MOVIMENTO NORMAL (provisório)
        this.board.movePiece(from, to);

        // 4️⃣ Verificar promoção
        if (this.checkPromotion(peca, to)) {
            this.doPromotion(peca.cor, to);
            return;
        }

        // 5️⃣ Alterna turno
        this.proximoTurno();

        // 6️⃣ Atualiza tela
        this.ui.renderBoard(this.board.board);
    }

    checkPromotion(peca, to) {
        if (peca.tipo === "♙" && to < 8)
            return true; // peão branco chegou ao fundo

        if (peca.tipo === "♟" && to >= 56)
            return true; // peão preto chegou ao fundo

        return false;
    }

    doPromotion(cor, posicaoFinal) {
        // abre o modal e aguarda a escolha
        showPromotionModal(cor, tipoEscolhido => {

            this.board.board[posicaoFinal] = {
                tipo: tipoEscolhido,
                cor: cor
            };

            // só troca turno DEPOIS da promoção
            this.proximoTurno();

            // re-render geral
            this.ui.renderBoard(this.board.board);
        });
    }

    proximoTurno() {
        this.turno = this.turno === "brancas" ? "pretas" : "brancas";
    }

    resetGame() {
        this.board.resetBoard();
        this.turno = "brancas";
        this.selected = null;

        this.ui.clearHighlights();
        this.ui.renderBoard(this.board.board);
    }
}
