package com.oinksafe.badges;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class BadgeInicializador implements CommandLineRunner {

    private final BadgeRepository badgeRepository;

    public BadgeInicializador(BadgeRepository badgeRepository) {
        this.badgeRepository = badgeRepository;
    }

    @Override
    public void run(String... args) {

        // ========================================
        // BADGE 1 - PRIMEIROS PASSOS
        // ========================================

        cadastrarBadge(
            "primeira_transacao",
            "Primeiros Passos",
            "Registre sua primeira transação no OinkSafe."
        );

        // ========================================
        // BADGE 2 - PRIMEIRA META
        // ========================================

        cadastrarBadge(
            "primeira_meta",
            "Primeira Meta",
            "Crie sua primeira meta financeira."
        );

        // ========================================
        // BADGE 3 - POUPADOR
        // ========================================

        cadastrarBadge(
            "poupador",
            "Poupador",
            "Comece a guardar dinheiro em uma meta financeira."
        );

        // ========================================
        // BADGE 4 - FOCO NO PLANO
        // ========================================

        cadastrarBadge(
            "foco_no_plano",
            "Foco no Plano",
            "Alcance 50% de uma meta financeira."
        );

        // ========================================
        // BADGE 5 - META CONCLUÍDA
        // ========================================

        cadastrarBadge(
            "meta_concluida",
            "Meta Concluída",
            "Conclua sua primeira meta financeira."
        );

        // ========================================
        // BADGE 6 - COFRE CHEIO
        // ========================================

        cadastrarBadge(
            "cofre_cheio",
            "Cofre Cheio",
            "Acumule R$ 1.000 em suas metas financeiras."
        );

        System.out.println(
            "Catálogo de badges do OinkSafe inicializado!"
        );
    }

    // ========================================
    // CADASTRAR BADGE SEM DUPLICAR
    // ========================================

    private void cadastrarBadge(
            String id,
            String nome,
            String descricao) {

        if (!badgeRepository.existsById(id)) {

            Badge badge = new Badge(
                id,
                nome,
                descricao
            );

            badgeRepository.save(badge);

            System.out.println(
                "Badge cadastrada: " + nome
            );

        } else {

            System.out.println(
                "Badge já cadastrada: " + nome
            );
        }
    }
}