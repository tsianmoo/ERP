package com.productmanagement.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.OffsetDateTime;

@Data
@Entity
@Table(name = "color_values")
public class ColorValue {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    
    @Column(name = "group_id", nullable = false)
    private Integer groupId;
    
    @Column(name = "name", nullable = false)
    private String name;
    
    @Column(name = "code", nullable = false)
    private String code;
    
    @Column(name = "hex_code")
    private String hexCode;
    
    @Column(name = "transparency")
    private Integer transparency;
    
    @Column(name = "sort_order")
    private Integer sortOrder = 0;
    
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;
    
    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "group_id", insertable = false, updatable = false)
    private ColorGroup group;
    
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
