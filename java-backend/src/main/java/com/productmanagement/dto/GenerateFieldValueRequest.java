package com.productmanagement.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.util.Map;

/**
 * 生成字段值请求
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class GenerateFieldValueRequest {
    private String fieldCode;
    private Long codeRuleId;
    private Map<String, Object> basicFieldValues;
    private Map<String, Object> attributeValues;
}
