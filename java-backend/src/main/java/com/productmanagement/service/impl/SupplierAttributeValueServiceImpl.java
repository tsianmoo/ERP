package com.productmanagement.service.impl;

import com.productmanagement.dto.SupplierAttributeValueDTO;
import com.productmanagement.entity.SupplierAttributeValue;
import com.productmanagement.repository.SupplierAttributeValueRepository;
import com.productmanagement.service.SupplierAttributeValueService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class SupplierAttributeValueServiceImpl implements SupplierAttributeValueService {
    
    private final SupplierAttributeValueRepository valueRepository;
    
    @Override
    public List<SupplierAttributeValueDTO> getAllValues() {
        return valueRepository.findAll().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }
    
    @Override
    public List<SupplierAttributeValueDTO> getValuesByAttributeId(Integer attributeId) {
        return valueRepository.findByAttributeIdOrderBySortOrderAsc(attributeId).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }
    
    @Override
    public SupplierAttributeValueDTO getValueById(Integer id) {
        SupplierAttributeValue value = valueRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("属性值不存在: " + id));
        return toDTO(value);
    }
    
    @Override
    @Transactional
    public SupplierAttributeValueDTO createValue(SupplierAttributeValueDTO request) {
        SupplierAttributeValue value = new SupplierAttributeValue();
        value.setAttributeId(request.getAttributeId());
        value.setName(request.getName());
        value.setCode(request.getCode());
        value.setSortOrder(request.getSortOrder() != null ? request.getSortOrder() : 0);
        
        SupplierAttributeValue savedValue = valueRepository.save(value);
        log.info("创建供应商属性值成功，ID: {}", savedValue.getId());
        return toDTO(savedValue);
    }
    
    @Override
    @Transactional
    public SupplierAttributeValueDTO updateValue(Integer id, SupplierAttributeValueDTO request) {
        SupplierAttributeValue value = valueRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("属性值不存在: " + id));
        
        if (request.getName() != null) {
            value.setName(request.getName());
        }
        if (request.getCode() != null) {
            value.setCode(request.getCode());
        }
        if (request.getSortOrder() != null) {
            value.setSortOrder(request.getSortOrder());
        }
        
        SupplierAttributeValue updatedValue = valueRepository.save(value);
        log.info("更新供应商属性值成功，ID: {}", updatedValue.getId());
        return toDTO(updatedValue);
    }
    
    @Override
    @Transactional
    public void deleteValue(Integer id) {
        if (!valueRepository.existsById(id)) {
            throw new RuntimeException("属性值不存在: " + id);
        }
        valueRepository.deleteById(id);
        log.info("删除供应商属性值成功，ID: {}", id);
    }
    
    private SupplierAttributeValueDTO toDTO(SupplierAttributeValue value) {
        return SupplierAttributeValueDTO.builder()
                .id(value.getId())
                .attributeId(value.getAttributeId())
                .name(value.getName())
                .code(value.getCode())
                .sortOrder(value.getSortOrder())
                .createdAt(value.getCreatedAt())
                .updatedAt(value.getUpdatedAt())
                .build();
    }
}
