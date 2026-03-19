package com.productmanagement.service.impl;

import com.productmanagement.dto.SupplierBasicFieldDTO;
import com.productmanagement.entity.SupplierBasicField;
import com.productmanagement.repository.SupplierBasicFieldRepository;
import com.productmanagement.service.SupplierBasicFieldService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SupplierBasicFieldServiceImpl implements SupplierBasicFieldService {
    
    private final SupplierBasicFieldRepository repository;
    
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
        field.setDbFieldName(request.getDbFieldName());
        field.setFieldType(request.getFieldType());
        field.setIsRequired(request.getIsRequired() != null ? request.getIsRequired() : false);
        field.setOptions(request.getOptions());
        field.setSortOrder(request.getSortOrder() != null ? request.getSortOrder() : 0);
        field.setEnabled(request.getEnabled() != null ? request.getEnabled() : true);
        field.setWidth(request.getWidth() != null ? request.getWidth() : 100);
        field.setColumns(request.getColumns() != null ? request.getColumns() : 1);
        field.setColumnWidth(request.getColumnWidth() != null ? request.getColumnWidth() : 1);
        field.setSpacing(request.getSpacing() != null ? request.getSpacing() : 2);
        field.setRowIndex(request.getRowIndex() != null ? request.getRowIndex() : 1);
        field.setNewRow(request.getNewRow() != null ? request.getNewRow() : false);
        field.setGroupSortOrder(request.getGroupSortOrder() != null ? request.getGroupSortOrder() : 0);
        field.setGroupName(request.getGroupName());
        field.setGroupId(request.getGroupId());
        
        SupplierBasicField saved = repository.save(field);
        return toDTO(saved);
    }
    
    @Override
    @Transactional
    public SupplierBasicFieldDTO updateField(Integer id, SupplierBasicFieldDTO request) {
        SupplierBasicField field = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("供应商字段不存在: " + id));
        
        if (request.getFieldName() != null) field.setFieldName(request.getFieldName());
        if (request.getDbFieldName() != null) field.setDbFieldName(request.getDbFieldName());
        if (request.getFieldType() != null) field.setFieldType(request.getFieldType());
        if (request.getIsRequired() != null) field.setIsRequired(request.getIsRequired());
        if (request.getOptions() != null) field.setOptions(request.getOptions());
        if (request.getSortOrder() != null) field.setSortOrder(request.getSortOrder());
        if (request.getEnabled() != null) field.setEnabled(request.getEnabled());
        if (request.getWidth() != null) field.setWidth(request.getWidth());
        if (request.getColumns() != null) field.setColumns(request.getColumns());
        if (request.getColumnWidth() != null) field.setColumnWidth(request.getColumnWidth());
        if (request.getSpacing() != null) field.setSpacing(request.getSpacing());
        if (request.getRowIndex() != null) field.setRowIndex(request.getRowIndex());
        if (request.getNewRow() != null) field.setNewRow(request.getNewRow());
        if (request.getGroupSortOrder() != null) field.setGroupSortOrder(request.getGroupSortOrder());
        if (request.getGroupName() != null) field.setGroupName(request.getGroupName());
        if (request.getGroupId() != null) field.setGroupId(request.getGroupId());
        
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
        SupplierBasicFieldDTO dto = new SupplierBasicFieldDTO();
        dto.setId(field.getId());
        dto.setFieldName(field.getFieldName());
        dto.setDbFieldName(field.getDbFieldName());
        dto.setFieldType(field.getFieldType());
        dto.setIsRequired(field.getIsRequired());
        dto.setOptions(field.getOptions());
        dto.setSortOrder(field.getSortOrder());
        dto.setEnabled(field.getEnabled());
        dto.setWidth(field.getWidth());
        dto.setColumns(field.getColumns());
        dto.setColumnWidth(field.getColumnWidth());
        dto.setSpacing(field.getSpacing());
        dto.setRowIndex(field.getRowIndex());
        dto.setNewRow(field.getNewRow());
        dto.setGroupSortOrder(field.getGroupSortOrder());
        dto.setGroupName(field.getGroupName());
        dto.setGroupId(field.getGroupId());
        dto.setCreatedAt(field.getCreatedAt());
        dto.setUpdatedAt(field.getUpdatedAt());
        return dto;
    }
}
