package com.productmanagement.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.OffsetDateTime;

@Data
@Entity
@Table(name = "supplier_basic_fields")
public class SupplierBasicField {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    
    @Column(name = "field_name", nullable = false)
    private String fieldName;
    
    @Column(name = "db_field_name")
    private String dbFieldName;
    
    @Column(name = "field_type", nullable = false)
    private String fieldType;
    
    @Column(name = "is_required")
    private Boolean isRequired = false;
    
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "options", columnDefinition = "jsonb")
    private Object options;
    
    @Column(name = "sort_order")
    private Integer sortOrder = 0;
    
    @Column(name = "enabled")
    private Boolean enabled = true;
    
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;
    
    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = OffsetDateTime.now();
        if (isRequired == null) isRequired = false;
        if (sortOrder == null) sortOrder = 0;
        if (enabled == null) enabled = true;
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }
}
