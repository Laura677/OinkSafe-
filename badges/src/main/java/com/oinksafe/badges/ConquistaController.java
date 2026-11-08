package com.oinksafe.badges;

import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/interno/conquistas")
public class ConquistaController {

    private final ConquistaService service;
    private final String chave;

    public ConquistaController(
            ConquistaService service,
            @Value("${badges.api-key}") String chave) {

        this.service = service;
        this.chave = chave;
    }

    // ========================================
    // VALIDAR ACESSO
    // ========================================

    private void validar(String recebida, long idUsuario) {

        if (chave.isBlank() || !chave.equals(recebida)) {

            throw new ResponseStatusException(
                HttpStatus.UNAUTHORIZED,
                "Chave inválida."
            );
        }

        if (idUsuario <= 0) {

            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Usuário inválido."
            );
        }
    }

    // ========================================
    // BADGE 1 - PRIMEIROS PASSOS
    // ========================================

    @PostMapping("/{idUsuario}/primeira-transacao")
    public Conquista primeiraTransacao(
            @PathVariable long idUsuario,
            @RequestHeader(
                value = "X-Badges-Key",
                required = false
            ) String recebida) {

        validar(recebida, idUsuario);

        return service.concederPrimeiraTransacao(idUsuario);
    }

    // ========================================
    // BADGE 2 - PRIMEIRA META
    // ========================================

    @PostMapping("/{idUsuario}/primeira-meta")
    public Conquista primeiraMeta(
            @PathVariable long idUsuario,
            @RequestHeader(
                value = "X-Badges-Key",
                required = false
            ) String recebida) {

        validar(recebida, idUsuario);

        return service.concederPrimeiraMeta(idUsuario);
    }

    // ========================================
    // BADGE 3 - POUPADOR
    // ========================================

    @PostMapping("/{idUsuario}/poupador")
    public Conquista poupador(
            @PathVariable long idUsuario,
            @RequestHeader(
                value = "X-Badges-Key",
                required = false
            ) String recebida) {

        validar(recebida, idUsuario);

        return service.concederPoupador(idUsuario);
    }

    // ========================================
    // BADGE 4 - FOCO NO PLANO
    // ========================================

    @PostMapping("/{idUsuario}/foco-no-plano")
    public Conquista focoNoPlano(
            @PathVariable long idUsuario,
            @RequestHeader(
                value = "X-Badges-Key",
                required = false
            ) String recebida) {

        validar(recebida, idUsuario);

        return service.concederFocoNoPlano(idUsuario);
    }

    // ========================================
    // BADGE 5 - META CONCLUÍDA
    // ========================================

    @PostMapping("/{idUsuario}/meta-concluida")
    public Conquista metaConcluida(
            @PathVariable long idUsuario,
            @RequestHeader(
                value = "X-Badges-Key",
                required = false
            ) String recebida) {

        validar(recebida, idUsuario);

        return service.concederMetaConcluida(idUsuario);
    }

    // ========================================
    // BADGE 6 - COFRE CHEIO
    // ========================================

    @PostMapping("/{idUsuario}/cofre-cheio")
    public Conquista cofreCheio(
            @PathVariable long idUsuario,
            @RequestHeader(
                value = "X-Badges-Key",
                required = false
            ) String recebida) {

        validar(recebida, idUsuario);

        return service.concederCofreCheio(idUsuario);
    }

    // ========================================
    // LISTAR CONQUISTAS DO USUÁRIO
    // ========================================

    @GetMapping("/{idUsuario}")
    public List<Conquista> listar(
            @PathVariable long idUsuario,
            @RequestHeader(
                value = "X-Badges-Key",
                required = false
            ) String recebida) {

        validar(recebida, idUsuario);

        return service.listar(idUsuario);
    }
}