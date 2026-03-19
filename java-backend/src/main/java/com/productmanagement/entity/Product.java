package com.productmanagement.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.OffsetDateTime;
import java.util.Map;

@Data
@Entity
@Table(name = "products")
public class Product {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    
    @Column(name = "product_code")
    private String productCode;
    
    @Column(name = "product_name")
    private String productName;
    
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "basic_info", columnDefinition = "jsonb")
    private Map<String, Object> basicInfo;
    
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "attribute_values", columnDefinition = "jsonb")
    private Map<String, Object> attributeValues;
    
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "image_urls", columnDefinition = "jsonb")
    private Object imageUrls;
    
    @Column(name = "status")
    private String status = "active";
    
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;
    
    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;
    
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "colors_data", columnDefinition = "jsonb")
    private Object colorsData;
    
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "sizes_data", columnDefinition = "jsonb")
    private Object sizesData;
    
    @PrePersist
    protected void onCreate() {
        createdAt = OffsetDateTime.now();
        if (status == null) {
            status = "active";
        }
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }
}
