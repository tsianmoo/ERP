package com.productmanagement.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.OffsetDateTime;
import java.util.List;

@Data
@Entity
@Table(name = "size_groups")
public class SizeGroup {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    
    @Column(name = "name", nullable = false)
    private String name;
    
    @Column(name = "code", nullable = false)
    private String code;
    
    @Column(name = "code_length")
    private Integer codeLength = 2;
    
    @Column(name = "sort_order")
    private Integer sortOrder = 0;
    
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;
    
    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;
    
    @OneToMany(mappedBy = "groupId", fetch = FetchType.LAZY)
    private List<SizeValue> sizeValues;
    
    @PrePersist
    protected void onCreate() {
        createdAt = OffsetDateTime.now();
        if (codeLength == null) codeLength = 2;
        if (sortOrder == null) sortOrder = 0;
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }
}
