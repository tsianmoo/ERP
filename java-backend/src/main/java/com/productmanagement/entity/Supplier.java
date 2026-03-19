package com.productmanagement.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.OffsetDateTime;
import java.util.Map;

@Data
@Entity
@Table(name = "suppliers")
public class Supplier {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    
    @Column(name = "supplier_code", nullable = false)
    private String supplierCode;
    
    @Column(name = "supplier_name", nullable = false)
    private String supplierName;
    
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "basic_info", columnDefinition = "jsonb")
    private Map<String, Object> basicInfo;
    
    @Column(name = "status")
    private String status = "active";
    
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;
    
    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = OffsetDateTime.now();
        if (status == null) status = "active";
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }
}
