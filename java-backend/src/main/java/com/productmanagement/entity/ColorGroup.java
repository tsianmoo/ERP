package com.productmanagement.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.OffsetDateTime;
import java.util.List;

@Data
@Entity
@Table(name = "color_groups")
public class ColorGroup {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    
    @Column(name = "name", nullable = false)
    private String name;
    
    @Column(name = "code", nullable = false)
    private String code;
    
    @Column(name = "group_code")
    private String groupCode;
    
    @Column(name = "code_length")
    private Integer codeLength = 2;
    
    @Column(name = "color")
    private String color = "#3B82F6";
    
    @Column(name = "sort_order")
    private Integer sortOrder = 0;
    
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;
    
    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;
    
    @OneToMany(mappedBy = "groupId", fetch = FetchType.LAZY)
    private List<ColorValue> colorValues;
    
    @PrePersist
    protected void onCreate() {
        createdAt = OffsetDateTime.now();
        if (codeLength == null) codeLength = 2;
        if (color == null) color = "#3B82F6";
        if (sortOrder == null) sortOrder = 0;
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }
}
