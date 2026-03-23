package com.productmanagement.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.OffsetDateTime;

@Data
@Entity
@Table(name = "supplier_attribute_values")
public class SupplierAttributeValue {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    
    @Column(name = "attribute_id", nullable = false)
    private Integer attributeId;
    
    @Column(name = "value_name", nullable = false)
    private String name;
    
    @Column(name = "value_code", nullable = false)
    private String code;
    
    @Column(name = "sort_order")
    private Integer sortOrder = 0;
    
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;
    
    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "attribute_id", insertable = false, updatable = false)
    private SupplierAttribute attribute;
    
    @PrePersist
    protected void onCreate() {
        createdAt = OffsetDateTime.now();
        if (sortOrder == null) sortOrder = 0;
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }
}
