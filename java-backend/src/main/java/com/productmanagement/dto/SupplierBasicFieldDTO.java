package com.productmanagement.dto;

import lombok.Data;
import java.time.OffsetDateTime;

@Data
public class SupplierBasicFieldDTO {
    private Integer id;
    private String fieldName;
    private String fieldCode;
    private String fieldType;
    private Boolean isRequired;
    private Object options;
    private Integer sortOrder;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
