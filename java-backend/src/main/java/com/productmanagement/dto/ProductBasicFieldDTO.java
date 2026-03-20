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
public class ProductBasicFieldDTO {
    
    private Integer id;
    private String fieldName;
    private String displayName;
    private String fieldCode;
    private String fieldType;
    private Boolean isRequired;
    private Object options;
    private Integer sortOrder;
    private Boolean enabled;
    private Integer width;
    private Integer columns;
    private Integer columnWidth;
    private Integer spacing;
    private Integer rowIndex;
    private Boolean newRow;
    private Integer groupSortOrder;
    private String groupName;
    private Integer groupId;
    private Boolean autoGenerate;
    private Integer codeRuleId;
    private FieldGroupDTO fieldGroup;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FieldGroupDTO {
        private Integer id;
        private String name;
        private Integer sortOrder;
    }
}
