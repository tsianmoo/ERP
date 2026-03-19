package com.productmanagement.service;

import com.productmanagement.dto.CodeRuleDTO;

import java.util.List;

public interface CodeRuleService {
    
    List<CodeRuleDTO> getAllRules();
    
    CodeRuleDTO getRuleById(Long id);
    
    CodeRuleDTO createRule(CodeRuleDTO request);
    
    CodeRuleDTO updateRule(Long id, CodeRuleDTO request);
    
    void deleteRule(Long id);
}
