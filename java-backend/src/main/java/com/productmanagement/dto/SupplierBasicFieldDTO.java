package com.productmanagement.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SupplierBasicFieldDTO {
    
    private Integer id;
    private String fieldName;
    private String displayName;
    private String fieldCode;
    private String fieldType;
    private Boolean isRequired;
    private Object options;
    private String defaultValue;
    private Integer sortOrder;
    private Boolean enabled;
    private Integer width;
    private Integer columns;
    private Integer columnWidth;
    private Integer spacing;
    private Integer rowIndex;
    private Boolean newRow;
    private Integer groupSortOrder;
    private Integer groupId;
    private String groupName;
    private FieldGroupDTO group;
    private Boolean autoGenerate;
    private Integer codeRuleId;
    // 关联商品属性
    private Integer linkedProductAttributeId;
    private LinkedProductAttributeDTO linkedProductAttribute;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FieldGroupDTO {
        private Integer id;
        private String name;
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LinkedProductAttributeDTO {
        private Integer id;
        private String name;
        private String code;
    }
}
