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
    
    @Column(name = "display_name")
    private String displayName;
    
    @Column(name = "field_code", nullable = false, unique = true)
    private String fieldCode;
    
    @Column(name = "field_type", nullable = false)
    private String fieldType;
    
    @Column(name = "is_required")
    private Boolean isRequired = false;
    
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "options", columnDefinition = "jsonb")
    private Object options;
    
    @Column(name = "default_value")
    private String defaultValue;
    
    @Column(name = "sort_order")
    private Integer sortOrder = 0;
    
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
    
    @Column(name = "group_id")
    private Integer groupId;
    
    @Column(name = "group_name")
    private String groupName;
    
    @Column(name = "auto_generate")
    private Boolean autoGenerate = false;
    
    @Column(name = "code_rule_id")
    private Integer codeRuleId;
    
    @Column(name = "linked_product_attribute_id")
    private Integer linkedProductAttributeId;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "group_id", insertable = false, updatable = false)
    private SupplierFieldGroup group;
    
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
        if (width == null) width = 100;
        if (columns == null) columns = 1;
        if (columnWidth == null) columnWidth = 1;
        if (spacing == null) spacing = 2;
        if (rowIndex == null) rowIndex = 1;
        if (newRow == null) newRow = false;
        if (groupSortOrder == null) groupSortOrder = 0;
        if (autoGenerate == null) autoGenerate = false;
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }
}
