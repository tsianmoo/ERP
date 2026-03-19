package com.productmanagement.dto;

import lombok.Data;
import java.time.OffsetDateTime;

@Data
public class ImageCategoryDTO {
    private Integer id;
    private String name;
    private String type;
    private String attributeCode;
    private Integer sortOrder;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
