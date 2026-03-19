package com.productmanagement.dto;

import lombok.Data;
import java.time.OffsetDateTime;

@Data
public class SupplierBasicFieldDTO {
    private Integer id;
    private String fieldName;
    private String dbFieldName;
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
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
