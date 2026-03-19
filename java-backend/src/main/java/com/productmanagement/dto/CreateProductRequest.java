package com.productmanagement.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateProductRequest {
    
    private Map<String, Object> basicInfo;
    private Map<String, Object> attributeValues;
    private List<String> imageUrls;
    private List<ColorInfo> colors;
    private List<Integer> sizes;
    private String status;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ColorInfo {
        private Integer colorValueId;
        private String colorName;
        private String colorCode;
        private String colorAlias;
        private String hexCode;
        private String factoryColorCode;
        private String styleCode;
        private Integer supplierId;
        private String image;
    }
}
