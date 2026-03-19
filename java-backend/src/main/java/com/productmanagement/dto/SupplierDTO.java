package com.productmanagement.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SupplierDTO {
    
    private Integer id;
    private String supplierCode;
    private String supplierName;
    private Map<String, Object> basicInfo;
    private String status;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
