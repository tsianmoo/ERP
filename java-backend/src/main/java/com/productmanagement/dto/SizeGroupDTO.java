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
public class SizeGroupDTO {
    
    private Integer id;
    private String name;
    private String code;
    private Integer codeLength;
    private Integer sortOrder;
    private List<SizeValueDTO> sizeValues;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SizeValueDTO {
        private Integer id;
        private Integer groupId;
        private String name;
        private String code;
        private Integer sortOrder;
    }
}
