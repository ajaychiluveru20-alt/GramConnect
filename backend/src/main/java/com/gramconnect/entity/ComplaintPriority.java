package com.gramconnect.entity;

public enum ComplaintPriority {
    LOW, MEDIUM, HIGH;

    public static ComplaintPriority fromString(String value) {
        if (value == null || value.isBlank()) {
            return MEDIUM;
        }
        try {
            return ComplaintPriority.valueOf(value.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            return MEDIUM;
        }
    }
}
