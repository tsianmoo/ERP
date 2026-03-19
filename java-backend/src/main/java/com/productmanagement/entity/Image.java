package com.productmanagement.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.OffsetDateTime;

@Data
@Entity
@Table(name = "images")
public class Image {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    
    @Column(name = "name", nullable = false)
    private String name;
    
    @Column(name = "url", nullable = false, columnDefinition = "TEXT")
    private String url;
    
    @Column(name = "category_id")
    private Integer categoryId;
    
    @Column(name = "file_size")
    private Integer fileSize;
    
    @Column(name = "width")
    private Integer width;
    
    @Column(name = "height")
    private Integer height;
    
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;
    
    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id", insertable = false, updatable = false)
    private ImageCategory category;
    
    @PrePersist
    protected void onCreate() {
        createdAt = OffsetDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }
}
