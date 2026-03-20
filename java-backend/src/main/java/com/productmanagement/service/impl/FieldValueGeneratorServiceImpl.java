package com.productmanagement.service.impl;

import com.productmanagement.dto.CodeRuleDTO;
import com.productmanagement.service.CodeRuleService;
import com.productmanagement.service.FieldValueGeneratorService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

/**
 * 字段值生成服务实现
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class FieldValueGeneratorServiceImpl implements FieldValueGeneratorService {
    
    private final CodeRuleService codeRuleService;
    private final JdbcTemplate jdbcTemplate;
    
    @Override
    @Transactional
    public GenerateFieldValueResult generateFieldValue(Long codeRuleId, Map<String, Object> basicFieldValues, Map<String, Object> attributeValues) {
        // 获取编码规则
        CodeRuleDTO rule = codeRuleService.getRuleById(codeRuleId);
        if (rule == null) {
            throw new RuntimeException("编码规则不存在: " + codeRuleId);
        }
        
        List<Map<String, Object>> elements = rule.getElements();
        if (elements == null || elements.isEmpty()) {
            throw new RuntimeException("编码规则元素为空");
        }
        
        StringBuilder result = new StringBuilder();
        String sequenceValue = null;
        
        for (Map<String, Object> element : elements) {
            // 检查元素是否启用
            Object enabledObj = element.get("enabled");
            Boolean enabled = null;
            if (enabledObj instanceof Boolean) {
                enabled = (Boolean) enabledObj;
            } else if (enabledObj != null) {
                enabled = Boolean.valueOf(String.valueOf(enabledObj));
            }
            if (enabled == null || !enabled) {
                continue;
            }
            
            String type = element.get("type") != null ? String.valueOf(element.get("type")) : null;
            String value = element.get("value") != null ? String.valueOf(element.get("value")) : null;
            
            if ("fixed".equals(type)) {
                // 固定文本
                result.append(value != null ? value : "");
            } else if ("variable".equals(type)) {
                // 变量
                String variableValue = resolveVariable(value, basicFieldValues, attributeValues, element);
                result.append(variableValue != null ? variableValue : "");
                
                // 保存流水号值
                if ("sequence".equalsIgnoreCase(value)) {
                    sequenceValue = variableValue;
                }
            }
        }
        
        String generatedValue = result.toString();
        log.info("生成字段值: {}", generatedValue);
        
        return GenerateFieldValueResult.builder()
                .value(generatedValue)
                .sequence(sequenceValue)
                .build();
    }
    
    /**
     * 解析变量值
     */
    private String resolveVariable(String variableName, Map<String, Object> basicFieldValues, Map<String, Object> attributeValues, Map<String, Object> element) {
        if (variableName == null) {
            return "";
        }
        
        // 特殊变量处理（不区分大小写）
        String lowerVarName = variableName.toLowerCase();
        
        switch (lowerVarName) {
            case "year":
                return String.valueOf(LocalDate.now().getYear());
            case "month":
                return String.format("%02d", LocalDate.now().getMonthValue());
            case "day":
                return String.format("%02d", LocalDate.now().getDayOfMonth());
            case "sequence":
                // 流水号
                return generateSequence(element);
            default:
                // 从字段值中查找（不区分大小写）
                if (basicFieldValues != null) {
                    // 先尝试精确匹配
                    Object value = basicFieldValues.get(variableName);
                    if (value != null) {
                        return String.valueOf(value);
                    }
                    // 再尝试不区分大小写匹配
                    for (Map.Entry<String, Object> entry : basicFieldValues.entrySet()) {
                        if (entry.getKey() != null && entry.getKey().equalsIgnoreCase(variableName)) {
                            return entry.getValue() != null ? String.valueOf(entry.getValue()) : "";
                        }
                    }
                }
                
                // 从属性值中查找
                if (attributeValues != null) {
                    Object value = attributeValues.get(variableName);
                    if (value != null) {
                        return String.valueOf(value);
                    }
                    for (Map.Entry<String, Object> entry : attributeValues.entrySet()) {
                        if (entry.getKey() != null && entry.getKey().equalsIgnoreCase(variableName)) {
                            return entry.getValue() != null ? String.valueOf(entry.getValue()) : "";
                        }
                    }
                }
                
                log.warn("未找到变量值: {}", variableName);
                return "";
        }
    }
    
    /**
     * 生成流水号
     */
    private String generateSequence(Map<String, Object> element) {
        // 获取流水号配置
        Integer length = null;
        if (element != null && element.get("sequence_length") != null) {
            Object lengthObj = element.get("sequence_length");
            if (lengthObj instanceof Number) {
                length = ((Number) lengthObj).intValue();
            } else {
                try {
                    length = Integer.valueOf(String.valueOf(lengthObj));
                } catch (NumberFormatException e) {
                    length = 4;
                }
            }
        }
        if (length == null || length <= 0) {
            length = 4; // 默认4位
        }
        
        // 获取排除的数字
        String excludedDigits = element != null && element.get("sequence_excluded_digits") != null 
            ? String.valueOf(element.get("sequence_excluded_digits")) 
            : null;
        
        // 使用数据库序列生成
        try {
            // 查询当前日期的最大流水号
            String dateStr = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
            String sql = "SELECT COALESCE(MAX(CAST(sequence_value AS INTEGER)), 0) + 1 FROM product_code_sequences WHERE date_key = ?";
            Integer nextSeq = jdbcTemplate.queryForObject(sql, Integer.class, dateStr);
            if (nextSeq == null) {
                nextSeq = 1;
            }
            
            // 格式化流水号
            String sequence = String.format("%0" + length + "d", nextSeq);
            
            // 应用排除数字规则
            if (excludedDigits != null && !excludedDigits.isEmpty()) {
                sequence = applyExcludedDigits(sequence, excludedDigits, length);
            }
            
            // 插入或更新序列记录
            String insertSql = "INSERT INTO product_code_sequences (date_key, sequence_value, created_at) VALUES (?, ?, NOW()) ON CONFLICT (date_key) DO UPDATE SET sequence_value = EXCLUDED.sequence_value";
            
            try {
                jdbcTemplate.update(insertSql, dateStr, String.valueOf(nextSeq));
            } catch (Exception e) {
                // 表可能不存在，创建表
                createSequenceTable();
                jdbcTemplate.update(insertSql, dateStr, String.valueOf(nextSeq));
            }
            
            return sequence;
        } catch (Exception e) {
            log.error("生成流水号失败", e);
            // 降级使用时间戳
            return String.format("%0" + length + "d", System.currentTimeMillis() % (long) Math.pow(10, length));
        }
    }
    
    /**
     * 应用排除数字规则
     */
    private String applyExcludedDigits(String sequence, String excludedDigits, int length) {
        // 简单实现：将包含排除数字的序列跳过
        // 这里先返回原序列，复杂规则可以后续实现
        return sequence;
    }
    
    /**
     * 创建序列表
     */
    private void createSequenceTable() {
        String createTableSql = "CREATE TABLE IF NOT EXISTS product_code_sequences (" +
                "date_key VARCHAR(8) PRIMARY KEY, " +
                "sequence_value VARCHAR(10) NOT NULL, " +
                "created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP" +
                ")";
        jdbcTemplate.execute(createTableSql);
        log.info("创建 product_code_sequences 表成功");
    }
}
