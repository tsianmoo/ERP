package com.productmanagement.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;

@Data
@Entity
@Table(name = "product_code_rules")
public class ProductCodeRule {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "rule_name", nullable = false)
    private String ruleName;
    
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "elements", columnDefinition = "jsonb", nullable = false)
    private List<Map<String, Object>> elements;
    
    @Column(name = "is_active")
    private Boolean isActive = true;
    
    @Column(name = "barcode_enabled")
    private Boolean barcodeEnabled = false;
    
    @Column(name = "barcode_suffix")
    private String barcodeSuffix;
    
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "barcode_elements", columnDefinition = "jsonb")
    private List<Map<String, Object>> barcodeElements;
    
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;
    
    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = OffsetDateTime.now();
        if (isActive == null) isActive = true;
        if (barcodeEnabled == null) barcodeEnabled = false;
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }
}
