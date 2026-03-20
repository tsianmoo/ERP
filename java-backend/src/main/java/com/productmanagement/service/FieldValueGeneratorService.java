package com.productmanagement.service;

import java.util.Map;

/**
 * 字段值生成服务
 */
public interface FieldValueGeneratorService {
    
    /**
     * 根据编码规则生成字段值
     * @param codeRuleId 编码规则ID
     * @param basicFieldValues 基本字段值
     * @param attributeValues 属性值
     * @return 生成的字段值
     */
    GenerateFieldValueResult generateFieldValue(Long codeRuleId, Map<String, Object> basicFieldValues, Map<String, Object> attributeValues);
    
    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class GenerateFieldValueResult {
        private String value;
        private String sequence; // 用于返回生成的流水号
    }
}
