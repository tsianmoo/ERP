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
public class CodeRuleDTO {
    
    private Long id;
    private String ruleName;
    private List<Map<String, Object>> elements;
    private Boolean isActive;
    private Boolean barcodeEnabled;
    private String barcodeSuffix;
    private List<Map<String, Object>> barcodeElements;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
