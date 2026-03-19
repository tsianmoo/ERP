package com.productmanagement.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ColorGroupDTO {
    
    private Integer id;
    private String name;
    private String code;
    private String groupCode;
    private Integer codeLength;
    private String color;
    private Integer sortOrder;
    private List<ColorValueDTO> colorValues;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ColorValueDTO {
        private Integer id;
        private Integer groupId;
        private String name;
        private String code;
        private String hexCode;
        private Integer transparency;
        private Integer sortOrder;
    }
}
