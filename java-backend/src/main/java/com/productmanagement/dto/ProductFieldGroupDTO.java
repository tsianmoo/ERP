package com.productmanagement.dto;

import lombok.Data;
import java.time.OffsetDateTime;

@Data
public class ProductFieldGroupDTO {
    private Integer id;
    private String name;
    private Integer sortOrder;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
