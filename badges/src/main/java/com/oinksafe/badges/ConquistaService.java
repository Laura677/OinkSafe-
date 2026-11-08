package com.oinksafe.badges;

import java.time.Instant;
import java.util.List;

import org.springframework.dao.DuplicateKeyException;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Service;

@Service
public class ConquistaService {

    private final MongoTemplate mongo;
    private final BadgeRepository badges;

    public ConquistaService(
            MongoTemplate mongo,
            BadgeRepository badges) {

        this.mongo = mongo;
        this.badges = badges;
    }

    // ========================================
    // CONCEDER QUALQUER BADGE
    // ========================================

    public Conquista concederBadge(
            long idUsuario,
            String badgeId) {

        Badge badge = badges.findById(badgeId)
            .orElseThrow(() ->
                new IllegalStateException(
                    "Badge não cadastrada: " + badgeId
                )
            );

        String id = idUsuario + ":" + badge.getId();

        Query consulta = Query.query(
            Criteria.where("_id").is(id)
        );

        Update dados = new Update()
            .setOnInsert("idUsuario", idUsuario)
            .setOnInsert("badgeId", badge.getId())
            .setOnInsert("nome", badge.getNome())
            .setOnInsert("descricao", badge.getDescricao())
            .setOnInsert("dataConquista", Instant.now());

        try {

            mongo.upsert(
                consulta,
                dados,
                Conquista.class
            );

        } catch (DuplicateKeyException erro) {

            if (mongo.findById(id, Conquista.class) == null) {
                throw erro;
            }
        }

        return mongo.findById(id, Conquista.class);
    }

    // ========================================
    // BADGE 1 - PRIMEIROS PASSOS
    // ========================================

    public Conquista concederPrimeiraTransacao(
            long idUsuario) {

        return concederBadge(
            idUsuario,
            "primeira_transacao"
        );
    }

    // ========================================
    // BADGE 2 - PRIMEIRA META
    // ========================================

    public Conquista concederPrimeiraMeta(
            long idUsuario) {

        return concederBadge(
            idUsuario,
            "primeira_meta"
        );
    }

    // ========================================
    // BADGE 3 - POUPADOR
    // ========================================

    public Conquista concederPoupador(
            long idUsuario) {

        return concederBadge(
            idUsuario,
            "poupador"
        );
    }

    // ========================================
    // BADGE 4 - FOCO NO PLANO
    // ========================================

    public Conquista concederFocoNoPlano(
            long idUsuario) {

        return concederBadge(
            idUsuario,
            "foco_no_plano"
        );
    }

    // ========================================
    // BADGE 5 - METAS CONCLUÍDAS
    // ========================================

    public Conquista concederMetaConcluida(
            long idUsuario) {

        return concederBadge(
            idUsuario,
            "meta_concluida"
        );
    }

    // ========================================
    // BADGE 6 - COFRE CHEIO
    // ========================================

    public Conquista concederCofreCheio(
            long idUsuario) {

        return concederBadge(
            idUsuario,
            "cofre_cheio"
        );
    }

    // ========================================
    // LISTAR CONQUISTAS DO USUÁRIO
    // ========================================

    public List<Conquista> listar(long idUsuario) {

        return mongo.find(
            Query.query(
                Criteria.where("idUsuario").is(idUsuario)
            ),
            Conquista.class
        );
    }
}