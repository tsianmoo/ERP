package com.productmanagement.service.impl;

import com.productmanagement.dto.CodeRuleDTO;
import com.productmanagement.entity.ProductAttribute;
import com.productmanagement.entity.ProductBasicField;
import com.productmanagement.entity.ProductCodeRule;
import com.productmanagement.repository.ProductAttributeRepository;
import com.productmanagement.repository.ProductBasicFieldRepository;
import com.productmanagement.repository.ProductCodeRuleRepository;
import com.productmanagement.service.CodeRuleService;
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
public class CodeRuleServiceImpl implements CodeRuleService {
    
    private final ProductCodeRuleRepository repository;
    private final ProductBasicFieldRepository basicFieldRepository;
    private final ProductAttributeRepository attributeRepository;
    
    @Override
    public List<CodeRuleDTO> getAllRules() {
        return repository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }
    
    @Override
    public CodeRuleDTO getRuleById(Long id) {
        ProductCodeRule rule = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("编码规则不存在: " + id));
        return toDTO(rule);
    }
    
    @Override
    @Transactional
    public CodeRuleDTO createRule(CodeRuleDTO request) {
        ProductCodeRule rule = new ProductCodeRule();
        rule.setRuleName(request.getRuleName());
        rule.setElements(request.getElements());
        rule.setIsActive(request.getIsActive() != null ? request.getIsActive() : true);
        rule.setBarcodeEnabled(request.getBarcodeEnabled());
        rule.setBarcodeSuffix(request.getBarcodeSuffix());
        rule.setBarcodeElements(request.getBarcodeElements());
        
        ProductCodeRule saved = repository.save(rule);
        log.info("创建编码规则成功，ID: {}", saved.getId());
        return toDTO(saved);
    }
    
    @Override
    @Transactional
    public CodeRuleDTO updateRule(Long id, CodeRuleDTO request) {
        ProductCodeRule rule = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("编码规则不存在: " + id));
        
        if (request.getRuleName() != null) rule.setRuleName(request.getRuleName());
        if (request.getElements() != null) rule.setElements(request.getElements());
        if (request.getIsActive() != null) rule.setIsActive(request.getIsActive());
        if (request.getBarcodeEnabled() != null) rule.setBarcodeEnabled(request.getBarcodeEnabled());
        if (request.getBarcodeSuffix() != null) rule.setBarcodeSuffix(request.getBarcodeSuffix());
        if (request.getBarcodeElements() != null) rule.setBarcodeElements(request.getBarcodeElements());
        
        ProductCodeRule updated = repository.save(rule);
        log.info("更新编码规则成功，ID: {}", updated.getId());
        return toDTO(updated);
    }
    
    @Override
    @Transactional
    public void deleteRule(Long id) {
        if (!repository.existsById(id)) {
            throw new RuntimeException("编码规则不存在: " + id);
        }
        repository.deleteById(id);
        log.info("删除编码规则成功，ID: {}", id);
    }
    
    @Override
    public List<Map<String, String>> getBasicFieldVariables() {
        List<Map<String, String>> variables = new ArrayList<>();
        try {
            List<ProductBasicField> fields = basicFieldRepository.findByEnabledTrueOrderBySortOrderAsc();
            for (ProductBasicField field : fields) {
                Map<String, String> variable = new HashMap<>();
                variable.put("value", field.getFieldCode());
                variable.put("label", field.getDisplayName() != null ? field.getDisplayName() : field.getFieldName());
                variable.put("description", "基本字段：" + (field.getDisplayName() != null ? field.getDisplayName() : field.getFieldName()));
                variables.add(variable);
            }
        } catch (Exception e) {
            log.warn("获取基本字段变量失败: {}", e.getMessage());
        }
        return variables;
    }
    
    @Override
    public List<Map<String, String>> getAttributeVariables() {
        List<Map<String, String>> variables = new ArrayList<>();
        try {
            List<ProductAttribute> attrs = attributeRepository.findByEnabledTrueOrderBySortOrderAsc();
            for (ProductAttribute attr : attrs) {
                Map<String, String> variable = new HashMap<>();
                variable.put("value", attr.getCode());
                variable.put("label", attr.getName());
                variable.put("description", "商品属性：" + attr.getName());
                variables.add(variable);
            }
        } catch (Exception e) {
            log.warn("获取属性变量失败: {}", e.getMessage());
        }
        return variables;
    }
    
    @SuppressWarnings("unchecked")
    private CodeRuleDTO toDTO(ProductCodeRule rule) {
        return CodeRuleDTO.builder()
                .id(rule.getId())
                .ruleName(rule.getRuleName())
                .elements(rule.getElements())
                .isActive(rule.getIsActive())
                .barcodeEnabled(rule.getBarcodeEnabled())
                .barcodeSuffix(rule.getBarcodeSuffix())
                .barcodeElements(rule.getBarcodeElements())
                .createdAt(rule.getCreatedAt())
                .updatedAt(rule.getUpdatedAt())
                .build();
    }
}
