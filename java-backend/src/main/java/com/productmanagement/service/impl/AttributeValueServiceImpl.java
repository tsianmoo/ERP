package com.productmanagement.service.impl;

import com.productmanagement.dto.AttributeValueDTO;
import com.productmanagement.entity.ProductAttributeValue;
import com.productmanagement.repository.ProductAttributeValueRepository;
import com.productmanagement.service.AttributeValueService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AttributeValueServiceImpl implements AttributeValueService {
    
    private final ProductAttributeValueRepository repository;
    
    @Override
    public List<AttributeValueDTO> getAllValues() {
        return repository.findAllOrderBySortOrder().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }
    
    @Override
    public List<AttributeValueDTO> getValuesByAttributeId(Integer attributeId) {
        return repository.findByAttributeIdOrderBySortOrderAsc(attributeId).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }
    
    @Override
    @Transactional
    public AttributeValueDTO createValue(AttributeValueDTO request) {
        ProductAttributeValue value = new ProductAttributeValue();
        value.setAttributeId(request.getAttributeId());
        value.setName(request.getName());
        value.setCode(request.getCode());
        value.setParentId(request.getParentId());
        value.setSortOrder(request.getSortOrder() != null ? request.getSortOrder() : 0);
        
        ProductAttributeValue saved = repository.save(value);
        log.info("创建属性值成功，ID: {}", saved.getId());
        return toDTO(saved);
    }
    
    @Override
    @Transactional
    public AttributeValueDTO updateValue(Integer id, AttributeValueDTO request) {
        ProductAttributeValue value = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("属性值不存在: " + id));
        
        if (request.getName() != null) value.setName(request.getName());
        if (request.getCode() != null) value.setCode(request.getCode());
        if (request.getParentId() != null) value.setParentId(request.getParentId());
        if (request.getSortOrder() != null) value.setSortOrder(request.getSortOrder());
        
        ProductAttributeValue updated = repository.save(value);
        log.info("更新属性值成功，ID: {}", updated.getId());
        return toDTO(updated);
    }
    
    @Override
    @Transactional
    public void deleteValue(Integer id) {
        if (!repository.existsById(id)) {
            throw new RuntimeException("属性值不存在: " + id);
        }
        repository.deleteById(id);
        log.info("删除属性值成功，ID: {}", id);
    }
    
    private AttributeValueDTO toDTO(ProductAttributeValue value) {
        return AttributeValueDTO.builder()
                .id(value.getId())
                .attributeId(value.getAttributeId())
                .name(value.getName())
                .code(value.getCode())
                .parentId(value.getParentId())
                .sortOrder(value.getSortOrder())
                .createdAt(value.getCreatedAt())
                .updatedAt(value.getUpdatedAt())
                .build();
    }
}
