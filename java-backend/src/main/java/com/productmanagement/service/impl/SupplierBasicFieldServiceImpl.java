package com.productmanagement.service.impl;

import com.productmanagement.dto.SupplierBasicFieldDTO;
import com.productmanagement.entity.ProductAttribute;
import com.productmanagement.entity.SupplierBasicField;
import com.productmanagement.repository.ProductAttributeRepository;
import com.productmanagement.repository.SupplierBasicFieldRepository;
import com.productmanagement.service.SupplierBasicFieldService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SupplierBasicFieldServiceImpl implements SupplierBasicFieldService {
    
    private final SupplierBasicFieldRepository repository;
    private final ProductAttributeRepository productAttributeRepository;
    
    @Override
    public List<SupplierBasicFieldDTO> getAllFields() {
        return repository.findAllByOrderBySortOrderAsc().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }
    
    @Override
    public List<SupplierBasicFieldDTO> getEnabledFields() {
        return repository.findByEnabledTrueOrderBySortOrderAsc().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }
    
    @Override
    public SupplierBasicFieldDTO getFieldById(Integer id) {
        SupplierBasicField field = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("供应商字段不存在: " + id));
        return toDTO(field);
    }
    
    @Override
    @Transactional
    public SupplierBasicFieldDTO createField(SupplierBasicFieldDTO request) {
        SupplierBasicField field = new SupplierBasicField();
        field.setFieldName(request.getFieldName());
        field.setDisplayName(request.getDisplayName());
        field.setFieldCode(request.getFieldCode());
        field.setFieldType(request.getFieldType());
        field.setIsRequired(request.getIsRequired() != null ? request.getIsRequired() : false);
        field.setOptions(request.getOptions());
        field.setDefaultValue(request.getDefaultValue());
        field.setSortOrder(request.getSortOrder() != null ? request.getSortOrder() : 0);
        field.setEnabled(request.getEnabled() != null ? request.getEnabled() : true);
        
        // 分组相关字段
        field.setWidth(request.getWidth() != null ? request.getWidth() : 100);
        field.setColumns(request.getColumns() != null ? request.getColumns() : 1);
        field.setColumnWidth(request.getColumnWidth() != null ? request.getColumnWidth() : 1);
        field.setSpacing(request.getSpacing() != null ? request.getSpacing() : 2);
        field.setRowIndex(request.getRowIndex() != null ? request.getRowIndex() : 1);
        field.setNewRow(request.getNewRow() != null ? request.getNewRow() : false);
        field.setGroupSortOrder(request.getGroupSortOrder() != null ? request.getGroupSortOrder() : 0);
        field.setGroupId(request.getGroupId());
        field.setGroupName(request.getGroupName());
        
        // 自动生成相关字段
        field.setAutoGenerate(request.getAutoGenerate() != null ? request.getAutoGenerate() : false);
        field.setCodeRuleId(request.getCodeRuleId());
        
        // 关联商品属性
        field.setLinkedProductAttributeId(request.getLinkedProductAttributeId());
        
        SupplierBasicField saved = repository.save(field);
        return toDTO(saved);
    }
    
    @Override
    @Transactional
    public SupplierBasicFieldDTO updateField(Integer id, SupplierBasicFieldDTO request) {
        SupplierBasicField field = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("供应商字段不存在: " + id));
        
        if (request.getFieldName() != null) field.setFieldName(request.getFieldName());
        if (request.getDisplayName() != null) field.setDisplayName(request.getDisplayName());
        if (request.getFieldCode() != null) field.setFieldCode(request.getFieldCode());
        if (request.getFieldType() != null) field.setFieldType(request.getFieldType());
        if (request.getIsRequired() != null) field.setIsRequired(request.getIsRequired());
        if (request.getOptions() != null) field.setOptions(request.getOptions());
        if (request.getDefaultValue() != null) field.setDefaultValue(request.getDefaultValue());
        if (request.getSortOrder() != null) field.setSortOrder(request.getSortOrder());
        if (request.getEnabled() != null) field.setEnabled(request.getEnabled());
        
        // 分组相关字段
        if (request.getWidth() != null) field.setWidth(request.getWidth());
        if (request.getColumns() != null) field.setColumns(request.getColumns());
        if (request.getColumnWidth() != null) field.setColumnWidth(request.getColumnWidth());
        if (request.getSpacing() != null) field.setSpacing(request.getSpacing());
        if (request.getRowIndex() != null) field.setRowIndex(request.getRowIndex());
        if (request.getNewRow() != null) field.setNewRow(request.getNewRow());
        if (request.getGroupSortOrder() != null) field.setGroupSortOrder(request.getGroupSortOrder());
        if (request.getGroupId() != null) field.setGroupId(request.getGroupId());
        if (request.getGroupName() != null) field.setGroupName(request.getGroupName());
        
        // 自动生成相关字段
        if (request.getAutoGenerate() != null) field.setAutoGenerate(request.getAutoGenerate());
        if (request.getCodeRuleId() != null) field.setCodeRuleId(request.getCodeRuleId());
        
        // 关联商品属性
        if (request.getLinkedProductAttributeId() != null) {
            field.setLinkedProductAttributeId(request.getLinkedProductAttributeId());
        }
        
        SupplierBasicField saved = repository.save(field);
        return toDTO(saved);
    }
    
    @Override
    @Transactional
    public void deleteField(Integer id) {
        if (!repository.existsById(id)) {
            throw new RuntimeException("供应商字段不存在: " + id);
        }
        repository.deleteById(id);
    }
    
    private SupplierBasicFieldDTO toDTO(SupplierBasicField field) {
        // 获取关联的商品属性信息
        SupplierBasicFieldDTO.LinkedProductAttributeDTO linkedProductAttribute = null;
        if (field.getLinkedProductAttributeId() != null) {
            Optional<ProductAttribute> productAttr = productAttributeRepository.findById(field.getLinkedProductAttributeId());
            if (productAttr.isPresent()) {
                linkedProductAttribute = SupplierBasicFieldDTO.LinkedProductAttributeDTO.builder()
                        .id(productAttr.get().getId())
                        .name(productAttr.get().getName())
                        .code(productAttr.get().getCode())
                        .build();
            }
        }
        
        return SupplierBasicFieldDTO.builder()
                .id(field.getId())
                .fieldName(field.getFieldName())
                .displayName(field.getDisplayName())
                .fieldCode(field.getFieldCode())
                .fieldType(field.getFieldType())
                .isRequired(field.getIsRequired())
                .options(field.getOptions())
                .defaultValue(field.getDefaultValue())
                .sortOrder(field.getSortOrder())
                .enabled(field.getEnabled())
                .width(field.getWidth())
                .columns(field.getColumns())
                .columnWidth(field.getColumnWidth())
                .spacing(field.getSpacing())
                .rowIndex(field.getRowIndex())
                .newRow(field.getNewRow())
                .groupSortOrder(field.getGroupSortOrder())
                .groupId(field.getGroupId())
                .groupName(field.getGroupName())
                .group(field.getGroup() != null ? SupplierBasicFieldDTO.FieldGroupDTO.builder()
                        .id(field.getGroup().getId())
                        .name(field.getGroup().getName())
                        .build() : null)
                .autoGenerate(field.getAutoGenerate())
                .codeRuleId(field.getCodeRuleId())
                .linkedProductAttributeId(field.getLinkedProductAttributeId())
                .linkedProductAttribute(linkedProductAttribute)
                .createdAt(field.getCreatedAt())
                .updatedAt(field.getUpdatedAt())
                .build();
    }
}
