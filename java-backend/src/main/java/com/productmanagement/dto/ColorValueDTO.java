package com.productmanagement.dto;

import lombok.Data;
import java.time.OffsetDateTime;

@Data
public class ColorValueDTO {
    private Integer id;
    private Integer groupId;
    private String name;
    private String code;
    private Integer transparency;
    private String hexCode;
    private Integer sortOrder;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
