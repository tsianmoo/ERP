package com.productmanagement.dto;

import lombok.Data;
import java.time.OffsetDateTime;

@Data
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
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
