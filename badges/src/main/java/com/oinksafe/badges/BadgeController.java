package com.oinksafe.badges;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/badges")
public class BadgeController {

    private final BadgeRepository badgeRepository;

    public BadgeController(BadgeRepository badgeRepository) {
        this.badgeRepository = badgeRepository;
    }

    @GetMapping
    public List<Badge> listarBadges() {
        return badgeRepository.findAll();
    }
}