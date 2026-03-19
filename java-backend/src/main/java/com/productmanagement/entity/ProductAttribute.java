package com.productmanagement.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.OffsetDateTime;

@Data
@Entity
@Table(name = "product_attributes")
public class ProductAttribute {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    
    @Column(name = "name", nullable = false)
    private String name;
    
    @Column(name = "code", nullable = false)
    private String code;
    
    @Column(name = "attribute_code")
    private String attributeCode;
    
    @Column(name = "sort_order")
    private Integer sortOrder = 0;
    
    @Column(name = "code_length")
    private Integer codeLength = 2;
    
    @Column(name = "enabled")
    private Boolean enabled = true;
    
    @Column(name = "width")
    private Integer width = 100;
    
    @Column(name = "columns")
    private Integer columns = 1;
    
    @Column(name = "column_width")
    private Integer columnWidth = 1;
    
    @Column(name = "spacing")
    private Integer spacing = 2;
    
    @Column(name = "row_index")
    private Integer rowIndex = 1;
    
    @Column(name = "new_row")
    private Boolean newRow = false;
    
    @Column(name = "group_sort_order")
    private Integer groupSortOrder = 0;
    
    @Column(name = "is_required")
    private Boolean isRequired = false;
    
    @Column(name = "group_id")
    private Integer groupId;
    
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;
    
    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "group_id", insertable = false, updatable = false)
    private ProductAttributeGroup group;
    
    @PrePersist
    protected void onCreate() {
        createdAt = OffsetDateTime.now();
        if (sortOrder == null) sortOrder = 0;
        if (codeLength == null) codeLength = 2;
        if (enabled == null) enabled = true;
        if (width == null) width = 100;
        if (columns == null) columns = 1;
        if (columnWidth == null) columnWidth = 1;
        if (spacing == null) spacing = 2;
        if (rowIndex == null) rowIndex = 1;
        if (newRow == null) newRow = false;
        if (groupSortOrder == null) groupSortOrder = 0;
        if (isRequired == null) isRequired = false;
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }
}
