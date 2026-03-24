package com.productmanagement.service.impl;

import com.productmanagement.dto.SupplierCodeRuleDTO;
import com.productmanagement.entity.ProductAttribute;
import com.productmanagement.entity.SupplierAttribute;
import com.productmanagement.entity.SupplierBasicField;
import com.productmanagement.entity.SupplierCodeRule;
import com.productmanagement.repository.ProductAttributeRepository;
import com.productmanagement.repository.SupplierAttributeRepository;
import com.productmanagement.repository.SupplierBasicFieldRepository;
import com.productmanagement.repository.SupplierCodeRuleRepository;
import com.productmanagement.service.SupplierCodeRuleService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class SupplierCodeRuleServiceImpl implements SupplierCodeRuleService {
    
    private final SupplierCodeRuleRepository repository;
    private final SupplierBasicFieldRepository basicFieldRepository;
    private final SupplierAttributeRepository attributeRepository;
    private final ProductAttributeRepository productAttributeRepository;
    
    @Override
    public List<SupplierCodeRuleDTO> getAllRules() {
        return repository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }
    
    @Override
    public SupplierCodeRuleDTO getRuleById(Long id) {
        SupplierCodeRule rule = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("编码规则不存在: " + id));
        return toDTO(rule);
    }
    
    @Override
    @Transactional
    public SupplierCodeRuleDTO createRule(SupplierCodeRuleDTO request) {
        SupplierCodeRule rule = new SupplierCodeRule();
        // 支持两种命名格式（camelCase和snake_case）
        String ruleName = request.getRuleName();
        if (ruleName == null) {
            // 尝试从Map中获取snake_case格式的字段
            try {
                @SuppressWarnings("unchecked")
                java.util.Map<String, Object> map = new com.fasterxml.jackson.databind.ObjectMapper()
                    .convertValue(request, java.util.Map.class);
                ruleName = (String) map.get("rule_name");
            } catch (Exception e) {
                log.warn("Failed to get rule_name from map: {}", e.getMessage());
            }
        }
        rule.setRuleName(ruleName);
        rule.setElements(request.getElements());
        rule.setIsActive(request.getIsActive() != null ? request.getIsActive() : true);
        
        SupplierCodeRule saved = repository.save(rule);
        log.info("创建供应商编码规则成功，ID: {}", saved.getId());
        return toDTO(saved);
    }
    
    @Override
    @Transactional
    public SupplierCodeRuleDTO updateRule(Long id, SupplierCodeRuleDTO request) {
        SupplierCodeRule rule = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("编码规则不存在: " + id));
        
        if (request.getRuleName() != null) rule.setRuleName(request.getRuleName());
        if (request.getElements() != null) rule.setElements(request.getElements());
        if (request.getIsActive() != null) rule.setIsActive(request.getIsActive());
        
        SupplierCodeRule updated = repository.save(rule);
        log.info("更新供应商编码规则成功，ID: {}", updated.getId());
        return toDTO(updated);
    }
    
    @Override
    @Transactional
    public void deleteRule(Long id) {
        if (!repository.existsById(id)) {
            throw new RuntimeException("编码规则不存在: " + id);
        }
        repository.deleteById(id);
        log.info("删除供应商编码规则成功，ID: {}", id);
    }
    
    @Override
    public List<Map<String, String>> getBasicFieldVariables() {
        List<Map<String, String>> variables = new ArrayList<>();
        try {
            List<SupplierBasicField> fields = basicFieldRepository.findByEnabledTrueOrderBySortOrderAsc();
            for (SupplierBasicField field : fields) {
                Map<String, String> variable = new HashMap<>();
                variable.put("value", field.getFieldCode());
                variable.put("label", field.getDisplayName() != null ? field.getDisplayName() : field.getFieldName());
                variable.put("description", "基本字段：" + (field.getDisplayName() != null ? field.getDisplayName() : field.getFieldName()));
                variables.add(variable);
            }
        } catch (Exception e) {
            log.warn("获取供应商基本字段变量失败: {}", e.getMessage());
        }
        return variables;
    }
    
    @Override
    public List<Map<String, String>> getAttributeVariables() {
        List<Map<String, String>> variables = new ArrayList<>();
        try {
            List<SupplierAttribute> attrs = attributeRepository.findByEnabledTrueOrderBySortOrderAsc();
            for (SupplierAttribute attr : attrs) {
                Map<String, String> variable = new HashMap<>();
                variable.put("value", attr.getCode());
                variable.put("label", attr.getName());
                variable.put("description", "供应商属性：" + attr.getName());
                variables.add(variable);
            }
        } catch (Exception e) {
            log.warn("获取供应商属性变量失败: {}", e.getMessage());
        }
        return variables;
    }
    
    @Override
    public List<Map<String, String>> getProductAttributeVariables() {
        List<Map<String, String>> variables = new ArrayList<>();
        try {
            List<ProductAttribute> attrs = productAttributeRepository.findByEnabledTrueOrderBySortOrderAsc();
            for (ProductAttribute attr : attrs) {
                Map<String, String> variable = new HashMap<>();
                variable.put("value", "product_" + attr.getCode());
                variable.put("label", attr.getName());
                variable.put("description", "商品属性：" + attr.getName());
                variables.add(variable);
            }
        } catch (Exception e) {
            log.warn("获取商品属性变量失败: {}", e.getMessage());
        }
        return variables;
    }
    
    private SupplierCodeRuleDTO toDTO(SupplierCodeRule rule) {
        return SupplierCodeRuleDTO.builder()
                .id(rule.getId())
                .ruleName(rule.getRuleName())
                .elements(rule.getElements())
                .isActive(rule.getIsActive())
                .createdAt(rule.getCreatedAt())
                .updatedAt(rule.getUpdatedAt())
                .build();
    }
}
