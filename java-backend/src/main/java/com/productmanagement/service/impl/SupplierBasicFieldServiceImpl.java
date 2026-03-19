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
        return repository.findAllByOrderBySortOrderAsc().stream()
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
        field.setFieldCode(request.getFieldCode());
        field.setFieldType(request.getFieldType());
        field.setIsRequired(request.getIsRequired() != null ? request.getIsRequired() : false);
        field.setOptions(request.getOptions());
        field.setSortOrder(request.getSortOrder() != null ? request.getSortOrder() : 0);
        
        SupplierBasicField saved = repository.save(field);
        return toDTO(saved);
    }
    
    @Override
    @Transactional
    public SupplierBasicFieldDTO updateField(Integer id, SupplierBasicFieldDTO request) {
        SupplierBasicField field = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("供应商字段不存在: " + id));
        
        if (request.getFieldName() != null) field.setFieldName(request.getFieldName());
        if (request.getFieldCode() != null) field.setFieldCode(request.getFieldCode());
        if (request.getFieldType() != null) field.setFieldType(request.getFieldType());
        if (request.getIsRequired() != null) field.setIsRequired(request.getIsRequired());
        if (request.getOptions() != null) field.setOptions(request.getOptions());
        if (request.getSortOrder() != null) field.setSortOrder(request.getSortOrder());
        
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
        dto.setFieldCode(field.getFieldCode());
        dto.setFieldType(field.getFieldType());
        dto.setIsRequired(field.getIsRequired());
        dto.setOptions(field.getOptions());
        dto.setSortOrder(field.getSortOrder());
        dto.setCreatedAt(field.getCreatedAt());
        dto.setUpdatedAt(field.getUpdatedAt());
        return dto;
    }
}
