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
public class AttributeValueDTO {
    
    private Integer id;
    private Integer attributeId;
    private String name;
    private String code;
    private Integer parentId;
    private Integer sortOrder;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
