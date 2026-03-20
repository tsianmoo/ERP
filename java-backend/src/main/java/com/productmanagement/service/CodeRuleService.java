package com.productmanagement.service;

import com.productmanagement.dto.CodeRuleDTO;

import java.util.List;
import java.util.Map;

public interface CodeRuleService {
    
    List<CodeRuleDTO> getAllRules();
    
    CodeRuleDTO getRuleById(Long id);
    
    CodeRuleDTO createRule(CodeRuleDTO request);
    
    CodeRuleDTO updateRule(Long id, CodeRuleDTO request);
    
    void deleteRule(Long id);
    
    /**
     * 获取基本字段变量列表
     */
    List<Map<String, String>> getBasicFieldVariables();
    
    /**
     * 获取属性变量列表
     */
    List<Map<String, String>> getAttributeVariables();
}
