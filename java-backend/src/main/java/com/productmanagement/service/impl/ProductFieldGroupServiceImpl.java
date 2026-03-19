package com.productmanagement.service.impl;

import com.productmanagement.dto.ProductFieldGroupDTO;
import com.productmanagement.entity.ProductFieldGroup;
import com.productmanagement.repository.ProductFieldGroupRepository;
import com.productmanagement.service.ProductFieldGroupService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProductFieldGroupServiceImpl implements ProductFieldGroupService {
    
    private final ProductFieldGroupRepository repository;
    
    @Override
    public List<ProductFieldGroupDTO> getAllGroups() {
        return repository.findAllByOrderBySortOrderAsc().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }
    
    @Override
    public ProductFieldGroupDTO getGroupById(Integer id) {
        ProductFieldGroup group = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("字段分组不存在: " + id));
        return toDTO(group);
    }
    
    @Override
    @Transactional
    public ProductFieldGroupDTO createGroup(ProductFieldGroupDTO request) {
        ProductFieldGroup group = new ProductFieldGroup();
        group.setName(request.getName());
        group.setSortOrder(request.getSortOrder() != null ? request.getSortOrder() : 0);
        
        ProductFieldGroup saved = repository.save(group);
        return toDTO(saved);
    }
    
    @Override
    @Transactional
    public ProductFieldGroupDTO updateGroup(Integer id, ProductFieldGroupDTO request) {
        ProductFieldGroup group = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("字段分组不存在: " + id));
        
        if (request.getName() != null) group.setName(request.getName());
        if (request.getSortOrder() != null) group.setSortOrder(request.getSortOrder());
        
        ProductFieldGroup saved = repository.save(group);
        return toDTO(saved);
    }
    
    @Override
    @Transactional
    public void deleteGroup(Integer id) {
        if (!repository.existsById(id)) {
            throw new RuntimeException("字段分组不存在: " + id);
        }
        repository.deleteById(id);
    }
    
    private ProductFieldGroupDTO toDTO(ProductFieldGroup group) {
        ProductFieldGroupDTO dto = new ProductFieldGroupDTO();
        dto.setId(group.getId());
        dto.setName(group.getName());
        dto.setSortOrder(group.getSortOrder());
        dto.setCreatedAt(group.getCreatedAt());
        dto.setUpdatedAt(group.getUpdatedAt());
        return dto;
    }
}
