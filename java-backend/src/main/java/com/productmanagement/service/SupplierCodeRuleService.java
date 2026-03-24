package com.productmanagement.service;

import com.productmanagement.dto.SupplierCodeRuleDTO;

import java.util.List;
import java.util.Map;

public interface SupplierCodeRuleService {
    
    List<SupplierCodeRuleDTO> getAllRules();
    
    SupplierCodeRuleDTO getRuleById(Long id);
    
    SupplierCodeRuleDTO createRule(SupplierCodeRuleDTO request);
    
    SupplierCodeRuleDTO updateRule(Long id, SupplierCodeRuleDTO request);
    
    void deleteRule(Long id);
    
    /**
     * 获取基本字段变量列表
     */
    List<Map<String, String>> getBasicFieldVariables();
    
    /**
     * 获取供应商属性变量列表
     */
    List<Map<String, String>> getAttributeVariables();
    
    /**
     * 获取商品属性变量列表（供供应商编码规则使用）
     */
    List<Map<String, String>> getProductAttributeVariables();
}
