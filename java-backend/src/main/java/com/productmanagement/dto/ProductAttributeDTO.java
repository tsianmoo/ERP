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
public class ProductAttributeDTO {
    
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
    private ProductAttributeGroupDTO group;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProductAttributeGroupDTO {
        private Integer id;
        private String name;
    }
}
