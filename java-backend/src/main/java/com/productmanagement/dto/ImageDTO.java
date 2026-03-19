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
public class ImageDTO {
    
    private Integer id;
    private String name;
    private String url;
    private Integer categoryId;
    private Integer fileSize;
    private Integer width;
    private Integer height;
    private ImageCategoryDTO category;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ImageCategoryDTO {
        private Integer id;
        private String name;
        private String type;
        private String attributeCode;
        private Integer sortOrder;
    }
}
