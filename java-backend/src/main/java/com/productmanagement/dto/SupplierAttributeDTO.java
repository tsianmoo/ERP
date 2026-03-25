package com.productmanagement.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SupplierAttributeDTO {
    
    private Integer id;
    private String name;
    private String code;
    private String attributeCode;
    private Integer sortOrder;
    private Integer codeLength;
    private Boolean enabled;
    private Integer width;
    private Integer columns;
    private Integer columnWidth;
    private Integer spacing;
    private Integer rowIndex;
    private Boolean newRow;
    private Integer groupSortOrder;
    private Boolean isRequired;
    private Integer groupId;
    private String fieldType; // single_select, text
    private SupplierAttributeGroupDTO group;
    private List<AttributeValueDTO> supplierAttributeValues;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SupplierAttributeGroupDTO {
        private Integer id;
        private String name;
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AttributeValueDTO {
        private Integer id;
        private Integer attributeId;
        private String name;
        private String code;
        private Integer sortOrder;
    }
}
