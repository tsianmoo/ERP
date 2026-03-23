package com.productmanagement.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;
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
public class SupplierCodeRuleDTO {
    
    private Long id;
    
    @JsonProperty("rule_name")
    @JsonAlias("ruleName")
    private String ruleName;
    
    private List<Map<String, Object>> elements;
    
    @JsonProperty("is_active")
    @JsonAlias("isActive")
    private Boolean isActive;
    
    @JsonProperty("created_at")
    @JsonAlias("createdAt")
    private OffsetDateTime createdAt;
    
    @JsonProperty("updated_at")
    @JsonAlias("updatedAt")
    private OffsetDateTime updatedAt;
}
