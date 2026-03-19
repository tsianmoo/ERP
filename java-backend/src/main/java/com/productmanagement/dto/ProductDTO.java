package com.productmanagement.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductDTO {
    
    private Integer id;
    private String productCode;
    private String productName;
    private Map<String, Object> basicInfo;
    private Map<String, Object> attributeValues;
    private Object imageUrls;
    private String status;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
    private Object colorsData;
    private Object sizesData;
}
