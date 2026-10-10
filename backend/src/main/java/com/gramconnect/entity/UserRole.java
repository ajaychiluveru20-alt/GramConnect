package com.gramconnect.entity;

public enum UserRole {
    ADMIN,
    WORKER,
    VILLAGER;

    public static UserRole fromString(String value) {
        if (value == null || value.isBlank()) {
            return VILLAGER;
        }
        try {
            return UserRole.valueOf(value.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            return VILLAGER;
        }
    }
}
