package com.oinksafe.badges;

import java.time.Instant;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "conquistas")
public record Conquista(
    @Id String id,
    long idUsuario,
    String badgeId,
    String nome,
    String descricao,
    Instant dataConquista
) {}
