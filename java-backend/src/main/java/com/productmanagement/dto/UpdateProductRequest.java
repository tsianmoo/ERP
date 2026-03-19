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
public class UpdateProductRequest {
    
    private Map<String, Object> basicInfo;
    private Map<String, Object> attributeValues;
    private List<String> imageUrls;
    private List<CreateProductRequest.ColorInfo> colors;
    private String status;
}
