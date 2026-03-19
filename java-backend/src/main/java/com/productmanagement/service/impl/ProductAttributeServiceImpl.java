package com.productmanagement.service.impl;

import com.productmanagement.dto.ProductAttributeDTO;
import com.productmanagement.entity.ProductAttribute;
import com.productmanagement.entity.ProductAttributeGroup;
import com.productmanagement.repository.ProductAttributeRepository;
import com.productmanagement.repository.ProductAttributeGroupRepository;
import com.productmanagement.service.ProductAttributeService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProductAttributeServiceImpl implements ProductAttributeService {
    
    private final ProductAttributeRepository attributeRepository;
    private final ProductAttributeGroupRepository groupRepository;
    
    @Override
    public List<ProductAttributeDTO> getAllAttributes() {
        List<ProductAttribute> attributes = attributeRepository.findAllWithGroupOrderBySortOrder();
        return attributes.stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }
    
    @Override
    public ProductAttributeDTO getAttributeById(Integer id) {
        ProductAttribute attribute = attributeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("属性不存在: " + id));
        return toDTO(attribute);
    }
    
    @Override
    @Transactional
    public ProductAttributeDTO createAttribute(ProductAttributeDTO request) {
        ProductAttribute attribute = new ProductAttribute();
        attribute.setName(request.getName());
        attribute.setCode(request.getCode());
        attribute.setAttributeCode(request.getAttributeCode());
        attribute.setSortOrder(request.getSortOrder() != null ? request.getSortOrder() : 0);
        attribute.setCodeLength(request.getCodeLength() != null ? request.getCodeLength() : 2);
        attribute.setEnabled(request.getEnabled() != null ? request.getEnabled() : true);
        attribute.setWidth(request.getWidth());
        attribute.setColumns(request.getColumns());
        attribute.setColumnWidth(request.getColumnWidth());
        attribute.setSpacing(request.getSpacing());
        attribute.setRowIndex(request.getRowIndex());
        attribute.setNewRow(request.getNewRow());
        attribute.setGroupSortOrder(request.getGroupSortOrder());
        attribute.setIsRequired(request.getIsRequired());
        attribute.setGroupId(request.getGroupId());
        
        ProductAttribute savedAttribute = attributeRepository.save(attribute);
        log.info("创建属性成功，ID: {}", savedAttribute.getId());
        return toDTO(savedAttribute);
    }
    
    @Override
    @Transactional
    public ProductAttributeDTO updateAttribute(Integer id, ProductAttributeDTO request) {
        ProductAttribute attribute = attributeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("属性不存在: " + id));
        
        if (request.getName() != null) {
            attribute.setName(request.getName());
        }
        if (request.getCode() != null) {
            attribute.setCode(request.getCode());
        }
        if (request.getAttributeCode() != null) {
            attribute.setAttributeCode(request.getAttributeCode());
        }
        if (request.getSortOrder() != null) {
            attribute.setSortOrder(request.getSortOrder());
        }
        if (request.getCodeLength() != null) {
            attribute.setCodeLength(request.getCodeLength());
        }
        if (request.getEnabled() != null) {
            attribute.setEnabled(request.getEnabled());
        }
        if (request.getWidth() != null) {
            attribute.setWidth(request.getWidth());
        }
        if (request.getColumns() != null) {
            attribute.setColumns(request.getColumns());
        }
        if (request.getColumnWidth() != null) {
            attribute.setColumnWidth(request.getColumnWidth());
        }
        if (request.getSpacing() != null) {
            attribute.setSpacing(request.getSpacing());
        }
        if (request.getRowIndex() != null) {
            attribute.setRowIndex(request.getRowIndex());
        }
        if (request.getNewRow() != null) {
            attribute.setNewRow(request.getNewRow());
        }
        if (request.getGroupSortOrder() != null) {
            attribute.setGroupSortOrder(request.getGroupSortOrder());
        }
        if (request.getIsRequired() != null) {
            attribute.setIsRequired(request.getIsRequired());
        }
        if (request.getGroupId() != null) {
            attribute.setGroupId(request.getGroupId());
        }
        
        ProductAttribute updatedAttribute = attributeRepository.save(attribute);
        log.info("更新属性成功，ID: {}", updatedAttribute.getId());
        return toDTO(updatedAttribute);
    }
    
    @Override
    @Transactional
    public void deleteAttribute(Integer id) {
        if (!attributeRepository.existsById(id)) {
            throw new RuntimeException("属性不存在: " + id);
        }
        attributeRepository.deleteById(id);
        log.info("删除属性成功，ID: {}", id);
    }
    
    private ProductAttributeDTO toDTO(ProductAttribute attribute) {
        ProductAttributeDTO.ProductAttributeGroupDTO groupDTO = null;
        if (attribute.getGroup() != null) {
            groupDTO = ProductAttributeDTO.ProductAttributeGroupDTO.builder()
                    .id(attribute.getGroup().getId())
                    .name(attribute.getGroup().getName())
                    .build();
        }
        
        return ProductAttributeDTO.builder()
                .id(attribute.getId())
                .name(attribute.getName())
                .code(attribute.getCode())
                .attributeCode(attribute.getAttributeCode())
                .sortOrder(attribute.getSortOrder())
                .codeLength(attribute.getCodeLength())
                .enabled(attribute.getEnabled())
                .width(attribute.getWidth())
                .columns(attribute.getColumns())
                .columnWidth(attribute.getColumnWidth())
                .spacing(attribute.getSpacing())
                .rowIndex(attribute.getRowIndex())
                .newRow(attribute.getNewRow())
                .groupSortOrder(attribute.getGroupSortOrder())
                .isRequired(attribute.getIsRequired())
                .groupId(attribute.getGroupId())
                .group(groupDTO)
                .createdAt(attribute.getCreatedAt())
                .updatedAt(attribute.getUpdatedAt())
                .build();
    }
}
